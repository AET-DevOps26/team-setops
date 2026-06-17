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
	onDelete,
}) {
	const [searchQuery, setSearchQuery] = useState("");
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

	const filteredLogs = logs.filter((log) => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return true;
		return (
			(log.serviceName && log.serviceName.toLowerCase().includes(query)) ||
			(log.severity && log.severity.toLowerCase().includes(query)) ||
			(log.type && log.type.toLowerCase().includes(query)) ||
			(log.logContent && log.logContent.toLowerCase().includes(query))
		);
	});

	return (
		<div className="log-list-wrapper">
			<div className="log-search-container">
				<span className="search-prompt">&gt;</span>
				<input
					type="text"
					className="log-search-input"
					placeholder="SEARCH LOGS (SERVICE, SEVERITY, MSG)..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				{searchQuery && (
					<button
						type="button"
						className="clear-search-btn"
						onClick={() => setSearchQuery("")}
					>
						[ESC]
					</button>
				)}
			</div>

			<div className="log-list" role="list" aria-label="Ingested logs">
				{filteredLogs.length === 0 ? (
					<div className="no-matches-text">
						&gt; NO LOGS MATCHING SEARCH QUERY
					</div>
				) : (
					filteredLogs.map((log) => {
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
									<button
										type="button"
										className="delete-btn"
										onClick={(e) => {
											e.stopPropagation();
											if (onDelete) onDelete(log.id);
										}}
										aria-label="Delete log"
									>
										✕
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
										log.analysis ? (
											<span className="analyzed-badge" aria-label="Already analyzed">
												[✓] ANALYZED
											</span>
										) : (
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
										)
									)}
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
