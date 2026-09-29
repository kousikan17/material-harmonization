import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base  # noqa: F401 - registers the full model set before any query runs
from app.db.init_db import init_extensions

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered National Unified Material Master Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.getLogger(__name__).error(f"Unhandled server exception: {exc}\n{traceback.format_exc()}")
    
    headers = {}
    origin = request.headers.get("origin")
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "traceback": traceback.format_exc()},
        headers=headers
    )


@app.on_event("startup")
def on_startup() -> None:
    try:
        init_extensions()
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).warning("Could not initialize DB extensions on startup: %s", exc)


app.include_router(api_router)


@app.get("/")
def root():
    return {
        "project": "ONE NATION - ONE COMMON MATERIAL CODE",
        "description": "AI-Powered National Unified Material Master Platform",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
