import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InsightsPanel from "../components/InsightsPanel";

const mockResult = {
	confidence: "high",
	problem_type: "Database Connection Error",
	severity: "CRITICAL",
	summary: "The application failed to connect to the PostgreSQL database on startup.",
	problem_summary: "PostgreSQL database port 5432 is not accessible, probably because the container is not running or network partition exists.",
	evidence: [
		"Connection refused to localhost:5432",
		"HikariPool-1 - Connection not available"
	],
	troubleshoot: [
		"Check if PostgreSQL container is running",
		"Verify the connection URL in application.properties"
	],
	solutions: [
		"Start the database container using docker compose up postgres",
		"Correct the datasource credentials"
	],
	sources: [
		{ title: "Spring Boot DB configuration guide", snippet: "Ensure spring.datasource.url is pointing to the correct host" },
		{ id: "StackOverflow #12345", title: "Connection Refused guide" }
	]
};

describe("InsightsPanel", () => {
	it("should render loading state when loading is true", () => {
		render(React.createElement(InsightsPanel, { loading: true, result: null }));
		expect(screen.getByText("Analyzing…")).toBeInTheDocument();
		expect(screen.getByText("Running AI analysis on selected log")).toBeInTheDocument();
	});

	it("should render null when result is not provided and not loading", () => {
		const { container } = render(React.createElement(InsightsPanel, { loading: false, result: null }));
		expect(container.firstChild).toBeNull();
	});

	it("should render all panel sections when result is provided", () => {
		render(React.createElement(InsightsPanel, { loading: false, result: mockResult }));

		// Header checks
		expect(screen.getByText("Database Connection Error")).toBeInTheDocument();
		expect(screen.getByText("CRITICAL")).toBeInTheDocument();
		expect(screen.getByText("high confidence")).toBeInTheDocument();

		// Sections checks
		expect(screen.getByText("Summary")).toBeInTheDocument();
		expect(screen.getByText(mockResult.summary)).toBeInTheDocument();

		expect(screen.getByText("Root Cause")).toBeInTheDocument();
		expect(screen.getByText(mockResult.problem_summary)).toBeInTheDocument();

		expect(screen.getByText("Evidence")).toBeInTheDocument();
		expect(screen.getByText("Connection refused to localhost:5432")).toBeInTheDocument();
		expect(screen.getByText("HikariPool-1 - Connection not available")).toBeInTheDocument();

		expect(screen.getByText("Troubleshooting Steps")).toBeInTheDocument();
		expect(screen.getByText("Check if PostgreSQL container is running")).toBeInTheDocument();

		expect(screen.getByText("Proposed Solutions")).toBeInTheDocument();
		expect(screen.getByText("Start the database container using docker compose up postgres")).toBeInTheDocument();

		expect(screen.getByText("Sources")).toBeInTheDocument();
		expect(screen.getByText("Spring Boot DB configuration guide")).toBeInTheDocument();
		expect(screen.getByText("Ensure spring.datasource.url is pointing to the correct host")).toBeInTheDocument();
		expect(screen.getByText("Connection Refused guide")).toBeInTheDocument();
	});

	it("should only render available sections if some fields are missing in the result", () => {
		const minimalResult = {
			confidence: "medium",
			problem_type: "Network Timeout",
			severity: "WARNING",
			summary: "Brief timeout error"
		};

		render(React.createElement(InsightsPanel, { loading: false, result: minimalResult }));

		expect(screen.getByText("Network Timeout")).toBeInTheDocument();
		expect(screen.getByText("WARNING")).toBeInTheDocument();
		expect(screen.getByText("medium confidence")).toBeInTheDocument();

		expect(screen.getByText("Summary")).toBeInTheDocument();
		expect(screen.getByText("Brief timeout error")).toBeInTheDocument();

		// These sections should not exist
		expect(screen.queryByText("Root Cause")).not.toBeInTheDocument();
		expect(screen.queryByText("Evidence")).not.toBeInTheDocument();
		expect(screen.queryByText("Troubleshooting Steps")).not.toBeInTheDocument();
		expect(screen.queryByText("Proposed Solutions")).not.toBeInTheDocument();
		expect(screen.queryByText("Sources")).not.toBeInTheDocument();
	});
});
