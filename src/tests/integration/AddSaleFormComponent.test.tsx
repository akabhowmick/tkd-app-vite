import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddSaleForm } from "../../components/MainDashboard/Sales/AddSaleForm";

const mockAddSale = vi.fn();
const mockValidateForm = vi.fn();
const mockOnCancel = vi.fn();
const mockOnSaved = vi.fn();

vi.mock("../../context/SalesContext", () => ({
  useSales: () => ({
    addSale: mockAddSale,
    validateForm: mockValidateForm,
  }),
}));

vi.mock("../../context/SchoolContext", () => ({
  useSchool: () => ({
    students: [
      { id: "s1", name: "Alice" },
      { id: "s2", name: "Bob" },
    ],
    schoolId: "sc1",
  }),
}));

const renderForm = () =>
  render(<AddSaleForm onCancel={mockOnCancel} onSaved={mockOnSaved} />);

describe("AddSaleForm — rendering", () => {
  it("renders all required fields", () => {
    renderForm();
    // AddSaleForm labels don't use htmlFor, so query by placeholder/role/text
    expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    expect(screen.getByText(/payment type \*/i)).toBeInTheDocument();
    expect(screen.getByText(/category \*/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. admin/i)).toBeInTheDocument();
  });

  it("renders student options from SchoolContext", () => {
    renderForm();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});

describe("AddSaleForm — validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows validation errors when form is invalid", async () => {
    mockValidateForm.mockReturnValue(["Amount is required", "Payment type is required"]);
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /add sale/i }));
    await waitFor(() => {
      expect(screen.getByText("Amount is required")).toBeInTheDocument();
      expect(screen.getByText("Payment type is required")).toBeInTheDocument();
    });
    expect(mockAddSale).not.toHaveBeenCalled();
  });

  it("does not call addSale when validation errors exist", async () => {
    mockValidateForm.mockReturnValue(["Amount is required"]);
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /add sale/i }));
    await waitFor(() => expect(mockAddSale).not.toHaveBeenCalled());
  });
});

describe("AddSaleForm — submission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls addSale and onSaved on valid submit", async () => {
    mockValidateForm.mockReturnValue([]);
    mockAddSale.mockResolvedValue(undefined);
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /add sale/i }));
    await waitFor(() => {
      expect(mockAddSale).toHaveBeenCalled();
      expect(mockOnSaved).toHaveBeenCalled();
    });
  });

  it("shows error message when addSale throws", async () => {
    mockValidateForm.mockReturnValue([]);
    mockAddSale.mockRejectedValue(new Error("DB error"));
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /add sale/i }));
    await waitFor(() => {
      expect(screen.getByText("DB error")).toBeInTheDocument();
    });
  });
});

describe("AddSaleForm — cancel", () => {
  it("calls onCancel when cancel button is clicked", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
