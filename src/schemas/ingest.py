from pydantic import BaseModel, HttpUrl

class IngestRequest(BaseModel):
    share_url: HttpUrl | None = None
    raw_text: str | None = None

class IngestResponse(BaseModel):
    source_id: str
    status: str
