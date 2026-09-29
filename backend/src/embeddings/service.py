from sentence_transformers import SentenceTransformer
from src.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance

    def load_model(self):
        if self._model is None:
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}")
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
            logger.info("Embedding model loaded successfully")

    def embed(self, text: str) -> list[float]:
        if self._model is None:
            self.load_model()
        # SentenceTransformer.encode returns a numpy array, we convert to list of floats
        return self._model.encode(text).tolist()

# Singleton instance
embedding_service = EmbeddingService()
