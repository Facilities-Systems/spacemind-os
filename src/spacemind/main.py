"""
SpaceMind OS — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from spacemind.api.routes import router
from spacemind.core.config import settings
from spacemind.core.logging import log
from spacemind.storage.database import init_db


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", include_in_schema=False)
def root():
    return {
        "system": settings.app_name,
        "version": settings.app_version,
        "tagline": "The AI that thinks like a 30-year veteran Facilities Manager.",
        "docs": "/docs",
    }
