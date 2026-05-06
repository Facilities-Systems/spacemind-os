"""
SpaceMind OS — FastAPI Application Entry Point
Phase 3.1: Asset lifecycle management added.
"""
import os
import time
import traceback
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from spacemind.api.auth import router as auth_router
from spacemind.api.router_admin import router as admin_router
from spacemind.api.router_analytics import router as analytics_router
from spacemind.api.router_decompose import router as decompose_router
from spacemind.api.router_export import router as export_router
from spacemind.api.router_floorplans import router as floorplans_router
from spacemind.api.router_history import router as history_router
from spacemind.api.router_assets import router as assets_router
from spacemind.api.router_insights import router as insights_router
from spacemind.api.router_sensors import router as sensors_router
from spacemind.api.router_inventory import router as inventory_router
from spacemind.api.router_medical import router as medical_router
from spacemind.api.router_suppliers import router as suppliers_router
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
    try:
        # Ensure data/ directory exists for SQLite dev database
        if "sqlite" in settings.database_url and ":memory:" not in settings.database_url:
            db_path = settings.database_url.replace("sqlite:///", "")
            Path(db_path).parent.mkdir(parents=True, exist_ok=True)
            log.info(f"SQLite data directory ensured: {Path(db_path).parent}")

        # Production safety check
        if settings.is_production and settings.secret_key == "change-me-in-production-use-openssl-rand-hex-32":
            raise RuntimeError("SECRET_KEY must be changed before running in production.")

        # Sentry
        log.info("Initialising Sentry...")
        _init_sentry()
        log.info("Sentry step complete.")

        # Database
        log.info("Initialising database...")
        init_db()
        log.info("Database initialisation complete.")

        log.info(f"{settings.app_name} startup complete — ready to serve requests.")
    except Exception:
        log.critical(
            "STARTUP FAILED — unhandled exception during lifespan startup:\n"
            + traceback.format_exc()
        )
        raise

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
# In single-service deployment (React served by FastAPI) CORS is irrelevant
# because there's only one origin. This is kept for local dev where the Vite
# dev server runs on a different port.
if settings.is_production:
    _cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
else:
    _cors_origins = [o.strip() for o in settings.cors_dev_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Correlation-ID", "X-API-Key"],
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


# ─── API Routes ───────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(utility_router)
app.include_router(decompose_router)
app.include_router(history_router)
app.include_router(export_router)
app.include_router(analytics_router)
app.include_router(inventory_router)
app.include_router(medical_router)
app.include_router(suppliers_router)
app.include_router(floorplans_router)
app.include_router(assets_router)
app.include_router(sensors_router)
app.include_router(insights_router)


# ─── React SPA static files ───────────────────────────────────────────────────
# STATIC_DIR is set to /app/static in the production Dockerfile.
# In local dev (no build) this directory won't exist, so this block is skipped
# and the Vite dev server handles the frontend on its own port.
_static_dir = Path(os.environ.get("STATIC_DIR", "/app/static"))

if _static_dir.exists():
    # Vite outputs hashed JS/CSS bundles under /assets/
    _assets_dir = _static_dir / "assets"
    if _assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="assets")

    # Serve any other static files at the root level (favicon, manifest, etc.)
    _index = _static_dir / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str) -> FileResponse:
        """Return index.html for every non-API path so React Router handles navigation."""
        return FileResponse(str(_index))

    log.info(f"React SPA served from {_static_dir}")
else:
    # Dev mode: keep the JSON root for API introspection
    @app.get("/", include_in_schema=False)
    def root():
        return {
            "system": settings.app_name,
            "version": settings.app_version,
            "tagline": "The AI that thinks like a 30-year veteran Facilities Manager.",
            "docs": "/docs",
        }
