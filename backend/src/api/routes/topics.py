from fastapi import APIRouter, Depends, HTTPException
from src.db.repository import Repository
from src.api.deps import get_repository, get_current_user_id
from src.schemas.topic import TopicResponse
from src.schemas.note import NoteResponse
from src.models.note import Note
from sqlalchemy import select
import uuid

router = APIRouter()

@router.get("", response_model=list[TopicResponse])
async def list_topics(
    user_id: uuid.UUID = Depends(get_current_user_id),
    repo: Repository = Depends(get_repository)
):
    """List all topics for the current user."""
    topics = await repo.get_user_topics(user_id)
    return topics

@router.get("/{topic_id}/note", response_model=NoteResponse)
async def get_topic_note(
    topic_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    repo: Repository = Depends(get_repository)
):
    """Get note for a specific topic."""
    # Verify topic belongs to user
    topic = await repo.get_topic(topic_id, user_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    result = await repo.session.execute(
        select(Note).where(Note.topic_id == topic_id, Note.user_id == user_id)
    )
    note = result.scalar_one_or_none()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    return note
