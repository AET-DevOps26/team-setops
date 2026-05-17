from google import genai
from transformers import pipeline


class Model:
    def __init__(self, model: dict[str, any]):
        self.model = model
        self.model_name = model["name"]
        self.provider = model["provider"].lower()

        self.shortened = model["shortened"]
        self.cloud = model["cloud"]

        if self.provider == "google":
            self.model = genai.GenerativeModel(self.model_name)
        elif self.provider == "qwen":
            self.model = pipeline("text-generation", model=self.model_name)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    def analyze(self, content: str) -> str:
        return "Analysis of the content"

    def summarize(self, content: str) -> str:
        return "Summary of the content"

    def troubleshoot(self, content: str) -> str:
        return "Troubleshooting of the content"

    def __str__(self) -> str:
        return f"{self.provider} - {self.model_name}"
