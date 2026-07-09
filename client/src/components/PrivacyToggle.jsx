import { useState } from "react";
import { usePrivacyMode } from "@/context/PrivacyModeContext";
import "./PrivacyToggle.css";
import { LocalIcon, CloudIcon } from "@/components/icons";

export default function PrivacyToggle() {
	const { setMode, isLocal, isResourceConstrained, localThreads, localThreadsRecommended } = usePrivacyMode();
	const [warningDismissed, setWarningDismissed] = useState(false);

	return (
		<div className="privacy-toggle-wrapper">
			<div
				className="privacy-toggle"
				role="radiogroup"
				aria-label="Privacy mode selection"
				id="privacy-toggle"
			>
				<div
					className={`toggle-indicator ${isLocal ? "indicator-local" : "indicator-cloud"}`}
					aria-hidden="true"
				/>

				<button
					type="button"
					role="radio"
					aria-checked={isLocal}
					aria-label="Local Only – Private analysis"
					className={`toggle-option ${isLocal ? "active" : ""}`}
					onClick={() => setMode("local")}
					id="privacy-toggle-local"
				>
					<LocalIcon />
					<span className="toggle-label">Local Only</span>
				</button>

				<button
					type="button"
					role="radio"
					aria-checked={!isLocal}
					aria-label="Cloud Expert – Standard cloud analysis"
					className={`toggle-option ${!isLocal ? "active" : ""}`}
					onClick={() => setMode("cloud")}
					id="privacy-toggle-cloud"
				>
					<CloudIcon />
					<span className="toggle-label">Cloud Expert</span>
				</button>
			</div>

			<div className="toggle-hint" aria-live="polite">
				{isLocal ? (
					<>
						<span className="hint-dot hint-dot--local" />
						Data stays on-device
					</>
				) : (
					<>
						<span className="hint-dot hint-dot--cloud" />
						Cloud AI analysis
					</>
				)}
			</div>

			{isLocal && isResourceConstrained && !warningDismissed && (
				<div className="toggle-alert" role="alert">
					<svg
						className="toggle-alert-icon"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<span>
						Only {localThreads} of the recommended {localThreadsRecommended} CPU cores are available on
						this deployment, so local analysis may respond slowly or result in a Timeout error. Make sure
						to allocate more resources.
					</span>
					<button
						type="button"
						className="toggle-alert-close"
						onClick={() => setWarningDismissed(true)}
						aria-label="Dismiss warning"
					>
						✕
					</button>
				</div>
			)}
		</div>
	);
}
