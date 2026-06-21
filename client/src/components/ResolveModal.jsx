import { useState } from "react";
import "./ResolveModal.css";

export default function ResolveModal({ result, onResolve, onClose }) {
	const [solutionText, setSolutionText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const canSubmitRag = solutionText.trim().length > 0;

	async function handleSimpleClose() {
		setSubmitting(true);
		setError(null);
		try {
			await onResolve("simple");
			onClose();
		} catch (err) {
			setError(err.message || "Failed to resolve issue");
		} finally {
			setSubmitting(false);
		}
	}

	async function handleRagSubmit(e) {
		e.preventDefault();
		if (!canSubmitRag || submitting) return;

		setSubmitting(true);
		setError(null);
		try {
			await onResolve("rag", solutionText.trim());
			onClose();
		} catch (err) {
			setError(err.message || "Failed to submit solution");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div
				className="modal resolve-modal"
				role="dialog"
				aria-label="Resolve Issue"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<div className="modal-tag">Resolve Issue</div>
					<button
						type="button"
						className="modal-close"
						onClick={onClose}
						aria-label="Close"
					>
						✕
					</button>
				</div>

				<div className="resolve-body">
					{/* Issue context */}
					{result && (
						<div className="resolve-context">
							<span className="resolve-context-label">Issue:</span>
							<span className="resolve-context-value">
								{result.problem_type}
								{result.severity && ` — ${result.severity}`}
							</span>
						</div>
					)}

					{/* ── Option A: Simple Close ────────────────── */}
					<div className="resolve-section">
						<div className="resolve-section-label">Option A — Quick Resolve</div>
						<p className="resolve-section-desc">
							Mark this issue as resolved without additional details.
						</p>
						<button
							type="button"
							className="ghost-btn compact resolve-simple-btn"
							id="btn-resolve-simple"
							onClick={handleSimpleClose}
							disabled={submitting}
						>
							{submitting ? (
								<>
									<span className="spinner" aria-hidden="true" />
									Resolving…
								</>
							) : (
								"Mark as Resolved"
							)}
						</button>
					</div>

					{/* ── Divider ───────────────────────────────── */}
					<div className="resolve-divider">
						<span className="resolve-divider-text">or</span>
					</div>

					{/* ── Option B: RAG Feedback ────────────────── */}
					<form className="resolve-section" onSubmit={handleRagSubmit}>
						<div className="resolve-section-label">
							Option B — Submit to Knowledge Base
						</div>
						<p className="resolve-section-desc">
							Share your custom solution or root-cause fix to improve future AI
							analyses via the RAG system.
						</p>
						<div className="form-group">
							<label htmlFor="resolve-solution" className="form-label">
								Your Solution
							</label>
							<textarea
								id="resolve-solution"
								className="form-textarea"
								placeholder="Describe the root cause and how you resolved it…"
								rows={5}
								value={solutionText}
								onChange={(e) => setSolutionText(e.target.value)}
							/>
						</div>
						<button
							type="submit"
							className="ghost-btn compact submit-btn resolve-rag-btn"
							id="btn-resolve-rag"
							disabled={!canSubmitRag || submitting}
						>
							{submitting ? (
								<>
									<span className="spinner" aria-hidden="true" />
									Submitting…
								</>
							) : (
								"Submit Solution & Resolve"
							)}
						</button>
					</form>

					{/* ── Error ─────────────────────────────────── */}
					{error && (
						<div className="form-error" role="alert">
							{error}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
