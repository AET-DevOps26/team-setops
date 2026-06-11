import { usePrivacyMode } from "@/context/PrivacyModeContext";
import "./PrivacyToggle.css";

export default function PrivacyToggle() {
	const { setMode, isLocal } = usePrivacyMode();

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
					<svg
						className="toggle-icon"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2C20 17.5 12 22 12 22z"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
							stroke="currentColor"
							strokeWidth="1.5"
						/>
						<path
							d="M12 10v0"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
					</svg>
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
					<svg
						className="toggle-icon"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 1 0 0-10z"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
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
		</div>
	);
}
