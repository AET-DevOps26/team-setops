import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { STORAGE_KEY, MODES } from "./privacyModeConstants";

function getInitialMode() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === MODES.LOCAL || stored === MODES.CLOUD) return stored;
	} catch {
		// localStorage unavailable (SSR, privacy mode, etc.)
	}
	return MODES.LOCAL;
}

const PrivacyModeContext = createContext(undefined);

export function PrivacyModeProvider({ children }) {
	const [mode, setModeState] = useState(getInitialMode);
	const [localThreads, setLocalThreads] = useState(null);
	const [localThreadsRecommended, setLocalThreadsRecommended] = useState(null);

	const setMode = useCallback((newMode) => {
		if (newMode !== MODES.LOCAL && newMode !== MODES.CLOUD) return;
		setModeState(newMode);
		try {
			localStorage.setItem(STORAGE_KEY, newMode);
		} catch {
			// ignore write failures
		}
	}, []);

	const toggleMode = useCallback(() => {
		setMode(mode === MODES.LOCAL ? MODES.CLOUD : MODES.LOCAL);
	}, [mode, setMode]);

	// Deployments with a constrained CPU limit report
	useEffect(() => {
		const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
		fetch(`${baseUrl}/health`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.local_threads) {
					setLocalThreads(data.local_threads);
					setLocalThreadsRecommended(data.local_threads_recommended);
				}
			})
			.catch(() => {
				// Best-effort; no warning shown if health is unreachable.
			});
	}, []);

	const value = useMemo(
		() => ({
			mode,
			setMode,
			toggleMode,
			isLocal: mode === MODES.LOCAL,
			localThreads,
			localThreadsRecommended,
			isResourceConstrained: Boolean(localThreads && localThreads < localThreadsRecommended),
		}),
		[mode, setMode, toggleMode, localThreads, localThreadsRecommended],
	);

	return (
		<PrivacyModeContext.Provider value={value}>
			{children}
		</PrivacyModeContext.Provider>
	);
}

export function usePrivacyMode() {
	const context = useContext(PrivacyModeContext);
	if (context === undefined) {
		throw new Error("usePrivacyMode must be used within a PrivacyModeProvider");
	}
	return context;
}

