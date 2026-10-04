from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import ingest, sources, topics, export, progress, admin
from src.api.middleware.error_handler import error_handler
from src.api.middleware.logging import logging_middleware
from src.utils.logger import configure_logger, logger

def create_app() -> FastAPI:
    # Configure logger
    configure_logger()

    app = FastAPI(title="ChatNotes API", version="0.1.0")

    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure properly for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add custom middleware
    app.middleware("http")(logging_middleware)
    app.middleware("http")(error_handler)

    # Include routers
    app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["ingest"])
    app.include_router(sources.router, prefix="/api/v1/sources", tags=["sources"])
    app.include_router(topics.router, prefix="/api/v1/topics", tags=["topics"])
    app.include_router(export.router, prefix="/api/v1/export", tags=["export"])
    app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])
    app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

    @app.get("/api/v1/health")
    async def health():
        return {"status": "ok", "version": "0.1.0"}

    logger.info("FastAPI application created")
    return app
