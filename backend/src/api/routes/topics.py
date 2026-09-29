from fastapi import APIRouter, Depends, HTTPException
from typing import Sequence
from src.db.repository import Repository
from src.api.deps import get_repository
from src.schemas.topic import TopicResponse
from src.schemas.note import NoteResponse
from src.models.note import Note
from sqlalchemy import select
import uuid

router = APIRouter()

@router.get("", response_model=list[TopicResponse])
async def list_topics(repo: Repository = Depends(get_repository)):
    topics = await repo.get_all_topics()
    return topics

@router.get("/{topic_id}/note", response_model=NoteResponse)
async def get_topic_note(topic_id: uuid.UUID, repo: Repository = Depends(get_repository)):
    result = await repo.session.execute(select(Note).where(Note.topic_id == topic_id))
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    return note
