from fastapi import APIRouter, Depends, HTTPException
from src.db.repository import Repository
from src.api.deps import get_repository, get_current_user_id, get_current_user_role
from src.pipeline.state_manager import state_manager
from src.rate_limit.limiter import rate_limiter
from src.config.settings import settings
import arq
import uuid

router = APIRouter()

@router.get("")
async def list_sources(
    user_id: uuid.UUID = Depends(get_current_user_id),
    repo: Repository = Depends(get_repository)
):
    """List all sources for the current user."""
    sources = await repo.get_user_sources(user_id)
    return [
        {
            "id": str(source.id),
            "platform": source.platform,
            "status": source.status,
            "created_at": source.created_at,
            "share_url": source.share_url
        }
        for source in sources
    ]

@router.get("/{source_id}/status")
async def get_source_status(
    source_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    repo: Repository = Depends(get_repository)
):
    """Get status of a specific source."""
    source = await repo.get_source(source_id, user_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    return {
        "id": str(source.id),
        "status": source.status,
        "error": source.error_message,
        "created_at": source.created_at
    }

@router.get("/{source_id}/progress")
async def get_source_progress(
    source_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    repo: Repository = Depends(get_repository)
):
    """Get detailed progress for a source."""
    progress = await repo.get_progress(source_id, user_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    return {
        "source_id": str(progress.source_id),
        "current_agent": progress.current_agent,
        "current_step": progress.current_step,
        "percentage": progress.percentage,
        "message": progress.message,
        "error_message": progress.error_message,
        "retry_count": progress.retry_count,
        "updated_at": progress.updated_at
    }

@router.post("/{source_id}/retry")
async def retry_source(
    source_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    user_role: str = Depends(get_current_user_role),
    repo: Repository = Depends(get_repository)
):
    """Retry a failed source. Rate limited per source."""
    source = await repo.get_source(source_id, user_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    if source.status != "failed":
        raise HTTPException(status_code=400, detail="Can only retry failed sources")

    # Check retry rate limit
    allowed, error_msg = await rate_limiter.check_rate_limit(
        str(user_id),
        user_role,
        action="retry"
    )

    if not allowed:
        raise HTTPException(status_code=429, detail=error_msg)

    # Check if can retry based on retry count
    can_retry = await state_manager.can_retry(source_id, user_id)
    if not can_retry:
        raise HTTPException(
            status_code=429,
            detail="Maximum retry attempts exceeded for this source"
        )

    try:
        # Increment retry count
        await repo.increment_retry_count(source_id)
        await repo.update_source_status(source_id, "processing")
        await repo.session.commit()

        # Re-enqueue pipeline
        redis = await arq.create_pool(arq.connections.RedisSettings.from_dsn(settings.REDIS_URL))
        await redis.enqueue_job(
            "run_pipeline_task",
            str(source_id),
            str(user_id),
            user_role
        )

        return {"message": "Retry initiated", "source_id": str(source_id)}

    except Exception as e:
        await repo.session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
