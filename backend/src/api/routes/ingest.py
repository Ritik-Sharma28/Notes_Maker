from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from src.schemas.ingest import IngestRequest, IngestResponse
from src.db.repository import Repository
from src.api.deps import get_repository
from src.ingestion.chatgpt import ChatGPTExtractor
from src.ingestion.raw_paste import RawPasteExtractor
from src.config.settings import settings
import arq

router = APIRouter()

@router.post("", response_model=IngestResponse, status_code=202)
async def ingest_chat(request: IngestRequest, repo: Repository = Depends(get_repository)):
    if not request.share_url and not request.raw_text:
        raise HTTPException(status_code=400, detail="Must provide share_url or raw_text")
        
    platform = "chatgpt" if request.share_url else "raw_paste"
    raw_json = {}
    if request.raw_text:
        raw_json["raw_text"] = request.raw_text
    
    try:
        source = await repo.create_source(
            platform=platform,
            raw_json=raw_json,
            share_url=str(request.share_url) if request.share_url else None
        )
        await repo.session.commit()
        
        # Enqueue background task
        redis = await arq.create_pool(arq.connections.RedisSettings.from_dsn(settings.REDIS_URL))
        await redis.enqueue_job("run_pipeline_task", str(source.id))
        
        return IngestResponse(source_id=str(source.id), status="processing")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
