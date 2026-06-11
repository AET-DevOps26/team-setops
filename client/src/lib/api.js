const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

/**
 * Sends log content to the backend analysis endpoint.
 *
 * @param {string} content  – Raw log / incident text to analyze.
 * @param {string} mode     – "local" or "cloud" (maps to GenAI provider strategy).
 * @param {object} [options]
 * @param {boolean} [options.useRag=false]  – Enable RAG context retrieval.
 * @param {string}  [options.context]       – Additional situational context.
 * @returns {Promise<object>} Structured analysis result from py-intelligence.
 */
export async function analyzeLog(content, mode, { useRag = false, context = null } = {}) {
	const response = await fetch(`${BASE_URL}/analyze`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			content,
			mode,
			use_rag: useRag,
			context,
		}),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: response.statusText }));
		throw new Error(error.detail || `Analysis failed (${response.status})`);
	}

	return response.json();
}
