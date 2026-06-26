import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { PrivacyModeProvider } from "../context/PrivacyModeContext";

// Mock openapi-fetch so the client's GET/POST/PATCH never hit real endpoints
vi.mock("openapi-fetch", () => ({
	default: () => ({
		GET: vi.fn().mockResolvedValue({
			data: [],
			response: { ok: true, status: 200 },
		}),
		POST: vi.fn().mockResolvedValue({
			data: {},
			response: { ok: true, status: 200 },
		}),
		PATCH: vi.fn().mockResolvedValue({
			data: {},
			response: { ok: true, status: 200 },
		}),
	}),
}));

describe("App", () => {
	it("should render without crashing", () => {
		render(
			React.createElement(
				PrivacyModeProvider,
				null,
				React.createElement(App),
			),
		);
		expect(
			screen.getByRole("heading", { name: /devpulse/i }),
		).toBeInTheDocument();
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
