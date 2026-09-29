import os
from pathlib import Path

# Thresholds
SIMILARITY_HIGH_THRESHOLD = float(os.getenv("SIMILARITY_HIGH_THRESHOLD", "0.88"))
SIMILARITY_LOW_THRESHOLD = float(os.getenv("SIMILARITY_LOW_THRESHOLD", "0.35"))

# Pipeline Config
PATCH_SIZE = int(os.getenv("PATCH_SIZE", "2"))
MAX_REVIEWER_RETRIES = int(os.getenv("MAX_REVIEWER_RETRIES", "1"))
MAX_DIAGRAMS_PER_NOTE = int(os.getenv("MAX_DIAGRAMS_PER_NOTE", "3"))

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROMPTS_DIR = BASE_DIR / "src" / "prompts"
