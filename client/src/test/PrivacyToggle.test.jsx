import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import PrivacyToggle from "../components/PrivacyToggle";
import {
	PrivacyModeProvider,
	usePrivacyMode,
} from "../context/PrivacyModeContext";
import { STORAGE_KEY } from "../context/privacyModeConstants";

// Setup localStorage Mock for Vitest JSDOM environment
const localStorageMock = (() => {
	let store = {};
	return {
		getItem: (key) => store[key] || null,
		setItem: (key, value) => { store[key] = String(value); },
		clear: () => { store = {}; },
		removeItem: (key) => { delete store[key]; }
	};
})();
Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
	writable: true,
	configurable: true
});

// Helper: render toggle wrapped in its required provider
function renderToggle() {
	return render(
		React.createElement(
			PrivacyModeProvider,
			null,
			React.createElement(PrivacyToggle),
		),
	);
}

// Helper component that displays the current mode for assertions
function ModeDisplay() {
	const { mode } = usePrivacyMode();
	return React.createElement("span", { "data-testid": "mode-value" }, mode);
}

function renderToggleWithModeDisplay() {
	return render(
		React.createElement(
			PrivacyModeProvider,
			null,
			React.createElement(PrivacyToggle),
			React.createElement(ModeDisplay),
		),
	);
}

describe("PrivacyToggle", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("should render both Local Only and Cloud Expert options", () => {
		renderToggle();
		expect(screen.getByText("Local Only")).toBeInTheDocument();
		expect(screen.getByText("Cloud Expert")).toBeInTheDocument();
	});

	it("should default to Local Only as the active mode", () => {
		renderToggle();
		const localBtn = screen.getByRole("radio", {
			name: /local only/i,
		});
		const cloudBtn = screen.getByRole("radio", {
			name: /cloud expert/i,
		});
		expect(localBtn).toHaveAttribute("aria-checked", "true");
		expect(cloudBtn).toHaveAttribute("aria-checked", "false");
	});

	it("should switch to Cloud Expert when clicked", () => {
		renderToggle();
		const cloudBtn = screen.getByRole("radio", {
			name: /cloud expert/i,
		});
		fireEvent.click(cloudBtn);

		expect(cloudBtn).toHaveAttribute("aria-checked", "true");
		expect(
			screen.getByRole("radio", { name: /local only/i }),
		).toHaveAttribute("aria-checked", "false");
	});

	it("should toggle back to Local Only when clicked again", () => {
		renderToggle();
		const cloudBtn = screen.getByRole("radio", {
			name: /cloud expert/i,
		});
		const localBtn = screen.getByRole("radio", {
			name: /local only/i,
		});

		fireEvent.click(cloudBtn);
		expect(cloudBtn).toHaveAttribute("aria-checked", "true");

		fireEvent.click(localBtn);
		expect(localBtn).toHaveAttribute("aria-checked", "true");
		expect(cloudBtn).toHaveAttribute("aria-checked", "false");
	});

	it("should update context mode value when toggled", () => {
		renderToggleWithModeDisplay();

		expect(screen.getByTestId("mode-value")).toHaveTextContent("local");

		fireEvent.click(
			screen.getByRole("radio", { name: /cloud expert/i }),
		);
		expect(screen.getByTestId("mode-value")).toHaveTextContent("cloud");

		fireEvent.click(
			screen.getByRole("radio", { name: /local only/i }),
		);
		expect(screen.getByTestId("mode-value")).toHaveTextContent("local");
	});

	it("should persist mode selection to localStorage", () => {
		renderToggle();

		fireEvent.click(
			screen.getByRole("radio", { name: /cloud expert/i }),
		);
		expect(localStorage.getItem(STORAGE_KEY)).toBe("cloud");

		fireEvent.click(
			screen.getByRole("radio", { name: /local only/i }),
		);
		expect(localStorage.getItem(STORAGE_KEY)).toBe("local");
	});

	it("should have proper radiogroup accessibility attributes", () => {
		renderToggle();
		const group = screen.getByRole("radiogroup", {
			name: /privacy mode/i,
		});
		expect(group).toBeInTheDocument();

		const radios = screen.getAllByRole("radio");
		expect(radios).toHaveLength(2);
	});
});
