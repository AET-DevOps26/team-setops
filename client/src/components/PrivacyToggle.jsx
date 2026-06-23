import { usePrivacyMode } from "@/context/PrivacyModeContext";
import "./PrivacyToggle.css";
import { LocalIcon, CloudIcon } from "@/components/icons";

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
		</div>
	);
}
