# ─── Stage 1: Python dependency builder ──────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build tools for compiled extensions (psycopg2, bcrypt, chromadb)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─── Stage 2: Lean runtime ────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

ARG APP_VERSION=local
LABEL org.opencontainers.image.title="SpaceMind OS API"
LABEL org.opencontainers.image.description="AI-powered Facilities Operations Intelligence"
LABEL org.opencontainers.image.version="${APP_VERSION}"

# Runtime-only system deps (libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Create non-root user
RUN groupadd --gid 1001 spacemind \
    && useradd --uid 1001 --gid spacemind --shell /bin/bash --create-home spacemind

WORKDIR /app

# Copy application source
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Create data dir (ChromaDB + SQLite dev fallback) — owned by app user
RUN mkdir -p /app/data/chromadb && chown -R spacemind:spacemind /app

ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV APP_VERSION=${APP_VERSION}

USER spacemind

EXPOSE 8000

# Health check — hits the open /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uvicorn", "spacemind.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--log-level", "info", \
     "--no-access-log"]
