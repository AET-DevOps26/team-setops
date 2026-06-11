import { createContext, useContext, useState, useCallback, useMemo } from "react";
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

	const value = useMemo(
		() => ({ mode, setMode, toggleMode, isLocal: mode === MODES.LOCAL }),
		[mode, setMode, toggleMode],
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

