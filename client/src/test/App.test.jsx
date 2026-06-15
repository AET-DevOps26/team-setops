import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";
import { PrivacyModeProvider } from "../context/PrivacyModeContext";

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
});
