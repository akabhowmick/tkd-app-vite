import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  getCategoryLabel,
  validateSaleForm,
} from "../../utils/SaleHelperFunc";
import { SaleFormData } from "../../types/sales";

const baseForm = (): SaleFormData => ({
  amount: "100",
  payment_type: "cash",
  payment_date: "2025-08-20",
  category: "tuition",
  notes: "",
  processed_by: "Admin",
});

describe("formatCurrency", () => {
  it("formats a whole dollar amount", () => {
    expect(formatCurrency(50)).toBe("$50.00");
  });

  it("formats cents correctly", () => {
    expect(formatCurrency(9.99)).toBe("$9.99");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats thousands with comma separator", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(1.005)).toMatch(/^\$1\.0[01]$/);
  });
});

describe("getCategoryLabel", () => {
  it("returns Tuition for tuition", () => {
    expect(getCategoryLabel("tuition")).toBe("Tuition");
  });

  it("returns Test Fee for test_fee", () => {
    expect(getCategoryLabel("test_fee")).toBe("Test Fee");
  });

  it("returns Other for other", () => {
    expect(getCategoryLabel("other")).toBe("Other");
  });

  it("falls back to the raw value for unknown category", () => {
    // @ts-expect-error intentionally unknown category
    expect(getCategoryLabel("unknown_cat")).toBe("unknown_cat");
  });
});

describe("validateSaleForm", () => {
  it("returns no errors for a valid form", () => {
    expect(validateSaleForm(baseForm())).toHaveLength(0);
  });

  it("returns error when amount is empty", () => {
    expect(validateSaleForm({ ...baseForm(), amount: "" })).toContain(
      "Amount must be a positive number",
    );
  });

  it("returns error when amount is zero", () => {
    expect(validateSaleForm({ ...baseForm(), amount: "0" })).toContain(
      "Amount must be a positive number",
    );
  });

  it("returns error when amount is negative", () => {
    expect(validateSaleForm({ ...baseForm(), amount: "-10" })).toContain(
      "Amount must be a positive number",
    );
  });

  it("returns error when payment_type is empty", () => {
    expect(validateSaleForm({ ...baseForm(), payment_type: "" })).toContain(
      "Payment type is required",
    );
  });

  it("returns error when payment_date is empty", () => {
    expect(validateSaleForm({ ...baseForm(), payment_date: "" })).toContain(
      "Payment date is required",
    );
  });

  it("returns error when category is empty", () => {
    expect(validateSaleForm({ ...baseForm(), category: "" })).toContain(
      "Category is required",
    );
  });

  it('returns error when category is "other" and notes are empty', () => {
    expect(
      validateSaleForm({ ...baseForm(), category: "other", notes: "" }),
    ).toContain('Notes are required when category is "Other"');
  });

  it('passes when category is "other" and notes are provided', () => {
    const errors = validateSaleForm({
      ...baseForm(),
      category: "other",
      notes: "Special event",
    });
    expect(errors).not.toContain('Notes are required when category is "Other"');
  });

  it("returns multiple errors at once", () => {
    const errors = validateSaleForm({ ...baseForm(), amount: "", payment_type: "", category: "" });
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
