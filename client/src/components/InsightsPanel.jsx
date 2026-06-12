import "./InsightsPanel.css";

const CONFIDENCE_COLORS = {
	low: "#ff6b9d",
	medium: "#ffd93d",
	high: "#4dd0e1",
};

export default function InsightsPanel({ result, loading }) {
	if (loading) {
		return (
			<div className="insights-loading">
				<div className="pulse-ring" aria-hidden="true" />
				<p className="insights-loading-text">Analyzing…</p>
				<p className="insights-loading-sub">
					Running AI analysis on selected log
				</p>
			</div>
		);
	}

	if (!result) return null;

	const confidenceColor =
		CONFIDENCE_COLORS[result.confidence] || CONFIDENCE_COLORS.low;

	return (
		<div className="insights" role="region" aria-label="AI Analysis Results">
			{/* Header */}
			<div className="insights-header">
				<span className="insights-type">{result.problem_type}</span>
				<span
					className="insights-severity"
					style={{ color: confidenceColor, borderColor: confidenceColor }}
				>
					{result.severity}
				</span>
				<span
					className="insights-confidence"
					style={{ color: confidenceColor }}
				>
					{result.confidence} confidence
				</span>
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
		</div>
	);
}
