import { render, screen } from "@testing-library/react";
import App from "../App";
import React from "react";

describe("App", () => {
	it("should render without crashing", () => {
		render(<App />);
		expect(
			screen.getByRole("heading", { name: /get started/i }),
		).toBeInTheDocument();
	});
});
