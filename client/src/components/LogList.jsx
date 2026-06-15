import "./LogList.css";

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
	return (
		<div className="log-list" role="list" aria-label="Ingested logs">
			{logs.map((log) => {
				const isSelected = selectedId === log.id;
				return (
					<div
						key={log.id}
						role="listitem"
						className={`log-entry ${isSelected ? "selected" : ""}`}
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
						</div>

						<pre className="log-preview">{log.logContent}</pre>

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
											<svg
												className="ghost-icon"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													d="M22 26a10 10 0 0 1 20 0c0 7-6 8-6 14H28c0-6-6-7-6-14z"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
												/>
												<path
													d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
													fill="none"
													stroke="currentColor"
													strokeWidth="1.5"
													strokeLinecap="round"
													strokeLinejoin="round"
												/>
											</svg>
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
