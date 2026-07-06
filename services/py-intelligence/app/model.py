from typing import Any

LOCAL_MODEL_N_CTX = 4096
LOCAL_MODEL_MAX_OUTPUT_TOKENS = 768
LOCAL_MODEL_SYSTEM_PROMPT = "You are DevPulse AI Insighter. Return valid JSON only."


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
                n_ctx=LOCAL_MODEL_N_CTX,
                n_threads=4,
                verbose=False,
            )
            return self._client

        if self.provider == "openai":
            # Direct HTTP-based API calls; no heavy SDK setup required
            self._client = True
            return self._client

        raise ValueError(f"Unknown provider: {self.provider}")

    def count_tokens(self, text: str) -> int:
        """Tokenizes text with the local model's own tokenizer, without running inference.

        Only meaningful for the local Qwen/llama.cpp backend, which has a fixed context
        window. Loads the model if it isn't already cached.
        """
        client = self._load()
        return len(client.tokenize(text.encode("utf-8")))

    def generate(self, prompt: str) -> str:
        client = self._load()

        if self.provider == "google":
            response = client.models.generate_content(model=self.model_name, contents=prompt)
            return getattr(response, "text", "") or ""

        if self.provider == "qwen":
            prompt_tokens = self.count_tokens(f"{LOCAL_MODEL_SYSTEM_PROMPT}\n{prompt}")
            available_tokens = LOCAL_MODEL_N_CTX - LOCAL_MODEL_MAX_OUTPUT_TOKENS
            if prompt_tokens > available_tokens:
                raise ValueError(
                    f"Content is too large for local inference (~{prompt_tokens} tokens, "
                    f"limit ~{available_tokens}). Please switch to cloud mode."
                )

            result = client.create_chat_completion(
                messages=[
                    {
                        "role": "system",
                        "content": LOCAL_MODEL_SYSTEM_PROMPT,
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=LOCAL_MODEL_MAX_OUTPUT_TOKENS,
                temperature=0.1,
            )
            return result["choices"][0]["message"]["content"]

        if self.provider == "openai":
            import os
            import httpx

            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self.model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are DevPulse AI Insighter. Return valid JSON only.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.1,
            }
            api_base = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
            url = f"{api_base.rstrip('/')}/chat/completions"
            response = httpx.post(url, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

        raise ValueError(f"Unknown provider: {self.provider}")

    def __str__(self) -> str:
        location = "cloud" if self.cloud else "local"
        return f"{self.provider} - {self.model_name} ({location})"
