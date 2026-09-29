#!/usr/bin/env bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting Celery worker..."
celery -A app.workers.celery_app worker --loglevel=info --concurrency=1 &
WORKER_PID=$!

echo "Starting Celery beat..."
celery -A app.workers.celery_app beat --loglevel=info &
BEAT_PID=$!

echo "Starting FastAPI..."
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" &
UVICORN_PID=$!

shutdown() {
  echo "Received termination signal. Shutting down processes..."
  kill -TERM "$WORKER_PID" "$BEAT_PID" "$UVICORN_PID" 2>/dev/null || true
  wait "$WORKER_PID" "$BEAT_PID" "$UVICORN_PID" 2>/dev/null || true
  exit 0
}

trap shutdown SIGINT SIGTERM

wait -n "$WORKER_PID" "$BEAT_PID" "$UVICORN_PID"

echo "A critical process failed. Shutting down remaining processes..."
kill -TERM "$WORKER_PID" "$BEAT_PID" "$UVICORN_PID" 2>/dev/null || true
wait "$WORKER_PID" "$BEAT_PID" "$UVICORN_PID" 2>/dev/null || true

exit 1
