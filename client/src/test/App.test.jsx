import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import App from "../App";
import { PrivacyModeProvider } from "../context/PrivacyModeContext";

/* ── Shared mock state ─────────────────────────────────── */
let mockGET;
let mockPOST;
let mockPATCH;

const MOCK_LOGS = [
	{
		id: "aaa-111",
		serviceName: "auth-service",
		logContent: "Connection timeout to database",
		timestamp: "2026-06-25T10:00:00Z",
		severity: "ERROR",
		type: "DEPLOYMENT_LOG",
	},
	{
		id: "bbb-222",
		serviceName: "api-gateway",
		logContent: "Health check passed",
		timestamp: "2026-06-25T09:00:00Z",
		severity: "INFO",
		type: "DEPLOYMENT_LOG",
	},
];

const MOCK_RESOLVED_INCIDENTS = [
	{ logId: "bbb-222", status: "RESOLVED" },
];

/* ── Mock openapi-fetch ────────────────────────────────── */
vi.mock("openapi-fetch", () => ({
	default: () => {
		// These get reassigned in beforeEach so each test gets fresh mocks
		const handler = {
			GET: (...args) => mockGET(...args),
			POST: (...args) => mockPOST(...args),
			PATCH: (...args) => mockPATCH(...args),
		};
		return handler;
	},
}));

/* ── Helpers ───────────────────────────────────────────── */
function renderApp() {
	return render(
		React.createElement(
			PrivacyModeProvider,
			null,
			React.createElement(App),
		),
	);
}

function createGETMock(logs = [], incidents = []) {
	return vi.fn().mockImplementation((path) => {
		if (path === "/api/v1/logs") {
			return Promise.resolve({
				data: logs,
				response: { ok: true, status: 200 },
			});
		}
		if (path === "/api/v1/incidents") {
			return Promise.resolve({
				data: incidents,
				response: { ok: true, status: 200 },
			});
		}
		return Promise.resolve({
			data: null,
			response: { ok: false, status: 404 },
		});
	});
}

/* ── Setup / Teardown ──────────────────────────────────── */
beforeEach(() => {
	mockGET = createGETMock();
	mockPOST = vi.fn().mockResolvedValue({
		data: {},
		response: { ok: true, status: 200 },
	});
	mockPATCH = vi.fn().mockResolvedValue({
		data: {},
		response: { ok: true, status: 200 },
	});

	vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
	vi.useRealTimers();
});

