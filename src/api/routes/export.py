from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from src.db.repository import Repository
from src.api.deps import get_repository
from src.export.html_renderer import render_html
from src.export.pdf_renderer import render_pdf_async
from src.models.note import Note
from sqlalchemy import select
import uuid

router = APIRouter()

@router.get("/{topic_id}/html", response_class=HTMLResponse)
async def export_html(topic_id: uuid.UUID, repo: Repository = Depends(get_repository)):
    result = await repo.session.execute(select(Note).where(Note.topic_id == topic_id))
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    topic = await repo.get_topic(topic_id)
    html_content = render_html(topic.title, note.content_markdown)
    return HTMLResponse(content=html_content)

@router.get("/{topic_id}/pdf")
async def export_pdf(topic_id: uuid.UUID, repo: Repository = Depends(get_repository)):
    result = await repo.session.execute(select(Note).where(Note.topic_id == topic_id))
    note = result.scalar_one_or_none()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    topic = await repo.get_topic(topic_id)
    pdf_path = await render_pdf_async(topic.title, note.content_markdown)
    
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{topic.title}.pdf")
