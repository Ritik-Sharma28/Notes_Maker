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
from src.models.progress import Progress


class Repository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # User-scoped methods
    async def get_user_topics(self, user_id: uuid.UUID) -> Sequence[Topic]:
        result = await self.session.execute(
            select(Topic)
            .where(Topic.user_id == user_id)
            .order_by(Topic.created_at.desc())
        )
        return result.scalars().all()

    async def get_user_sources(self, user_id: uuid.UUID) -> Sequence[Source]:
        result = await self.session.execute(
            select(Source)
            .where(Source.user_id == user_id)
            .order_by(Source.created_at.desc())
        )
        return result.scalars().all()

    async def create_source(
        self,
        user_id: uuid.UUID,
        platform: str,
        raw_json: dict,
        share_url: str | None = None
    ) -> Source:
        source = Source(
            user_id=user_id,
            platform=platform,
            raw_json=raw_json,
            share_url=share_url,
            status="pending"
        )
        self.session.add(source)
        await self.session.flush()
        return source

    async def create_topic(
        self,
        user_id: uuid.UUID,
        title: str,
        embedding: list[float] | None = None,
        parent_topic_id: uuid.UUID | None = None
    ) -> Topic:
        topic = Topic(
            user_id=user_id,
            title=title,
            embedding=embedding,
            parent_topic_id=parent_topic_id,
            is_dirty=True
        )
        self.session.add(topic)
        await self.session.flush()
        return topic

    # Progress tracking methods
    async def create_progress(
        self,
        source_id: uuid.UUID,
        user_id: uuid.UUID,
        user_role: str
    ) -> Progress:
        progress = Progress(
            source_id=source_id,
            user_id=user_id,
            user_role=user_role,
            current_agent="pending",
            current_step="initialized",
            percentage=0,
            message="Pipeline initialized"
        )
        self.session.add(progress)
        await self.session.flush()
        return progress

    async def update_progress(
        self,
        source_id: uuid.UUID,
        current_agent: str,
        current_step: str,
        percentage: int,
        message: str | None = None,
        error_message: str | None = None,
        agent_state: dict | None = None
    ):
        result = await self.session.execute(
            select(Progress).where(Progress.source_id == source_id)
        )
        progress = result.scalar_one_or_none()

        if progress:
            progress.current_agent = current_agent
            progress.current_step = current_step
            progress.percentage = percentage
            if message:
                progress.message = message
            if error_message:
                progress.error_message = error_message
            if agent_state:
                progress.last_agent_state = agent_state
            self.session.add(progress)
            await self.session.flush()

    async def get_progress(self, source_id: uuid.UUID, user_id: uuid.UUID) -> Progress | None:
        result = await self.session.execute(
            select(Progress)
            .where(Progress.source_id == source_id, Progress.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def increment_retry_count(self, source_id: uuid.UUID):
        result = await self.session.execute(
            select(Progress).where(Progress.source_id == source_id)
        )
        progress = result.scalar_one_or_none()
        if progress:
            progress.retry_count += 1
            self.session.add(progress)
            await self.session.flush()

    # Update existing methods to include user_id checks
    async def get_topic(self, topic_id: uuid.UUID, user_id: uuid.UUID) -> Topic | None:
        result = await self.session.execute(
            select(Topic)
            .where(Topic.id == topic_id, Topic.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_source(self, source_id: uuid.UUID, user_id: uuid.UUID) -> Source | None:
        result = await self.session.execute(
            select(Source)
            .where(Source.id == source_id, Source.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_all_topics(self) -> Sequence[Topic]:
        result = await self.session.execute(select(Topic).order_by(Topic.created_at.desc()))
        return result.scalars().all()

    async def get_dirty_topics(self) -> Sequence[Topic]:
        result = await self.session.execute(select(Topic).where(Topic.is_dirty == True))
        return result.scalars().all()

    async def update_source_status(self, source_id: uuid.UUID, status: str, error_message: str | None = None):
        result = await self.session.execute(select(Source).where(Source.id == source_id))
        source = result.scalar_one_or_none()
        if source:
            source.status = status
            source.error_message = error_message
            self.session.add(source)
            await self.session.flush()
