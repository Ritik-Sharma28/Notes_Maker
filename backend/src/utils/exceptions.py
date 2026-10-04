"""Custom exceptions for the application."""


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class PipelineStateError(Exception):
    """Raised when pipeline state is invalid."""
    pass


class AgentExecutionError(Exception):
    """Raised when agent execution fails."""
    pass


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass
