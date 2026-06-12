/**
 * API helper for DevPulse backend services.
 *
 * In local dev, Vite proxy routes /api/v1/* to the correct backends.
 * In Docker, VITE_API_BASE_URL points to the nginx gateway (http://localhost:8080).
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Ingest a deployment log into the system via spring-ingestion.
 *
 * @param {object} payload
 * @param {string} payload.serviceName   – Name of the service (e.g. "api-gateway").
 * @param {string} payload.logContent    – Raw log / stack trace text.
 * @param {string} payload.timestamp     – ISO 8601 timestamp.
 * @param {string} payload.severity      – INFO | WARNING | ERROR | CRITICAL.
 * @param {string} payload.type          – DEPLOYMENT_LOG | BUILD_ERRORS | TROUBLESHOOTING_NOTE.
 * @param {object} [payload.metadata]    – Optional key-value metadata.
 * @returns {Promise<void>} Resolves on 202 Accepted.
 */
export async function ingestLog(payload) {
	const response = await fetch(`${BASE_URL}/api/v1/logs`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const error = await response
			.json()
			.catch(() => ({ detail: response.statusText }));
		throw new Error(
			error.detail || error.message || `Ingestion failed (${response.status})`,
		);
	}
}

/**
 * Analyze log content via py-intelligence.
 *
 * @param {string} content  – Raw log / incident text to analyze.
 * @param {string} mode     – "local" or "cloud" (maps to GenAI provider strategy).
 * @param {object} [options]
 * @param {boolean} [options.useRag=false]  – Enable RAG context retrieval.
 * @param {string}  [options.context]       – Additional situational context.
 * @returns {Promise<object>} Structured analysis result.
 */
export async function analyzeLog(
	content,
	mode,
	{ useRag = false, context = null } = {},
) {
	const response = await fetch(`${BASE_URL}/api/v1/analyze`, {
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
		const error = await response
			.json()
			.catch(() => ({ detail: response.statusText }));
		throw new Error(
			error.detail || `Analysis failed (${response.status})`,
		);
	}

	return response.json();
}

/**
 * Check py-intelligence service health.
 *
 * @returns {Promise<object>} Health status object.
 */
export async function checkHealth() {
	const response = await fetch(`${BASE_URL}/health`);
	if (!response.ok) {
		throw new Error(`Health check failed (${response.status})`);
	}
	return response.json();
}