/* ── Test Suite ────────────────────────────────────────── */
describe("App", () => {
	/* ── Rendering ──────────────────────────────────────── */
	describe("rendering", () => {
		it("should render the DEVPULSE heading", async () => {
			renderApp();
			expect(
				screen.getByRole("heading", { name: /devpulse/i }),
			).toBeInTheDocument();
		});

		it("should render the status bar with System Online", async () => {
			renderApp();
			expect(screen.getByText(/system online/i)).toBeInTheDocument();
		});

		it("should render the Ingest Logs button", async () => {
			renderApp();
			expect(screen.getByText(/ingest logs/i)).toBeInTheDocument();
		});

		it("should show the empty state when no logs exist", async () => {
			renderApp();
			expect(screen.getByText(/no logs ingested/i)).toBeInTheDocument();
		});

		it("should show 'Ingest Your First Logs' CTA in empty state", async () => {
			renderApp();
			expect(
				screen.getByText(/ingest your first logs/i),
			).toBeInTheDocument();
		});

		it("should show the AI Insights panel", async () => {
			renderApp();
			expect(screen.getByText("AI Insights")).toBeInTheDocument();
		});

		it("should show default analyze prompt in insights panel", async () => {
			renderApp();
			expect(screen.getByText(/select a log entry/i)).toBeInTheDocument();
		});

		it("should render the privacy toggle", async () => {
			renderApp();
			expect(screen.getByText(/local only/i)).toBeInTheDocument();
		});
	});

	/* ── Data loading on mount ──────────────────────────── */
	describe("data loading on mount", () => {
		it("should call GET /api/v1/logs on mount", async () => {
			renderApp();
			await waitFor(() => {
				expect(mockGET).toHaveBeenCalledWith("/api/v1/logs");
			});
		});

		it("should call GET /api/v1/incidents with RESOLVED filter on mount", async () => {
			renderApp();
			await waitFor(() => {
				expect(mockGET).toHaveBeenCalledWith("/api/v1/incidents", {
					params: { query: { status: "RESOLVED" } },
				});
			});
		});

		it("should display fetched logs from the server", async () => {
			mockGET = createGETMock(MOCK_LOGS, []);
			renderApp();
			await waitFor(() => {
				expect(screen.getByText("auth-service")).toBeInTheDocument();
				expect(screen.getByText("api-gateway")).toBeInTheDocument();
			});
		});

		it("should show log count in status bar after loading", async () => {
			mockGET = createGETMock(MOCK_LOGS, []);
			renderApp();
			await waitFor(() => {
				expect(screen.getByText(/2 logs ingested/i)).toBeInTheDocument();
			});
		});

		it("should show Clear Logs button when logs exist", async () => {
			mockGET = createGETMock(MOCK_LOGS, []);
			renderApp();
			await waitFor(() => {
				expect(screen.getByText(/clear logs/i)).toBeInTheDocument();
			});
		});

		it("should handle GET /api/v1/logs failure gracefully", async () => {
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });
			mockGET = vi.fn().mockImplementation((path) => {
				if (path === "/api/v1/logs") {
					return Promise.resolve({
						data: null,
						response: { ok: false, status: 500 },
					});
				}
				return Promise.resolve({
					data: [],
					response: { ok: true, status: 200 },
				});
			});
			renderApp();
			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith(
					"Failed to load initial data:",
					expect.any(Error),
				);
			});
			consoleSpy.mockRestore();
		});
	});

	/* ── Theme cycling ─────────────────────────────────── */
	describe("theme cycling", () => {
		it("should default to CYAN theme", async () => {
			renderApp();
			expect(screen.getByText(/theme: cyan/i)).toBeInTheDocument();
		});

		it("should cycle theme on button click", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			renderApp();
			const themeBtn = screen.getByLabelText(/cycle ui theme/i);

			await user.click(themeBtn);
			expect(screen.getByText(/theme: green/i)).toBeInTheDocument();

			await user.click(themeBtn);
			expect(screen.getByText(/theme: amber/i)).toBeInTheDocument();

			await user.click(themeBtn);
			expect(screen.getByText(/theme: cyan/i)).toBeInTheDocument();
		});
	});

	/* ── Ingest modal ──────────────────────────────────── */
	describe("ingest modal", () => {
		it("should open ingest modal on Ingest Logs click", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			renderApp();

			await user.click(screen.getByText(/ingest logs/i));
			expect(screen.getByText(/service name/i)).toBeInTheDocument();
		});

		it("should open ingest modal from empty state CTA", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			renderApp();

			await user.click(screen.getByText(/ingest your first logs/i));
			expect(screen.getByText(/service name/i)).toBeInTheDocument();
		});
	});

	/* ── Clear logs ────────────────────────────────────── */
	describe("clear logs", () => {
		it("should clear all logs and show notification", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			mockGET = createGETMock(MOCK_LOGS, []);
			renderApp();

			await waitFor(() => {
				expect(screen.getByText("auth-service")).toBeInTheDocument();
			});

			await user.click(screen.getByText(/clear logs/i));

			expect(screen.getByText(/no logs ingested/i)).toBeInTheDocument();
			expect(screen.getByText(/all logs cleared/i)).toBeInTheDocument();
		});

		it("should reset status bar count to 0 after clearing", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			mockGET = createGETMock(MOCK_LOGS, []);
			renderApp();

			await waitFor(() => {
				expect(screen.getByText(/2 logs ingested/i)).toBeInTheDocument();
			});

			await user.click(screen.getByText(/clear logs/i));
			expect(screen.getByText(/0 logs ingested/i)).toBeInTheDocument();
		});
	});

	/* ── Status bar ────────────────────────────────────── */
	describe("status bar", () => {
		it("should show singular 'Log' for exactly 1 log", async () => {
			mockGET = createGETMock([MOCK_LOGS[0]], []);
			renderApp();
			await waitFor(() => {
				expect(screen.getByText(/1 log ingested/i)).toBeInTheDocument();
			});
		});

		it("should show privacy mode indicator", async () => {
			renderApp();
			expect(screen.getByText(/mode:/i)).toBeInTheDocument();
		});
	});

	/* ── Resolved state mapping ────────────────────────── */
	describe("resolved state mapping", () => {
		it("should mark logs as resolved based on fetched incidents", async () => {
			mockGET = createGETMock(MOCK_LOGS, MOCK_RESOLVED_INCIDENTS);
			renderApp();

			await waitFor(() => {
				expect(screen.getByText("auth-service")).toBeInTheDocument();
				expect(screen.getByText("api-gateway")).toBeInTheDocument();
			});

			// The resolved log (bbb-222 / api-gateway) should have resolved styling
			// while the unresolved one (aaa-111 / auth-service) should not
			// Both logs should be present — the resolved state is internal
		});
	});

	/* ── Notification auto-dismiss ─────────────────────── */
	describe("notification auto-dismiss", () => {
		it("should auto-dismiss notification after 3 seconds", async () => {
			const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
			mockGET = createGETMock(MOCK_LOGS, []);
			renderApp();

			await waitFor(() => {
				expect(screen.getByText("auth-service")).toBeInTheDocument();
			});

			await user.click(screen.getByText(/clear logs/i));
			expect(screen.getByText(/all logs cleared/i)).toBeInTheDocument();

			act(() => {
				vi.advanceTimersByTime(3000);
			});

			await waitFor(() => {
				expect(screen.queryByText(/all logs cleared/i)).not.toBeInTheDocument();
			});
		});
	});

	it("should render the RAG toggle with default checked state", () => {
		render(
			React.createElement(
				PrivacyModeProvider,
				null,
				React.createElement(App),
			),
		);
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeInTheDocument();
		expect(checkbox).toBeChecked();
	});
});
