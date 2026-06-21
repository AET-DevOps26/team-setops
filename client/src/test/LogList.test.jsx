import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LogList from "../components/LogList";

const mockLogs = [
	{
		id: 1,
		serviceName: "auth-service",
		logContent: "User login failed due to invalid credentials",
		severity: "WARNING",
		type: "TROUBLESHOOTING_NOTE",
		timestamp: "2026-06-16T12:00:00Z",
	},
	{
		id: 2,
		serviceName: "api-gateway",
		logContent: "NullPointerException in routing controller",
		severity: "ERROR",
		type: "BUILD_ERRORS",
		timestamp: "2026-06-16T12:01:00Z",
	},
];

function renderLogList(props = {}) {
	const defaultProps = {
		logs: mockLogs,
		selectedId: null,
		onSelect: vi.fn(),
		onAnalyze: vi.fn(),
		analyzing: false,
		...props,
	};
	return {
		...render(React.createElement(LogList, defaultProps)),
		...defaultProps,
	};
}

describe("LogList", () => {
	it("should render all log entries with service details", () => {
		renderLogList();

		expect(screen.getByText("auth-service")).toBeInTheDocument();
		expect(screen.getByText("api-gateway")).toBeInTheDocument();

		expect(screen.getByText("WARNING")).toBeInTheDocument();
		expect(screen.getByText("ERROR")).toBeInTheDocument();

		expect(screen.getByText("TROUBLESHOOTING NOTE")).toBeInTheDocument();
		expect(screen.getByText("BUILD ERRORS")).toBeInTheDocument();

		expect(screen.getByText("User login failed due to invalid credentials")).toBeInTheDocument();
		expect(screen.getByText("NullPointerException in routing controller")).toBeInTheDocument();
	});

	it("should call onSelect when clicking on a log entry", () => {
		const { onSelect } = renderLogList();

		const entry = screen.getByText("auth-service").closest(".log-entry");
		fireEvent.click(entry);

		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect).toHaveBeenCalledWith(1);
	});

	it("should show selected styling and the Analyze button only for the selected log", () => {
		const { container } = renderLogList({ selectedId: 2 });

		const entries = container.querySelectorAll(".log-entry");
		expect(entries[0]).not.toHaveClass("selected");
		expect(entries[1]).toHaveClass("selected");

		// Analyze button should only be in the second log
		const analyzeBtns = screen.getAllByRole("button", { name: /analyze/i });
		expect(analyzeBtns).toHaveLength(1);
		expect(entries[1]).toContainElement(analyzeBtns[0]);
	});

	it("should trigger onAnalyze when Analyze button is clicked", () => {
		const { onAnalyze } = renderLogList({ selectedId: 2 });

		const analyzeBtn = screen.getByRole("button", { name: /analyze/i });
		fireEvent.click(analyzeBtn);

		expect(onAnalyze).toHaveBeenCalledTimes(1);
		expect(onAnalyze).toHaveBeenCalledWith(mockLogs[1]);
	});

	it("should disable Analyze button and show analyzing text when analyzing is true", () => {
		renderLogList({ selectedId: 2, analyzing: true });

		const analyzingBtn = screen.getByRole("button", { name: /analyzing/i });
		expect(analyzingBtn).toBeDisabled();
		expect(analyzingBtn).toHaveTextContent("Analyzing…");
	});

	it("should toggle expanded class and log-preview--expanded class when clicking expand button", () => {
		const { container } = renderLogList();

		const firstEntry = container.querySelectorAll(".log-entry")[0];
		const firstPreview = firstEntry.querySelector(".log-preview");
		const expandBtn = firstEntry.querySelector(".expand-btn");

		expect(firstEntry).not.toHaveClass("expanded");
		expect(firstPreview).not.toHaveClass("log-preview--expanded");
		expect(expandBtn).toHaveAttribute("aria-expanded", "false");

		// Click expand
		fireEvent.click(expandBtn);

		expect(firstEntry).toHaveClass("expanded");
		expect(firstPreview).toHaveClass("log-preview--expanded");
		expect(expandBtn).toHaveAttribute("aria-expanded", "true");

		// Click collapse
		fireEvent.click(expandBtn);

		expect(firstEntry).not.toHaveClass("expanded");
		expect(firstPreview).not.toHaveClass("log-preview--expanded");
		expect(expandBtn).toHaveAttribute("aria-expanded", "false");
	});

	it("should prevent event propagation when clicking expand button so onSelect is not called", () => {
		const { onSelect, container } = renderLogList();

		const firstEntry = container.querySelectorAll(".log-entry")[0];
		const expandBtn = firstEntry.querySelector(".expand-btn");

		fireEvent.click(expandBtn);

		expect(onSelect).not.toHaveBeenCalled();
	});
});
