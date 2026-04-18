import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SchoolForm } from "../../components/AccountDashboards/AdminFeatures/SchoolManagement/SchoolForm";

const mockOnSubmit = vi.fn();

describe("SchoolForm — rendering", () => {
  it('shows "Create School" heading when no existing school', () => {
    render(<SchoolForm onSubmit={mockOnSubmit} />);
    // h2 and submit button both say "Create School" — use role queries to disambiguate
    expect(screen.getByRole("heading", { name: /create school/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create school/i })).toBeInTheDocument();
  });

  it('shows "Edit School" heading when existing school is provided', () => {
    render(
      <SchoolForm
        existingSchool={{ id: "sc1", name: "Tiger Dojo", address: "123 Main St", created_at: "2025-01-01" }}
        onSubmit={mockOnSubmit}
      />,
    );
    expect(screen.getByText(/edit school/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update school/i })).toBeInTheDocument();
  });

  it("pre-fills fields when editing an existing school", () => {
    render(
      <SchoolForm
        existingSchool={{ id: "sc1", name: "Tiger Dojo", address: "123 Main St", created_at: "2025-01-01" }}
        onSubmit={mockOnSubmit}
      />,
    );
    expect(screen.getByDisplayValue("Tiger Dojo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
  });
});

describe("SchoolForm — validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows error when name is empty on submit", async () => {
    const { container } = render(<SchoolForm onSubmit={mockOnSubmit} />);
    // Use fireEvent.submit on the form directly to bypass jsdom native required-field blocking
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "123 Main St" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/name and address are required/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("shows error when address is empty on submit", async () => {
    const { container } = render(<SchoolForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText(/school name/i), { target: { value: "Tiger Dojo" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/name and address are required/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});

describe("SchoolForm — submission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls onSubmit with form data when valid", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    const { container } = render(<SchoolForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText(/school name/i), { target: { value: "Tiger Dojo" } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "123 Main St" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Tiger Dojo", address: "123 Main St" }),
      );
    });
  });

  it("shows submission error when onSubmit throws", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Server error"));
    const { container } = render(<SchoolForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText(/school name/i), { target: { value: "Tiger Dojo" } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "123 Main St" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    let resolve: () => void;
    mockOnSubmit.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    const { container } = render(<SchoolForm onSubmit={mockOnSubmit} />);
    fireEvent.change(screen.getByLabelText(/school name/i), { target: { value: "Tiger Dojo" } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "123 Main St" } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });
    resolve!();
  });
});
