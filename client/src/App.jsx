import { useState, useEffect, useCallback } from "react";
import "./App.css";
import PrivacyToggle from "@/components/PrivacyToggle";
import IngestModal from "@/components/IngestModal";
import LogList from "@/components/LogList";
import InsightsPanel from "@/components/InsightsPanel";
import { IngestIcon, EmptyLogsIcon, EmptyInsightsIcon } from "@/components/icons";
import { usePrivacyMode } from "@/context/PrivacyModeContext";
import { ingestLog, analyzeLog } from "@/lib/api";

let nextLogId = 1;

function App() {
	/* ── State ──────────────────────────────────────────── */
	const { mode } = usePrivacyMode();

	const [logs, setLogs] = useState([]);
	const [selectedLogId, setSelectedLogId] = useState(null);
	const [showIngestModal, setShowIngestModal] = useState(false);

	const [analysisResult, setAnalysisResult] = useState(null);
	const [analyzing, setAnalyzing] = useState(false);
	const [analysisError, setAnalysisError] = useState(null);

	const [clock, setClock] = useState(new Date());

	/* ── Live clock ─────────────────────────────────────── */
	useEffect(() => {
		const timer = setInterval(() => setClock(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	/* ── Handlers ───────────────────────────────────────── */
	const handleIngest = useCallback(async (payload) => {
		await ingestLog(payload);
		setLogs((prev) => [{ ...payload, id: nextLogId++ }, ...prev]);
	}, []);

	const handleAnalyze = useCallback(
		async (log) => {
			setAnalyzing(true);
			setAnalysisError(null);
			setAnalysisResult(null);

			try {
				const result = await analyzeLog(log.logContent, mode);
				setAnalysisResult(result);
			} catch (err) {
				setAnalysisError(err.message || "Analysis failed");
			} finally {
				setAnalyzing(false);
			}
		},
		[mode],
	);

	const handleSelectLog = useCallback((id) => {
		setSelectedLogId((prev) => (prev === id ? null : id));
	}, []);

	/* ── Render ─────────────────────────────────────────── */
	const hasLogs = logs.length > 0;

	return (
		<div className="page">
			<div className="scanlines" aria-hidden="true"></div>
			<div className="frame">
				<header className="topbar">
					<div className="brand">
						<div className="brand-mark">&gt;_</div>
						<div>
							<h1 className="brand-title">DevPulse</h1>
							<p className="brand-sub">Intelligent Logbook v1.0.0</p>
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
						) : analysisResult ? (
							<div className="panel-body">
								<InsightsPanel loading={false} result={analysisResult} />
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
		</div>
	);
}

export default App;
