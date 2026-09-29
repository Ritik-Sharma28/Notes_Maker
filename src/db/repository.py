import uuid
from typing import Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.models.topic import Topic
from src.models.source import Source
from src.models.raw_fact import RawFact
from src.models.code_block import CodeBlock
from src.models.comparison_table import ComparisonTable
from src.models.note import Note
from src.models.note_version import NoteVersion

class Repository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_topic(self, topic_id: uuid.UUID) -> Topic | None:
        result = await self.session.execute(select(Topic).where(Topic.id == topic_id))
        return result.scalar_one_or_none()

    async def create_topic(self, title: str, embedding: list[float] | None = None) -> Topic:
        topic = Topic(title=title, embedding=embedding)
        self.session.add(topic)
        await self.session.flush()
        return topic

    async def get_all_topics(self) -> Sequence[Topic]:
        result = await self.session.execute(select(Topic).order_by(Topic.created_at.desc()))
        return result.scalars().all()

    async def get_dirty_topics(self) -> Sequence[Topic]:
        result = await self.session.execute(select(Topic).where(Topic.is_dirty == True))
        return result.scalars().all()

    async def create_source(self, platform: str, raw_json: dict, share_url: str | None = None) -> Source:
        source = Source(platform=platform, raw_json=raw_json, share_url=share_url)
        self.session.add(source)
        await self.session.flush()
        return source

    async def get_source(self, source_id: uuid.UUID) -> Source | None:
        result = await self.session.execute(select(Source).where(Source.id == source_id))
        return result.scalar_one_or_none()
        
    async def update_source_status(self, source_id: uuid.UUID, status: str, error_message: str | None = None):
        source = await self.get_source(source_id)
        if source:
            source.status = status
            source.error_message = error_message
            self.session.add(source)
            await self.session.flush()
