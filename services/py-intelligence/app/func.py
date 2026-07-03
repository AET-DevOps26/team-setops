import json
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from prometheus_client import Counter

from app.model import Model

load_dotenv()

INFERENCE_TOTAL = Counter("devpulse_inference_total", "Total number of AI inference requests by mode", ["mode"])
INFERENCE_FALLBACK_TOTAL = Counter(
    "devpulse_inference_fallback_total",
    "Total number of times cloud inference fell back from Gemini to the OpenAI-compatible model",
)

AVAILABLE_MODELS = [
    {
        "name": "gemini-3.5-flash",
        "provider": "google",
        "shortened": "Gemini",
        "cloud": True,
    },
    {
        "name": "openai/gpt-oss-120b",
        "provider": "openai",
        "shortened": "GPT",
        "cloud": True,
    },
    {
        "name": "Qwen/Qwen2.5-Coder-3B-Instruct-GGUF",
        "model_path": "/app/models/qwen2.5-coder-3b-instruct-q4_k_m.gguf",
        "provider": "Qwen",
        "shortened": "Qwen",
        "cloud": False,
    },
]

REQUIRED_RESPONSE_KEYS = [
    "problem_type",
    "severity",
    "summary",
    "problem_summary",
    "evidence",
    "troubleshoot",
    "solutions",
    "sources",
    "confidence",
]

PROMPTS_PATH = Path(__file__).parent / "utils" / "prompts.json"


