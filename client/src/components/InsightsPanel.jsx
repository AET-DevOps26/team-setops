import { useState, useEffect } from "react";
import "./InsightsPanel.css";

const CONFIDENCE_COLORS = {
	low: "#ff6b9d",
	medium: "#ffd93d",
	high: "#4dd0e1",
};

// Severity is an independent field from confidence and needs its own color
// scale (models don't strictly stick to one vocabulary, hence the aliases).
const SEVERITY_CLASSES = {
	critical: "severity-critical",
	high: "severity-high",
	medium: "severity-medium",
	warning: "severity-warning",
	low: "severity-low",
	info: "severity-info",
};

const STAGES = [
	"INITIALIZING CORE AGENT...",
	"ESTABLISHING INCIDENT CONTEXT...",
	"PARSING LOG STACK TRACES...",
	"RUNNING PROMPT INFERENCE...",
	"RETRIEVING LATEST RAG RUNBOOKS...",
	"COMPILING REMEDIES...",
	"FINALIZING DIAGNOSTIC REPORT...",
];

function RetroLoader() {
	const [progress, setProgress] = useState(0);
	const [stage, setStage] = useState(0);

	useEffect(() => {
		const progressInterval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(progressInterval);
					return 100;
				}
				const increment = Math.floor(Math.random() * 8) + 4;
				const nextProgress = Math.min(prev + increment, 100);

				const stageIndex = Math.min(
					Math.floor((nextProgress / 100) * STAGES.length),
					STAGES.length - 1,
				);
				setStage(stageIndex);

				return nextProgress;
			});
		}, 250);

		return () => clearInterval(progressInterval);
	}, []);

	const totalBars = 20;
	const filledBars = Math.round((progress / 100) * totalBars);
	const emptyBars = totalBars - filledBars;
	const barString =
		"=".repeat(Math.max(0, filledBars - 1)) +
		(filledBars > 0 ? ">" : "") +
		" ".repeat(emptyBars);

	return (
		<div className="insights-loading retro-terminal-loader">
			<pre className="ascii-spinner">
				{`
   __  __  ____   ____  _     ___ _   _  ____ 
  |  \\/  |/ ___| / ___|| |   |_ _| \\ | |/ ___|
  | |\\/| | |  _  \\___ \\| |    | ||  \\| | |  _ 
  | |  | | |_| |  ___) | |___ | || |\\  | |_| |
  |_|  |_|\\____| |____/|_____|___|_| \\_|\\____|
`}
			</pre>
			<div className="terminal-progress-info">
				<span className="accent">&gt;</span> {STAGES[stage]}
			</div>
			<div className="terminal-progress-bar">
				[{barString}] {progress}%
			</div>
			<p className="insights-loading-sub">
				Please stand by. Core reasoning engine is processing log patterns.
			</p>
		</div>
	);
}

export default function InsightsPanel({
	result,
	loading,
	resolved,
	onMarkResolved,
}) {
	if (loading) {
		return <RetroLoader />;
	}

	if (!result) return null;

	const confidenceColor =
		CONFIDENCE_COLORS[result.confidence] || CONFIDENCE_COLORS.low;
	const severityClass =
		SEVERITY_CLASSES[(result.severity || "").toLowerCase()] || "severity-unknown";

	return (
		<div className="insights" role="region" aria-label="AI Analysis Results">
			{/* Header */}
			<div className="insights-header">
				<span className="insights-type">{result.problem_type}</span>
				<span className={`insights-severity ${severityClass}`}>
					{result.severity}
				</span>
				<span
					className="insights-confidence"
					style={{ color: confidenceColor }}
				>
					{result.confidence} confidence
				</span>
				{result.model && (
					<span className="insights-model">via {result.model}</span>
				)}
			</div>

			{/* Summary */}
			{result.summary && (
				<div className="insights-section">
					<div className="insights-label">Summary</div>
					<p className="insights-text">{result.summary}</p>
				</div>
			)}

			{/* Problem */}
			{result.problem_summary && (
				<div className="insights-section">
					<div className="insights-label">Root Cause</div>
					<p className="insights-text">{result.problem_summary}</p>
				</div>
			)}

			{/* Evidence */}
			{result.evidence && result.evidence.length > 0 && (
				<div className="insights-section">
					<div className="insights-label">Evidence</div>
					<ul className="insights-list">
						{result.evidence.map((item, i) => (
							<li key={i} className="insights-evidence-item">
								{typeof item === "string" ? item : JSON.stringify(item)}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Troubleshooting */}
			{result.troubleshoot && result.troubleshoot.length > 0 && (
				<div className="insights-section">
					<div className="insights-label">Troubleshooting Steps</div>
					<ol className="insights-list ordered">
						{result.troubleshoot.map((step, i) => (
							<li key={i}>
								{typeof step === "string" ? step : JSON.stringify(step)}
							</li>
						))}
					</ol>
				</div>
			)}

			{/* Solutions */}
			{result.solutions && result.solutions.length > 0 && (
				<div className="insights-section">
					<div className="insights-label">Proposed Solutions</div>
					<ol className="insights-list ordered">
						{result.solutions.map((sol, i) => (
							<li key={i}>
								{typeof sol === "string" ? sol : JSON.stringify(sol)}
							</li>
						))}
					</ol>
				</div>
			)}

			{/* Sources */}
			{result.sources && result.sources.length > 0 && (
				<div className="insights-section">
					<div className="insights-label">Sources</div>
					<ul className="insights-list">
						{result.sources.map((src, i) => (
							<li key={i} className="insights-source">
								{src.title || src.id || `Source ${i + 1}`}
								{src.snippet && (
									<span className="source-snippet">{src.snippet}</span>
								)}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* ── Resolution Action ────────────────────────── */}
			<div className="insights-section insights-resolve-section">
				{resolved ? (
					<div className="resolved-badge" aria-label="Issue resolved">
						<svg
							className="resolved-icon"
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
						Resolved
					</div>
				) : (
					<button
						type="button"
						className="ghost-btn resolve-btn"
						id="btn-mark-resolved"
						onClick={onMarkResolved}
					>
						<svg
							className="ghost-icon"
							viewBox="0 0 24 24"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M22 4L12 14.01l-3-3"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
						Mark as Resolved
					</button>
				)}
			</div>
		</div>
	);
}
