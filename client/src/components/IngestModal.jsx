import { useState } from "react";
import "./IngestModal.css";

const SEVERITIES = ["INFO", "WARNING", "ERROR", "CRITICAL"];
const LOG_TYPES = [
	{ value: "DEPLOYMENT_LOG", label: "Deployment Log" },
	{ value: "BUILD_ERRORS", label: "Build Errors" },
	{ value: "TROUBLESHOOTING_NOTE", label: "Troubleshooting Note" },
];

export default function IngestModal({ onSubmit, onClose }) {
	const [serviceName, setServiceName] = useState("");
	const [logContent, setLogContent] = useState("");
	const [severity, setSeverity] = useState("ERROR");
	const [logType, setLogType] = useState("DEPLOYMENT_LOG");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const canSubmit =
		serviceName.trim().length > 0 && logContent.trim().length > 0;

	async function handleSubmit(e) {
		e.preventDefault();
		if (!canSubmit || submitting) return;

		setSubmitting(true);
		setError(null);

		try {
			await onSubmit({
				serviceName: serviceName.trim(),
				logContent: logContent.trim(),
				timestamp: new Date().toISOString(),
				severity,
				type: logType,
				metadata: {},
			});
			onClose();
		} catch (err) {
			setError(err.message || "Failed to ingest log");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div
				className="modal"
				role="dialog"
				aria-label="Ingest Log"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<div className="modal-tag">Ingest Log</div>
					<button
						type="button"
						className="modal-close"
						onClick={onClose}
						aria-label="Close"
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="modal-form">
					<div className="form-group">
						<label htmlFor="ingest-service" className="form-label">
							Service Name
						</label>
						<input
							id="ingest-service"
							type="text"
							className="form-input"
							placeholder="e.g. api-gateway, auth-service"
							value={serviceName}
							onChange={(e) => setServiceName(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="form-group">
						<label htmlFor="ingest-content" className="form-label">
							Log Content
						</label>
						<textarea
							id="ingest-content"
							className="form-textarea"
							placeholder="Paste your logs, stack traces, or error output here..."
							rows={8}
							value={logContent}
							onChange={(e) => setLogContent(e.target.value)}
						/>
					</div>

					<div className="form-row">
						<div className="form-group">
							<label htmlFor="ingest-severity" className="form-label">
								Severity
							</label>
							<select
								id="ingest-severity"
								className="form-select"
								value={severity}
								onChange={(e) => setSeverity(e.target.value)}
							>
								{SEVERITIES.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</div>

						<div className="form-group">
							<label htmlFor="ingest-type" className="form-label">
								Log Type
							</label>
							<select
								id="ingest-type"
								className="form-select"
								value={logType}
								onChange={(e) => setLogType(e.target.value)}
							>
								{LOG_TYPES.map((t) => (
									<option key={t.value} value={t.value}>
										{t.label}
									</option>
								))}
							</select>
						</div>
					</div>

					{error && (
						<div className="form-error" role="alert">
							{error}
						</div>
					)}

					<div className="form-actions">
						<button
							type="button"
							className="ghost-btn compact"
							onClick={onClose}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="ghost-btn compact submit-btn"
							disabled={!canSubmit || submitting}
						>
							{submitting ? (
								<>
									<span className="spinner" aria-hidden="true" />
									Sending…
								</>
							) : (
								"Ingest Log"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
