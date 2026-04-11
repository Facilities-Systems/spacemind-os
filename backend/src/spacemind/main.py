"""
SpaceMind OS — FastAPI Application Entry Point
"""
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from spacemind.api.auth import router as auth_router
from spacemind.api.router_analytics import router as analytics_router
from spacemind.api.router_decompose import router as decompose_router
from spacemind.api.router_export import router as export_router
from spacemind.api.router_history import router as history_router
from spacemind.api.routes import router as utility_router
from spacemind.core.config import settings
from spacemind.core.logging import log
from spacemind.storage.database import init_db

# ─── Rate limiter (shared instance imported by routes) ────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[])


def _init_sentry() -> None:
    """Initialise Sentry SDK if DSN is configured."""
    if not settings.sentry_dsn:
        return
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.app_env,
            release=settings.app_version,
            traces_sample_rate=0.1 if settings.is_production else 1.0,
            integrations=[FastApiIntegration(), SqlalchemyIntegration()],
            # Never send PII to Sentry
            send_default_pii=False,
        )
        log.info(f"Sentry initialised (env={settings.app_env})")
    except ImportError:
        log.warning("sentry-sdk not installed — skipping Sentry init")
    except Exception as e:
        log.warning(f"Sentry init failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info(f"Starting {settings.app_name} v{settings.app_version} [{settings.app_env}]")
    _init_sentry()
    init_db()
    yield
    log.info("SpaceMind OS shutting down.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "The AI that thinks like a 30-year veteran Facilities Manager. "
        "Turn natural language into structured, sequenced, responsibility-aware execution plans."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── Prometheus metrics ───────────────────────────────────────────────────────
if settings.prometheus_enabled:
    try:
        from prometheus_fastapi_instrumentator import Instrumentator
        Instrumentator(
            should_group_status_codes=True,
            should_ignore_untemplated=True,
            should_respect_env_var=False,
            excluded_handlers=["/metrics", "/api/v1/health"],
        ).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
        log.info("Prometheus metrics exposed at /metrics")
    except ImportError:
        log.warning("prometheus-fastapi-instrumentator not installed — metrics disabled")

# ─── Rate limiting ────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
_cors_origins = (
    ["*"] if not settings.is_production
    else [o.strip() for o in getattr(settings, "cors_origins", "").split(",") if o.strip()]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Correlation-ID"],
)


# ─── Request / Response logging middleware ────────────────────────────────────
@app.middleware("http")
async def logging_middleware(request: Request, call_next) -> Response:
    correlation_id = str(uuid.uuid4())[:8]
    request.state.correlation_id = correlation_id
    start = time.perf_counter()

    response: Response = await call_next(request)

    duration_ms = round((time.perf_counter() - start) * 1000, 1)

    # Structured log entry — one line per request, parseable by log aggregators
    log.info(
        f"[{correlation_id}] {request.method} {request.url.path} "
        f"→ {response.status_code} ({duration_ms}ms)",
        extra={
            "correlation_id": correlation_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "client_ip": request.client.host if request.client else "unknown",
        },
    )

    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Response-Time"] = f"{duration_ms}ms"
    return response


# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(utility_router)
app.include_router(decompose_router)
app.include_router(history_router)
app.include_router(export_router)
app.include_router(analytics_router)


@app.get("/", include_in_schema=False)
def root():
    return {
        "system": settings.app_name,
        "version": settings.app_version,
        "tagline": "The AI that thinks like a 30-year veteran Facilities Manager.",
        "docs": "/docs",
    }
