"""Pipeline state management for retry capability."""
import uuid
from typing import Optional, Dict, Any
from src.db.session import async_session_maker
from src.db.repository import Repository
from src.models.progress import Progress
from src.utils.logger import logger


class StateManager:
    """Manages pipeline state persistence and recovery."""

    @staticmethod
    async def save_state(
        source_id: uuid.UUID,
        user_id: uuid.UUID,
        agent_name: str,
        state: Dict[str, Any]
    ):
        """Save current agent state for recovery."""
        async with async_session_maker() as session:
            repo = Repository(session)
            try:
                await repo.update_progress(
                    source_id=source_id,
                    current_agent=agent_name,
                    current_step=state.get("current_step", "processing"),
                    percentage=state.get("percentage", 0),
                    message=f"{agent_name} processing",
                    agent_state=state
                )
                await session.commit()
                logger.info(f"State saved for agent {agent_name}, source {source_id}")
            except Exception as e:
                logger.error(f"Failed to save state: {str(e)}")
                await session.rollback()
                raise

    @staticmethod
    async def load_state(source_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Dict[str, Any]]:
        """Load last saved state for recovery."""
        async with async_session_maker() as session:
            repo = Repository(session)
            try:
                progress = await repo.get_progress(source_id, user_id)
                if progress and progress.last_agent_state:
                    logger.info(f"State loaded for source {source_id}")
                    return progress.last_agent_state
                return None
            except Exception as e:
                logger.error(f"Failed to load state: {str(e)}")
                return None

    @staticmethod
    async def can_retry(source_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Check if source can be retried based on retry count."""
        async with async_session_maker() as session:
            repo = Repository(session)
            try:
                progress = await repo.get_progress(source_id, user_id)
                if progress:
                    from src.config.settings import settings
                    return progress.retry_count < settings.RATE_LIMIT_RETRY_MAX_PER_SOURCE
                return True
            except Exception as e:
                logger.error(f"Failed to check retry eligibility: {str(e)}")
                return False


state_manager = StateManager()
