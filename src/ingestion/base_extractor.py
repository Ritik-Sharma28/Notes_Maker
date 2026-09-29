from abc import ABC, abstractmethod

class BaseExtractor(ABC):
    @abstractmethod
    async def extract(self, input_data: str) -> list[dict]:
        """
        Extracts chat and returns a list of dictionaries:
        [{"role": "user", "content": "..."}]
        """
        pass
