"""Progress tracking routes."""
from fastapi import APIRouter, Depends, HTTPException
from src.db.repository import Repository
from src.api.deps import get_repository, get_current_user_id
from src.models.progress import Progress
from sqlalchemy import select
import uuid

router = APIRouter()

@router.get("")
async def list_progress(
    user_id: uuid.UUID = Depends(get_current_user_id),
    repo: Repository = Depends(get_repository)
):
    """List all progress entries for current user."""
    result = await repo.session.execute(
        select(Progress)
        .where(Progress.user_id == user_id)
        .order_by(Progress.created_at.desc())
    )
    progress_entries = result.scalars().all()

    return [
        {
            "source_id": str(p.source_id),
            "current_agent": p.current_agent,
            "current_step": p.current_step,
            "percentage": p.percentage,
            "message": p.message,
            "error_message": p.error_message,
            "retry_count": p.retry_count,
            "updated_at": p.updated_at
        }
        for p in progress_entries
    ]

@router.get("/{source_id}")
async def get_progress(
    source_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    repo: Repository = Depends(get_repository)
):
    """Get progress for a specific source."""
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
