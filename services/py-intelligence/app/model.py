from typing import Any


class Model:
    """
    Lazy wrapper for optional LLM backends.

    The service must be importable and testable without downloading or importing
    heavyweight model dependencies. Backends are initialized only when generate()
    is called.
    """

    def __init__(self, model: dict[str, Any]):
        self.config = model
        self.model_name = model["name"]
        self.model_path = model.get("model_path")
        self.provider = model["provider"].lower()
        self.shortened = model["shortened"]
        self.cloud = model["cloud"]
        self._client = None

    def _load(self):
        if self._client is not None:
            return self._client

        if self.provider == "google":
            try:
                from google import genai
            except ImportError as exc:
                raise RuntimeError("Google GenAI dependencies are not installed.") from exc

            self._client = genai.Client()
            return self._client

        if self.provider == "qwen":
            try:
                from llama_cpp import Llama
            except ImportError as exc:
                raise RuntimeError("llama-cpp-python is required for local GGUF inference.") from exc

            if not self.model_path:
                raise RuntimeError("Local Qwen GGUF model_path is not configured.")

            self._client = Llama(
                model_path=self.model_path,
                n_ctx=4096,
                n_threads=4,
                verbose=False,
            )
            return self._client

        raise ValueError(f"Unknown provider: {self.provider}")

    def generate(self, prompt: str) -> str:
        client = self._load()

        if self.provider == "google":
            response = client.models.generate_content(model=self.model_name, contents=prompt)
            return getattr(response, "text", "") or ""

        if self.provider == "qwen":
            result = client.create_chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": "You are DevPulse AI Insighter. Return valid JSON only.",
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=768,
                temperature=0.1,
            )
            return result["choices"][0]["message"]["content"]

        raise ValueError(f"Unknown provider: {self.provider}")

    def __str__(self) -> str:
        location = "cloud" if self.cloud else "local"
        return f"{self.provider} - {self.model_name} ({location})"

