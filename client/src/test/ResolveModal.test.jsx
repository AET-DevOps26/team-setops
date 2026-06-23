import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ResolveModal from "../components/ResolveModal";

const mockResult = {
	problem_type: "Database Connection Error",
	severity: "CRITICAL",
	confidence: "high",
	summary: "PostgreSQL connection refused",
};

function renderModal(props = {}) {
	const defaultProps = {
		result: mockResult,
		onResolve: vi.fn(() => Promise.resolve()),
		onClose: vi.fn(),
		...props,
	};
	return {
		...render(React.createElement(ResolveModal, defaultProps)),
		...defaultProps,
	};
}

describe("ResolveModal", () => {
	it("should render the dialog with issue context", () => {
		renderModal();
		expect(
			screen.getByRole("dialog", { name: /resolve issue/i }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Database Connection Error — CRITICAL"),
		).toBeInTheDocument();
	});

	it("should render both resolution options", () => {
		renderModal();
		// Option A
		expect(
			screen.getByRole("button", { name: /mark as resolved/i }),
		).toBeInTheDocument();
		// Option B
		expect(screen.getByLabelText(/your solution/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /submit solution/i }),
		).toBeInTheDocument();
	});

	it("should call onResolve with 'simple' when Simple Close is clicked", async () => {
		const { onResolve } = renderModal();

		fireEvent.click(
			screen.getByRole("button", { name: /mark as resolved/i }),
		);

		await vi.waitFor(() => expect(onResolve).toHaveBeenCalledTimes(1));
		expect(onResolve).toHaveBeenCalledWith("simple");
	});

	it("should disable RAG submit button when textarea is empty", () => {
		renderModal();
		const ragBtn = screen.getByRole("button", {
			name: /submit solution/i,
		});
		expect(ragBtn).toBeDisabled();
	});

	it("should enable RAG submit button when textarea has content", () => {
		renderModal();
		fireEvent.change(screen.getByLabelText(/your solution/i), {
			target: { value: "Restart the database container" },
		});
		const ragBtn = screen.getByRole("button", {
			name: /submit solution/i,
		});
		expect(ragBtn).not.toBeDisabled();
	});

	it("should call onResolve with 'rag' and solution text when RAG form is submitted", async () => {
		const { onResolve } = renderModal();

		fireEvent.change(screen.getByLabelText(/your solution/i), {
			target: { value: "Fixed by updating connection string" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /submit solution/i }),
		);

		await vi.waitFor(() => expect(onResolve).toHaveBeenCalledTimes(1));
		expect(onResolve).toHaveBeenCalledWith(
			"rag",
			"Fixed by updating connection string",
		);
	});

	it("should call onClose when close button is clicked", () => {
		const { onClose } = renderModal();
		fireEvent.click(screen.getByRole("button", { name: /close/i }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("should call onClose when backdrop is clicked", () => {
		const { onClose } = renderModal();
		fireEvent.click(
			screen.getByRole("dialog", { name: /resolve issue/i }).parentElement,
		);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