def _load_prompts() -> dict[str, str]:
    """Loads system and formatting prompts from a JSON file.

    This function attempts to read prompt definitions from the JSON file at
    PROMPTS_PATH. If the file does not exist, or if reading/parsing fails,
    an empty dictionary is returned.

    Returns:
        dict[str, str]: A dictionary mapping prompt keys to prompt template strings.
            Returns an empty dict if the file is missing or contains invalid JSON.
    """
    if not PROMPTS_PATH.exists():
        return {}

    try:
        return json.loads(PROMPTS_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


class Intelligence:
    """The core engine for DevPulse AI-driven log and incident intelligence.

    This class orchestrates interactions with both local and cloud LLMs to
    analyze developer logs, issues, or system output. It handles loading
    pre-configured prompts, selecting appropriate models based on mode
    requirements (local/cloud), building analysis contexts, parsing model responses
    as structured JSON, and normalizing the intelligence output.
    """

    def __init__(self):
        """Initializes the Intelligence engine by loading models and prompt templates.

        The available models are loaded based on the configuration in
        AVAILABLE_MODELS. The prompts are loaded dynamically from a JSON file.
        """
        self.models = [Model(model) for model in AVAILABLE_MODELS]
        self.prompts = _load_prompts()

    def health(self):
        """Retrieves the health and status of the intelligence service.

        Returns:
            dict[str, str]: A dictionary containing the status ("ok") and service name.
        """
        return {"status": "ok", "service": "py-intelligence"}

    def list_models(self):
        """Lists string representations of all available models supported by this service.

        Returns:
            list[str]: A list of model descriptions/names configured in the system.
        """
        return [str(model) for model in self.models]

    def get_model_for_mode(self, mode: str) -> Model:
        """Retrieves the configured model instance for the specified execution mode.

        Args:
            mode (str): The execution mode, which must be either "local" or "cloud".
                Whitespace and letter case are normalized automatically.

        Returns:
            Model: The model instance matching the specified mode (local model or cloud model).

        Raises:
            ValueError: If 'mode' is not "local" or "cloud", or if no matching model
                is found in the configured self.models list.
        """
        mode = mode.lower().strip()
        if mode == "local":
            return next(model for model in self.models if not model.cloud)
        if mode == "cloud":
            return next(model for model in self.models if model.cloud)
        raise ValueError("mode must be either 'local' or 'cloud'.")

    def analyze(
        self,
        content: str,
        mode: str = "local",
        use_rag: bool = False,
        context: str | None = None,
        retrieved_docs: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Analyzes log or incident content to identify issues and recommend solutions.

        This is the primary public entrypoint. It selects the target model (local or cloud)
        based on the mode, constructs a rich prompt incorporating context and RAG documents if enabled,
        sends the query to the model, parses the response, and normalizes it to ensure all
        required response keys are present.

        Args:
            content (str): The raw text/logs/incident content to be analyzed.
            mode (str, optional): The model target mode. Must be "local" (uses the local Qwen coder model)
                or "cloud" (uses the Google Gemini cloud model). Defaults to "local".
            use_rag (bool, optional): Whether to inject Retrieval-Augmented Generation (RAG) context
                into the model's analysis prompt. Defaults to False.
            context (str | None, optional): Additional situational context to guide the analysis. Defaults to None.
            retrieved_docs (list[dict[str, Any]] | None, optional): A list of document metadata and snippets
                retrieved from a vector database or document search to use as RAG context. Defaults to None.

        Returns:
            dict[str, Any]: A structured dictionary conforming to REQUIRED_RESPONSE_KEYS, containing:
                - problem_type: Categorized type of issue.
                - severity: Severity level of the issue.
                - summary: Brief summary of the overall analysis.
                - problem_summary: Targeted summary of the specific underlying problem.
                - evidence: Specific quotes or indicators showing why the problem was identified.
                - troubleshoot: Recommended steps for diagnostic/troubleshooting.
                - solutions: Actionable code fixes or structural changes.
                - sources: Source documents used in RAG or referenced in the response.
                - confidence: Confidence level of the analysis ("low", "medium", "high").

        Raises:
            ValueError: If the mode is invalid, the model fails to return a response, or
                the response cannot be parsed into a valid JSON structure.
        """
        model = self.get_model_for_mode(mode)
        prompt = self._build_analysis_prompt(content, mode, use_rag, context, retrieved_docs or [])
        INFERENCE_TOTAL.labels(mode=mode).inc()
        try:
            raw_response = model.generate(prompt)
        except Exception as e:
            # Fallback to OpenAI GPT model if Gemini cloud provider fails
            if mode == "cloud":
                try:
                    fallback_model = next(m for m in self.models if m.cloud and m.provider == "openai")
                    INFERENCE_FALLBACK_TOTAL.inc()
                    raw_response = fallback_model.generate(prompt)
                except StopIteration:
                    raise e
            else:
                raise e
        parsed_response = self._parse_model_response(raw_response)
        return self._normalize_response(parsed_response, retrieved_docs or [], use_rag)

    def _build_analysis_prompt(
        self,
        content: str,
        mode: str,
        use_rag: bool,
        context: str | None,
        retrieved_docs: list[dict[str, Any]],
    ) -> str:
        """Assembles the complete system and instruction prompt to be sent to the model.

        This method reads raw templates (base system instructions, JSON contract rules,
        RAG policies, etc.) from the loaded prompts dictionary and dynamically joins
        them with user context, incident content, and serialized RAG documents.

        Args:
            content (str): The raw incident content to be analyzed.
            mode (str): The mode targeting either "local" or "cloud".
            use_rag (bool): True if RAG context should be included in the prompt.
            context (str | None): Additional user-provided situational context.
            retrieved_docs (list[dict[str, Any]]): A list of retrieved reference documents.

        Returns:
            str: The fully-formed instruction prompt for the model.
        """
        base_prompt = self.prompts.get(
            "local_qwen_insighter" if mode == "local" else "cloud_gemini_insighter",
            "You are DevPulse AI Insighter. Return valid JSON only.",
        )
        contract = self.prompts.get(
            "json_response_contract",
            "Return one valid JSON object with keys: problem_type, severity, summary, problem_summary"
            ", evidence, troubleshoot, solutions, sources, confidence.",
        )
        rag_policy = self.prompts.get("rag_context_policy", "")
        incident_summary = self.prompts.get("log_analysis", "")
        rag_block = self._format_rag_block(retrieved_docs) if use_rag and retrieved_docs else "[]"

        return "\n".join(
            [
                base_prompt,
                incident_summary,
                rag_policy,
                contract,
                "Use the following input to produce the final JSON response.",
                f"mode: {mode}",
                f"use_rag: {str(use_rag).lower()}",
                f"context: {context or ''}",
                "incident_content:",
                content.strip(),
                "retrieved_rag_documents:",
                rag_block,
            ]
        )

    def _format_rag_block(self, retrieved_docs: list[dict[str, Any]]) -> str:
        """Formats and serializes retrieved RAG documents into a readable JSON string block.

        Filters the original document fields to only include 'id', 'title', 'content',
        and 'tags' to optimize context usage.

        Args:
            retrieved_docs (list[dict[str, Any]]): A list of raw document dictionaries.

        Returns:
            str: A formatted and indented JSON string containing the list of filtered documents.
        """
        return json.dumps(
            [
                {
                    "id": str(doc.get("_id", "")),
                    "title": doc.get("title", ""),
                    "content": doc.get("content", ""),
                    "tags": doc.get("tags", []),
                }
                for doc in retrieved_docs
            ],
            ensure_ascii=False,
            indent=2,
        )

    def _parse_model_response(self, raw_response: str) -> dict[str, Any]:
        """Parses and sanitizes the raw text response returned by the language model.

        It strips markdown code block fences (e.g., ```json ... ```) if present,
        and attempts to parse the remaining text as JSON. If direct parsing fails,
        it uses regular expressions to find the first balanced JSON-like object `{...}`
        within the text and attempts to parse that subset.

        Args:
            raw_response (str): The raw text response received from the model.

        Returns:
            dict[str, Any]: The parsed JSON object representation.

        Raises:
            ValueError: If the raw response is empty, or if no valid JSON structure
                could be extracted and parsed from the model response.
        """
        if not raw_response:
            raise ValueError("Model returned an empty response.")

        cleaned = raw_response.strip()
        # If the response contains markdown code blocks, extract the content inside
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1).strip()
        elif cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            return json.loads(cleaned, strict=False)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                json_str = match.group(0)
                try:
                    return json.loads(json_str, strict=False)
                except json.JSONDecodeError:
                    # Escape unescaped double quotes inside single quotes (common in TS compiler output)
                    repaired = json_str.replace("'\"", "'\\\"").replace("\"'", "\\\"'")
                    try:
                        return json.loads(repaired, strict=False)
                    except json.JSONDecodeError as e:
                        print(f"Failed to parse repaired JSON. Error: {e}. Raw response: {raw_response}")
                        raise ValueError(f"{str(e)}. Raw response: {raw_response[:200]}")
            print(f"No JSON object found in response. Raw response: {raw_response}")
            raise ValueError(f"Model response was not valid JSON. Response snippet: {raw_response[:200]}")

    def _normalize_response(
        self,
        response: dict[str, Any],
        retrieved_docs: list[dict[str, Any]],
        use_rag: bool,
    ) -> dict[str, Any]:
        """Ensures that the model's parsed JSON response is fully compliant and structurally sound.

        Guarantees that all keys defined in REQUIRED_RESPONSE_KEYS are present in the
        returned dictionary. If a key is missing or None, it populates it with a sensible
        default (e.g., empty string, empty list, or "unknown"). Additionally, if RAG was
        used but no sources were explicitly populated by the model, it generates source
        references dynamically from the retrieved document pool.

        Args:
            response (dict[str, Any]): The raw parsed response from the model.
            retrieved_docs (list[dict[str, Any]]): The list of reference documents used in analysis.
            use_rag (bool): True if RAG context was injected.

        Returns:
            dict[str, Any]: A standardized dictionary containing all required analysis fields.
        """
        normalized = {key: response.get(key) for key in REQUIRED_RESPONSE_KEYS}

        # Conform and structure sources to match the expected SourceRef schema: [{"id": str, "title": str}]
        raw_sources = normalized["sources"]
        if not isinstance(raw_sources, list):
            raw_sources = []

        standardized_sources = []
        for source_item in raw_sources:
            # Case A: Model returned source as a plain string ID (e.g., ["doc_id_1"])
            if isinstance(source_item, str):
                doc_title = ""
                # Look up the document title from the RAG context documents using the ID
                for rag_doc in retrieved_docs:
                    if str(rag_doc.get("_id", "")) == source_item:
                        doc_title = rag_doc.get("title", "")
                        break
                standardized_sources.append({"id": source_item, "title": doc_title})

            # Case B: Model returned source as an object/dict (e.g., [{"id": "doc_id_1", "title": "Doc Title"}])
            elif isinstance(source_item, dict):
                source_id = str(source_item.get("id", source_item.get("_id", "")))
                doc_title = source_item.get("title", "")
                # If title is missing in the object, resolve it from the RAG context documents
                if not doc_title:
                    for rag_doc in retrieved_docs:
                        if str(rag_doc.get("_id", "")) == source_id:
                            doc_title = rag_doc.get("title", "")
                            break
                standardized_sources.append({"id": source_id, "title": doc_title})

        # Fallback: If no sources were explicitly extracted by the model, but RAG was enabled,
        # register all retrieved RAG documents as the sources.
        if not standardized_sources and use_rag:
            standardized_sources = self._build_sources(retrieved_docs)

        normalized["problem_type"] = normalized["problem_type"] or "unknown"
        normalized["severity"] = normalized["severity"] or "unknown"
        normalized["summary"] = normalized["summary"] or ""
        normalized["problem_summary"] = normalized["problem_summary"] or ""
        normalized["evidence"] = normalized["evidence"] or []
        normalized["troubleshoot"] = normalized["troubleshoot"] or []
        normalized["solutions"] = normalized["solutions"] or []
        normalized["sources"] = standardized_sources
        normalized["confidence"] = normalized["confidence"] or "low"
        return normalized

    def _build_sources(self, retrieved_docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Constructs a clean, safe, and truncated list of reference sources from retrieved docs.

        For each document, it extracts the ID, title, and tags, and clips the first 240
        characters of the document content to serve as a snippet, ensuring that the final output
        remains compact and readable.

        Args:
            retrieved_docs (list[dict[str, Any]]): The list of documents retrieved from the vector store.

        Returns:
            list[dict[str, Any]]: A list of dictionaries representing structured references with snippets.
        """
        sources = []
        for doc in retrieved_docs:
            source = {
                "id": str(doc.get("_id", "")),
                "title": doc.get("title", ""),
                "tags": doc.get("tags", []),
            }
            content = str(doc.get("content", "")).strip()
            if content:
                source["snippet"] = content[:240]
            sources.append(source)
        return sources
