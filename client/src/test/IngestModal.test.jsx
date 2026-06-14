import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import IngestModal from "../components/IngestModal";

function renderModal(props = {}) {
	const defaultProps = {
		onSubmit: vi.fn(() => Promise.resolve()),
		onClose: vi.fn(),
		...props,
	};
	return { ...render(React.createElement(IngestModal, defaultProps)), ...defaultProps };
}

describe("IngestModal", () => {
	it("should render all form fields", () => {
		renderModal();
		expect(screen.getByLabelText(/service name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/log content/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/severity/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/log type/i)).toBeInTheDocument();
	});

	it("should disable submit when required fields are empty", () => {
		renderModal();
		const submitBtn = screen.getByRole("button", { name: /ingest log/i });
		expect(submitBtn).toBeDisabled();
	});

	it("should enable submit when required fields are filled", () => {
		renderModal();
		fireEvent.change(screen.getByLabelText(/service name/i), {
			target: { value: "api-gateway" },
		});
		fireEvent.change(screen.getByLabelText(/log content/i), {
			target: { value: "NullPointerException at line 42" },
		});
		const submitBtn = screen.getByRole("button", { name: /ingest log/i });
		expect(submitBtn).not.toBeDisabled();
	});

	it("should call onSubmit with correct payload shape", async () => {
		const { onSubmit } = renderModal();

		fireEvent.change(screen.getByLabelText(/service name/i), {
			target: { value: "auth-service" },
		});
		fireEvent.change(screen.getByLabelText(/log content/i), {
			target: { value: "Connection refused" },
		});
		fireEvent.change(screen.getByLabelText(/severity/i), {
			target: { value: "CRITICAL" },
		});

		fireEvent.click(screen.getByRole("button", { name: /ingest log/i }));

		// Wait for the async onSubmit to be called
		await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

		const payload = onSubmit.mock.calls[0][0];
		expect(payload.serviceName).toBe("auth-service");
		expect(payload.logContent).toBe("Connection refused");
		expect(payload.severity).toBe("CRITICAL");
		expect(payload.type).toBe("DEPLOYMENT_LOG");
		expect(payload.timestamp).toBeDefined();
	});

	it("should call onClose when Cancel is clicked", () => {
		const { onClose } = renderModal();
		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("should call onClose when backdrop is clicked", () => {
		const { onClose } = renderModal();
		fireEvent.click(screen.getByRole("dialog").parentElement);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
