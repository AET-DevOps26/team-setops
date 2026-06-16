import { useState } from "react";
import "./LogList.css";
import { AnalyzeIcon, ChevronIcon } from "@/components/icons";

const SEVERITY_COLORS = {
	INFO: "#4dd0e1",
	WARNING: "#ffd93d",
	ERROR: "#ff6b9d",
	CRITICAL: "#ff3d71",
};

export default function LogList({
	logs,
	selectedId,
	onSelect,
	onAnalyze,
	analyzing,
}) {
	const [expandedIds, setExpandedIds] = useState(new Set());

	const toggleExpand = (id, e) => {
		e.stopPropagation();
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	return (
		<div className="log-list" role="list" aria-label="Ingested logs">
			{logs.map((log) => {
				const isSelected = selectedId === log.id;
				const isExpanded = expandedIds.has(log.id);
				return (
					<div
						key={log.id}
						role="listitem"
						className={`log-entry ${isSelected ? "selected" : ""} ${isExpanded ? "expanded" : ""}`}
						onClick={() => onSelect(log.id)}
					>
						<div className="log-entry-header">
							<span
								className="severity-badge"
								style={{
									color: SEVERITY_COLORS[log.severity] || "#8bb4d9",
									borderColor: SEVERITY_COLORS[log.severity] || "#2a3a6a",
								}}
							>
								{log.severity}
							</span>
							<span className="log-service">{log.serviceName}</span>
							<span className="log-type">{log.type.replace(/_/g, " ")}</span>
							<button
								type="button"
								className={`expand-btn ${isExpanded ? "expanded" : ""}`}
								onClick={(e) => toggleExpand(log.id, e)}
								aria-label={isExpanded ? "Collapse log" : "Expand log"}
								aria-expanded={isExpanded}
							>
								<ChevronIcon />
							</button>
						</div>

						<pre className={`log-preview ${isExpanded ? "log-preview--expanded" : ""}`}>
							{log.logContent}
						</pre>

						<div className="log-entry-footer">
							<span className="log-time">
								{new Date(log.timestamp).toLocaleString()}
							</span>
							{isSelected && (
								<button
									type="button"
									className="ghost-btn compact analyze-btn"
									onClick={(e) => {
										e.stopPropagation();
										onAnalyze(log);
									}}
									disabled={analyzing}
								>
									{analyzing ? (
										<>
											<span className="spinner" aria-hidden="true" />
											Analyzing…
										</>
									) : (
										<>
											<AnalyzeIcon />
											Analyze
										</>
									)}
								</button>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
