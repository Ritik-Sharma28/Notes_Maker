from langchain_openai import ChatOpenAI
from src.config.settings import settings

AGENT_CONFIGS = {
    "extractor": {
        "model": settings.EXTRACTOR_MODEL,
        "base_url": settings.EXTRACTOR_BASE_URL,
        "api_key": settings.EXTRACTOR_API_KEY,
        "temperature": settings.EXTRACTOR_TEMPERATURE,
        "max_tokens": settings.EXTRACTOR_MAX_TOKENS,
    },
    "index_keeper": {
        "model": settings.INDEX_KEEPER_MODEL,
        "base_url": settings.INDEX_KEEPER_BASE_URL,
        "api_key": settings.INDEX_KEEPER_API_KEY,
        "temperature": settings.INDEX_KEEPER_TEMPERATURE,
        "max_tokens": settings.INDEX_KEEPER_MAX_TOKENS,
    },
    "note_author": {
        "model": settings.NOTE_AUTHOR_MODEL,
        "base_url": settings.NOTE_AUTHOR_BASE_URL,
        "api_key": settings.NOTE_AUTHOR_API_KEY,
        "temperature": settings.NOTE_AUTHOR_TEMPERATURE,
        "max_tokens": settings.NOTE_AUTHOR_MAX_TOKENS,
    },
    "reviewer": {
        "model": settings.REVIEWER_MODEL,
        "base_url": settings.REVIEWER_BASE_URL,
        "api_key": settings.REVIEWER_API_KEY,
        "temperature": settings.REVIEWER_TEMPERATURE,
        "max_tokens": settings.REVIEWER_MAX_TOKENS,
    },
    "diagram_agent": {
        "model": settings.DIAGRAM_AGENT_MODEL,
        "base_url": settings.DIAGRAM_AGENT_BASE_URL,
        "api_key": settings.DIAGRAM_AGENT_API_KEY,
        "temperature": settings.DIAGRAM_AGENT_TEMPERATURE,
        "max_tokens": settings.DIAGRAM_AGENT_MAX_TOKENS,
    },
}

def get_llm(agent_name: str) -> ChatOpenAI:
    """Build a ChatOpenAI instance for the given agent using its env config."""
    if agent_name not in AGENT_CONFIGS:
        raise ValueError(f"Unknown agent configuration requested: {agent_name}")
    
    cfg = AGENT_CONFIGS[agent_name]
    return ChatOpenAI(
        model=cfg["model"],
        base_url=cfg["base_url"],
        api_key=cfg["api_key"],
        temperature=cfg["temperature"],
        max_tokens=cfg["max_tokens"],
    )
