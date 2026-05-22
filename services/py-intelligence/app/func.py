##########################################
#   FastAPI Intelligence Service for
#   DevPulse
#   Author: Muhammed Emre Bayraktaroglu
#   Version: 0.1.0
#########################################

from dotenv import load_dotenv
from app.model import Model
import re

load_dotenv()

AVAILABLE_MODELS = [
    {
        "name": "gemini-2.0-flash-lite",
        "provider": "google",
        "shortened": "Gemini",
        "cloud": True,
    },
    {
        "name": "Qwen/Qwen2.5-Coder-3B",
        "provider": "Qwen",
        "shortened": "Qwen",
        "cloud": False,
    },
]


def _word_count(text: str) -> int:
    return len(text.split())


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


class Intelligence:
    def __init__(self):
        self.models = []
        self.load_model()

    def load_model(self):
        for model in AVAILABLE_MODELS:
            self.models.append(Model(model))

    def health(self):
        return {"status": "ok", "service": "py-intelligence"}

    def list_models(self):
        return [str(model) for model in self.models]
