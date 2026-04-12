#!/bin/sh
# SpaceMind OS — Railway startup script
# Railway injects $PORT. This script handles it explicitly so there's no
# shell quoting ambiguity from railway.toml's startCommand string.
set -e

PORT="${PORT:-8000}"

echo "============================================"
echo " SpaceMind OS — startup"
echo " PORT        = ${PORT}"
echo " APP_ENV     = ${APP_ENV:-development}"
echo " DATABASE_URL= ${DATABASE_URL:-sqlite (default)}"
echo " PYTHONPATH  = ${PYTHONPATH}"
echo "============================================"

echo "[start.sh] Running Alembic migrations..."
alembic upgrade head
echo "[start.sh] Migrations complete."

echo "[start.sh] Starting uvicorn on 0.0.0.0:${PORT}"
exec uvicorn spacemind.main:app \
  --host 0.0.0.0 \
  --port "${PORT}" \
  --workers 1 \
  --log-level info
