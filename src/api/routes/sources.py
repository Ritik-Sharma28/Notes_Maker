from fastapi import APIRouter, Depends, HTTPException
from src.db.repository import Repository
from src.api.deps import get_repository
import uuid

router = APIRouter()

@router.get("/{source_id}/status")
async def get_source_status(source_id: uuid.UUID, repo: Repository = Depends(get_repository)):
    source = await repo.get_source(source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
        
    return {
        "status": source.status,
        "error": source.error_message
    }
