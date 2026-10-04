"""Base agent with retry capability."""
from abc import ABC, abstractmethod
from typing import Dict, Any
from src.pipeline.state_manager import state_manager
from src.utils.logger import logger
from src.utils.exceptions import AgentExecutionError


class BaseAgent(ABC):
    """Base class for all agents with retry capability."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's logic."""
        pass

    async def run_with_retry(
        self,
        state: Dict[str, Any],
        source_id: str,
        user_id: str,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Execute agent with retry logic and state persistence.
        """
        retry_count = 0
        last_error = None

        while retry_count < max_retries:
            try:
                # Try to load previous state if this is a retry
                if retry_count > 0:
                    logger.info(f"Retry {retry_count + 1}/{max_retries} for {self.name}")
                    saved_state = await state_manager.load_state(
                        uuid.UUID(source_id),
                        uuid.UUID(user_id)
                    )
                    if saved_state:
                        state.update(saved_state)

                # Execute agent
                result = await self.execute(state)

                # Save state on success
                await state_manager.save_state(
                    uuid.UUID(source_id),
                    uuid.UUID(user_id),
                    self.name,
                    result
                )

                return result

            except Exception as e:
                last_error = e
                retry_count += 1
                logger.error(
                    f"{self.name} failed (attempt {retry_count}/{max_retries}): {str(e)}",
                    exc_info=True
                )

                if retry_count >= max_retries:
                    # Mark as failed
                    await state_manager.save_state(
                        uuid.UUID(source_id),
                        uuid.UUID(user_id),
                        self.name,
                        {
                            **state,
                            "error": str(e),
                            "failed": True
                        }
                    )
                    raise AgentExecutionError(
                        f"{self.name} failed after {max_retries} retries: {str(e)}"
                    )

        raise AgentExecutionError(f"{self.name} failed: {str(last_error)}")
