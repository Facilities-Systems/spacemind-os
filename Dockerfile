# ─── SpaceMind OS — Single-container build ───────────────────────────────────
# Stage 1 builds the React SPA; Stage 2 bakes it into the Python image.
# FastAPI serves /assets/* and falls back to index.html for all SPA routes.
# One service, one URL, no nginx proxy needed.

# ─── Stage 1: React build ─────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline

COPY frontend/ .
RUN npm run build
# Output: /frontend/dist/


# ─── Stage 2: Python runtime + static files ───────────────────────────────────
FROM python:3.11-slim AS runtime

ARG APP_VERSION=local
LABEL org.opencontainers.image.title="SpaceMind OS"
LABEL org.opencontainers.image.description="AI-powered Facilities Operations Intelligence"
LABEL org.opencontainers.image.version="${APP_VERSION}"

# Runtime system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --gid 1001 spacemind \
    && useradd --uid 1001 --gid spacemind --shell /bin/bash --create-home spacemind

WORKDIR /app

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Backend source + Alembic
COPY backend/src/     ./src/
COPY backend/alembic/ ./alembic/
COPY backend/alembic.ini .

# Built React SPA → /app/static  (FastAPI serves this)
COPY --from=frontend-builder /frontend/dist ./static/

# Persistent data directory (SQLite fallback, uploads)
RUN mkdir -p /app/data && chown -R spacemind:spacemind /app

ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV APP_VERSION=${APP_VERSION}
# Path FastAPI uses to find the built SPA
ENV STATIC_DIR=/app/static

USER spacemind

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/v1/health || exit 1

# Railway injects $PORT; fall back to 8000 for local Docker runs
CMD ["sh", "-c", \
  "uvicorn spacemind.main:app \
   --host 0.0.0.0 \
   --port ${PORT:-8000} \
   --workers 2 \
   --log-level info \
   --no-access-log"]
