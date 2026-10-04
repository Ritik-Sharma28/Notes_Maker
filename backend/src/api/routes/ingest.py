from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from src.schemas.ingest import IngestRequest, IngestResponse
from src.db.repository import Repository
from src.api.deps import get_repository, get_current_user_id, get_current_user_role
from src.rate_limit.limiter import rate_limiter
from src.config.settings import settings
import arq
import uuid

router = APIRouter()

@router.post("", response_model=IngestResponse, status_code=202)
async def ingest_chat(
    request: IngestRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    user_role: str = Depends(get_current_user_role),
    repo: Repository = Depends(get_repository)
):
    """
    Ingest a ChatGPT conversation or raw text.
    Rate limited: 2 per week for regular users, unlimited for admin.
    """
    if not request.share_url and not request.raw_text:
        raise HTTPException(status_code=400, detail="Must provide share_url or raw_text")

    # Check rate limit
    allowed, error_msg = await rate_limiter.check_rate_limit(
        str(user_id),
        user_role,
        action="ingest"
    )

    if not allowed:
        raise HTTPException(status_code=429, detail=error_msg)

    platform = "chatgpt" if request.share_url else "raw_paste"
    raw_json = {}
    if request.raw_text:
        raw_json["raw_text"] = request.raw_text

    try:
        source = await repo.create_source(
            user_id=user_id,
            platform=platform,
            raw_json=raw_json,
            share_url=str(request.share_url) if request.share_url else None
        )
        await repo.session.commit()

        # Enqueue background task with user context
        redis = await arq.create_pool(arq.connections.RedisSettings.from_dsn(settings.REDIS_URL))
        await redis.enqueue_job(
            "run_pipeline_task",
            str(source.id),
            str(user_id),
            user_role
        )

        return IngestResponse(source_id=str(source.id), status="processing")

    except Exception as e:
        await repo.session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
