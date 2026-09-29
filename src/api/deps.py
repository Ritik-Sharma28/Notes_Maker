from collections.abc import AsyncGenerator
from src.db.session import async_session_maker
from src.db.repository import Repository
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

def get_repository(session: AsyncSession = Depends(get_session)) -> Repository:
    return Repository(session)
