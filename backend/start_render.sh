#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Start Celery worker in the background
# Using concurrency=1 to reduce memory footprint on Free tier
celery -A app.workers.celery_app worker --loglevel=info --concurrency=1 &
WORKER_PID=$!

# Start Celery beat in the background
celery -A app.workers.celery_app beat --loglevel=info &
BEAT_PID=$!

# Start Uvicorn in the background so we can monitor all three processes
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" &
UVICORN_PID=$!

# Function to gracefully shut down background processes
shutdown() {
    echo "Received termination signal. Shutting down processes..."
    kill -TERM $WORKER_PID $BEAT_PID $UVICORN_PID 2>/dev/null
    wait $WORKER_PID $BEAT_PID $UVICORN_PID 2>/dev/null
    exit 0
}

# Trap termination signals
trap shutdown SIGINT SIGTERM

# Wait for any of the critical processes to exit
wait -n $WORKER_PID $BEAT_PID $UVICORN_PID

# If we reach here, one of the processes exited prematurely
echo "A critical process failed. Shutting down remaining processes..."
kill -TERM $WORKER_PID $BEAT_PID $UVICORN_PID 2>/dev/null
wait $WORKER_PID $BEAT_PID $UVICORN_PID 2>/dev/null
exit 1
