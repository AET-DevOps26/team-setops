import { useState, useEffect, useCallback } from "react";
import "./App.css";
import PrivacyToggle from "@/components/PrivacyToggle";
import IngestModal from "@/components/IngestModal";
import ResolveModal from "@/components/ResolveModal";
import LogList from "@/components/LogList";
import InsightsPanel from "@/components/InsightsPanel";
import { IngestIcon, EmptyLogsIcon, EmptyInsightsIcon } from "@/components/icons";
import { usePrivacyMode } from "@/context/PrivacyModeContext";
import createClient from "openapi-fetch";

const client = createClient({ baseUrl: import.meta.env.VITE_API_BASE_URL || "" });

function App() {
	/* ── State ──────────────────────────────────────────── */
	const { mode } = usePrivacyMode();

	const [theme, setTheme] = useState(() => {
		try {
			if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
				return localStorage.getItem("devpulse-theme") || "cyan";
			}
		} catch {
			// ignore
		}
		return "cyan";
	});
	const [useRag, setUseRag] = useState(true);
	const [logs, setLogs] = useState([]);
	const [selectedLogId, setSelectedLogId] = useState(null);
	const [showIngestModal, setShowIngestModal] = useState(false);

	const [analyzing, setAnalyzing] = useState(false);
	const [analysisError, setAnalysisError] = useState(null);

	const [showResolveModal, setShowResolveModal] = useState(false);
	const [notification, setNotification] = useState(null);

	const [clock, setClock] = useState(new Date());

	useEffect(() => {
		try {
			if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
				localStorage.setItem("devpulse-theme", theme);
			}
		} catch {
			// ignore
		}
	}, [theme]);

	/* ── Helper: fetch logs + resolved state from backend ── */
	const loadLogsAndIncidents = useCallback(async () => {
		const [logsRes, incidentsRes] = await Promise.all([
			client.GET("/api/v1/logs"),
			client.GET("/api/v1/incidents", { params: { query: { status: "RESOLVED" } } }),
		]);

		if (!logsRes.response.ok) throw new Error(`Failed to fetch logs (${logsRes.response.status})`);
		if (!incidentsRes.response.ok) throw new Error(`Failed to fetch incidents (${incidentsRes.response.status})`);

		const resolvedIds = new Set((incidentsRes.data || []).map((inc) => inc.logId));

		return (logsRes.data || []).map((log) => {
			// Backend entity uses "logId"; normalise to "id" for the frontend
			const id = log.id ?? log.logId;
			return {
				...log,
				id,
				resolved: resolvedIds.has(id),
			};
		});
	}, []);

	/* ── Load timeline & resolved state on mount ────────── */
	useEffect(() => {
		let cancelled = false;

		loadLogsAndIncidents()
			.then((data) => { if (!cancelled) setLogs(data); })
			.catch((err) => console.error("Failed to load initial data:", err));

		return () => { cancelled = true; };
	}, [loadLogsAndIncidents]);

	/* ── Live clock ─────────────────────────────────────── */
	useEffect(() => {
		const timer = setInterval(() => setClock(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	/* ── Auto-dismiss notification ──────────────────────── */
	useEffect(() => {
		if (!notification) return;
		const timer = setTimeout(() => setNotification(null), 3000);
		return () => clearTimeout(timer);
	}, [notification]);

	/* ── Handlers ───────────────────────────────────────── */
	const handleIngest = useCallback(async (payload) => {
		const { response } = await client.POST("/api/v1/logs", { body: payload });
		if (!response.ok) throw new Error(`Ingestion failed (${response.status})`);

		// Optimistically add the log locally so it appears immediately
		const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
		setLogs((prev) => [{ ...payload, id: tempId }, ...prev]);

		// Re-fetch from server after a short delay to allow async
		// RabbitMQ processing to complete (ingestion → logbook)
		setTimeout(async () => {
			try {
				const data = await loadLogsAndIncidents();
				setLogs(data);
			} catch {
				// Fallback: add locally with a temp id
				setLogs((prev) => [{ ...payload, id: Date.now().toString() + Math.random().toString(36).substring(2) }, ...prev]);
			}
		}, 1500);
	}, [loadLogsAndIncidents]);

	const handleAnalyze = useCallback(
		async (log) => {
			setAnalyzing(true);
			setAnalysisError(null);

			try {
				const { data, error, response } = await client.POST("/api/v1/analyze", {
					body: { content: log.logContent, mode, use_rag: useRag, context: null },
				});
				if (!response.ok || error) {
					throw new Error(error?.detail || `Analysis failed (${response.status})`);
				}
				setLogs((prev) =>
					prev.map((l) =>
						l.id === log.id ? { ...l, analysis: data, resolved: false } : l
					)
				);
			} catch (err) {
				setAnalysisError(err.message || "Analysis failed");
			} finally {
				setAnalyzing(false);
			}
		},
		[mode, useRag],
	);

	const handleSelectLog = useCallback((id) => {
		setSelectedLogId((prev) => (prev === id ? null : id));
	}, []);

	const handleDelete = useCallback(async (id) => {
		try {
			const res = await client.DELETE("/api/v1/logs/{id}", { params: { path: { id } } });
			if (res.response && !res.response.ok && res.response.status !== 404) {
				console.error("Failed to delete from backend", res.response.status);
			}
		} catch (e) {
			console.error("Delete error:", e);
		}
		setLogs((prev) => prev.filter((l) => l.id !== id));
		setSelectedLogId((prev) => (prev === id ? null : prev));
		setNotification("Log entry removed");
	}, []);

	const handleResolve = useCallback(
		async (type, solutionText) => {
			const selectedLog = logs.find((l) => l.id === selectedLogId);
			const activeAnalysis = selectedLog?.analysis;
			if (type === "rag" && solutionText) {
				const title = activeAnalysis?.problem_type || "Resolved Issue";
				await client.POST("/api/v1/rag/documents", {
					body: {
						title,
						content: solutionText,
						tags: [activeAnalysis?.severity || "unknown", "user-solution"],
					},
				});
			}
			// Persist resolved status to the backend
			await client.PATCH("/api/v1/incidents/{logId}/status", {
				params: { path: { logId: selectedLogId } },
				body: { status: "RESOLVED" },
			});
			setLogs((prev) =>
				prev.map((l) =>
					l.id === selectedLogId ? { ...l, resolved: true } : l
				)
			);
			setNotification(
				type === "rag"
					? "Issue resolved — solution submitted to knowledge base"
					: "Issue marked as resolved",
			);
		},
		[logs, selectedLogId],
	);

	/* ── Render ─────────────────────────────────────────── */
	const hasLogs = logs.length > 0;
	const selectedLog = logs.find((l) => l.id === selectedLogId);
	const currentAnalysisResult = selectedLog?.analysis || null;
	const isCurrentLogResolved = selectedLog?.resolved || false;

	return (
		<div className={`page theme-${theme}`}>
			<div className="scanlines" aria-hidden="true"></div>
			<div className="frame">
				<header className="topbar">
					<div className="brand">
						<div className="brand-mark">&gt;_</div>
						<div>
							<h1 className="brand-title">DEVPULSE</h1>
							<p className="brand-sub">INTELLIGENT LOGBOOK // SYSTEM_ONLINE</p>
						</div>
					</div>
					<div className="actions">
						<button
							type="button"
							className="ghost-btn"
							id="btn-ingest"
							onClick={() => setShowIngestModal(true)}
						>
							<IngestIcon />
							Ingest Logs
						</button>
						{hasLogs && (
							<button
								type="button"
								className="ghost-btn"
								id="btn-clear"
								onClick={async () => {
									try {
										const res = await client.DELETE("/api/v1/logs");
										if (res.response && !res.response.ok) {
											console.error("Failed to clear backend logs", res.response.status);
										}
									} catch(e) {
										console.error("Clear logs error:", e);
									}
									setLogs([]);
									setSelectedLogId(null);
									setNotification("All logs cleared");
								}}
							>
								Clear Logs
							</button>
						)}
						<label className="rag-toggle" aria-label="Include Past Solutions (RAG)">
							<input
								type="checkbox"
								className="rag-toggle-checkbox"
								checked={useRag}
								onChange={(e) => setUseRag(e.target.checked)}
							/>
							<span className="rag-toggle-text">RAG Search</span>
						</label>
						<PrivacyToggle />
					</div>
				</header>

				<main className="content">
					{/* ── System Logs Panel ─────────────────────── */}
					<section className="panel">
						<div className="panel-tag">System Logs</div>
						{hasLogs ? (
							<div className="panel-body">
								<LogList
									logs={logs}
									selectedId={selectedLogId}
									onSelect={handleSelectLog}
									onAnalyze={handleAnalyze}
									analyzing={analyzing}
									onDelete={handleDelete}
								/>
							</div>
						) : (
							<div className="panel-body empty">
								<EmptyLogsIcon />
								<p className="empty-title">No Logs Ingested</p>
								<button
									type="button"
									className="ghost-btn compact"
									onClick={() => setShowIngestModal(true)}
								>
									Ingest Your First Logs
								</button>
							</div>
						)}
					</section>

					{/* ── AI Insights Panel ─────────────────────── */}
					<section className="panel">
						<div className="panel-tag">AI Insights</div>
						{analyzing ? (
							<div className="panel-body">
								<InsightsPanel loading={true} result={null} />
							</div>
						) : currentAnalysisResult ? (
							<div className="panel-body">
								<InsightsPanel
									loading={false}
									result={currentAnalysisResult}
									resolved={isCurrentLogResolved}
									onMarkResolved={() => setShowResolveModal(true)}
								/>
							</div>
						) : (
							<div className="panel-body empty">
								<EmptyInsightsIcon />
								{analysisError ? (
									<p className="empty-title error-text">{analysisError}</p>
								) : (
									<p className="empty-title">
										Select a log entry and click
										<br />
										<span className="accent">Analyze</span> to view insights
									</p>
								)}
								<div className="empty-dots" aria-hidden="true">
									<span className="dot"></span>
									<span className="dot"></span>
									<span className="dot"></span>
									<span className="dot"></span>
								</div>
							</div>
						)}
					</section>
				</main>

				<footer className="statusbar">
					<div className="status-left">
						<span className="status-dot"></span>
						System Online
						<span className="divider"></span>
						{logs.length} Log{logs.length !== 1 ? "s" : ""} Ingested
						<span className="divider"></span>
						<span className="mode-indicator">
							Mode: {mode === "local" ? "🔒 Local" : "☁️ Cloud"}
						</span>
						<span className="divider"></span>
						<button
							type="button"
							className="theme-btn"
							onClick={() => setTheme((prev) => prev === "cyan" ? "green" : prev === "green" ? "amber" : "cyan")}
							aria-label="Cycle UI theme"
						>
							🎨 Theme: {theme.toUpperCase()}
						</button>
					</div>
					<div className="status-right">{clock.toLocaleString()}</div>
				</footer>
			</div>

			{/* ── Ingest Modal ──────────────────────────────── */}
			{showIngestModal && (
				<IngestModal
					onSubmit={handleIngest}
					onClose={() => setShowIngestModal(false)}
				/>
			)}

			{/* ── Resolve Modal ─────────────────────────────── */}
			{showResolveModal && (
				<ResolveModal
					result={currentAnalysisResult}
					onResolve={handleResolve}
					onClose={() => setShowResolveModal(false)}
				/>
			)}

			{/* ── Success Notification Toast ────────────────── */}
			{notification && (
				<div className="toast" role="status" aria-live="polite">
					<svg
						className="toast-icon"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M20 6L9 17l-5-5"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					{notification}
				</div>
			)}
		</div>
	);
}

export default App;
