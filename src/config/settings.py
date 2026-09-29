import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_PASSWORD: str
    
    @property
    def REDIS_URL(self) -> str:
        return f"redis://default:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"
    
    # Segmenter Agent
    SEGMENTER_MODEL: str
    SEGMENTER_BASE_URL: str
    SEGMENTER_API_KEY: str
    SEGMENTER_TEMPERATURE: float
    SEGMENTER_MAX_TOKENS: int
    
    # Extractor Agent
    EXTRACTOR_MODEL: str
    EXTRACTOR_BASE_URL: str
    EXTRACTOR_API_KEY: str
    EXTRACTOR_TEMPERATURE: float
    EXTRACTOR_MAX_TOKENS: int
    
    # Index Keeper Agent
    INDEX_KEEPER_MODEL: str
    INDEX_KEEPER_BASE_URL: str
    INDEX_KEEPER_API_KEY: str
    INDEX_KEEPER_TEMPERATURE: float
    INDEX_KEEPER_MAX_TOKENS: int
    
    # Note Author Agent
    NOTE_AUTHOR_MODEL: str
    NOTE_AUTHOR_BASE_URL: str
    NOTE_AUTHOR_API_KEY: str
    NOTE_AUTHOR_TEMPERATURE: float
    NOTE_AUTHOR_MAX_TOKENS: int
    
    # Reviewer Agent
    REVIEWER_MODEL: str
    REVIEWER_BASE_URL: str
    REVIEWER_API_KEY: str
    REVIEWER_TEMPERATURE: float
    REVIEWER_MAX_TOKENS: int
    
    # Diagram Agent
    DIAGRAM_AGENT_MODEL: str
    DIAGRAM_AGENT_BASE_URL: str
    DIAGRAM_AGENT_API_KEY: str
    DIAGRAM_AGENT_TEMPERATURE: float
    DIAGRAM_AGENT_MAX_TOKENS: int
    
    # Embedding
    EMBEDDING_MODEL_NAME: str
    EMBEDDING_DIMENSION: int
    
    # Thresholds
    SIMILARITY_HIGH_THRESHOLD: float
    SIMILARITY_LOW_THRESHOLD: float
    
    # Pipeline Config
    PATCH_SIZE: int
    MAX_REVIEWER_RETRIES: int
    MAX_DIAGRAMS_PER_NOTE: int
    
    # Server
    HOST: str
    PORT: int
    DEBUG: bool
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
