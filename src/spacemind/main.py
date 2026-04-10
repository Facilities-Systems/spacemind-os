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

from spacemind.api.routes import router
from spacemind.core.config import settings
from spacemind.core.logging import log
from spacemind.storage.database import init_db

# ─── Rate limiter (shared instance imported by routes) ────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[])


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info(f"Starting {settings.app_name} v{settings.app_version} [{settings.app_env}]")
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

# ─── Rate limiting ────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response logging middleware ────────────────────────────────────
@app.middleware("http")
async def logging_middleware(request: Request, call_next) -> Response:
    correlation_id = str(uuid.uuid4())[:8]
    request.state.correlation_id = correlation_id
    start = time.perf_counter()

    response: Response = await call_next(request)

    duration_ms = round((time.perf_counter() - start) * 1000, 1)
    log.info(
        f"[{correlation_id}] {request.method} {request.url.path} "
        f"→ {response.status_code} ({duration_ms}ms)"
    )
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Response-Time"] = f"{duration_ms}ms"
    return response


# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(router)


@app.get("/", include_in_schema=False)
def root():
    return {
        "system": settings.app_name,
        "version": settings.app_version,
        "tagline": "The AI that thinks like a 30-year veteran Facilities Manager.",
        "docs": "/docs",
    }
