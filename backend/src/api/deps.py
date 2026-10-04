from collections.abc import AsyncGenerator
from src.db.session import async_session_maker
from src.db.repository import Repository
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

# Import auth dependencies to re-export them for the routes
from src.auth.dependencies import (
    get_current_user_id,
    get_current_user_role,
    require_admin,
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def get_repository(session: AsyncSession = Depends(get_session)) -> Repository:
    """Get repository instance."""
    return Repository(session)
