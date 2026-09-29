from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import ingest, sources, topics, export

def create_app() -> FastAPI:
    app = FastAPI(title="ChatNotes API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["ingest"])
    app.include_router(sources.router, prefix="/api/v1/sources", tags=["sources"])
    app.include_router(topics.router, prefix="/api/v1/topics", tags=["topics"])
    app.include_router(export.router, prefix="/api/v1/export", tags=["export"])

    @app.get("/api/v1/health")
    async def health():
        return {"status": "ok"}

    return app
