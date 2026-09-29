#!/usr/bin/env bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Bootstrapping initial admin user..."
python -m app.seed

echo "Starting Celery worker with embedded Beat..."
celery -A app.workers.celery_app worker \
  --beat \
  --loglevel=info \
  --pool=solo &
CELERY_PID=$!

echo "Starting FastAPI..."
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" &
UVICORN_PID=$!

shutdown() {
  echo "Received termination signal. Shutting down processes..."
  kill -TERM "$CELERY_PID" "$UVICORN_PID" 2>/dev/null || true
  wait "$CELERY_PID" "$UVICORN_PID" 2>/dev/null || true
  exit 0
}

trap shutdown SIGINT SIGTERM

wait -n "$CELERY_PID" "$UVICORN_PID"

echo "A critical process failed. Shutting down remaining processes..."
kill -TERM "$CELERY_PID" "$UVICORN_PID" 2>/dev/null || true
wait "$CELERY_PID" "$UVICORN_PID" 2>/dev/null || true

exit 1
