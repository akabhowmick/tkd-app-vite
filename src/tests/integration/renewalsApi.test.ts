import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createRenewalPeriod,
  createRenewalPayment,
  updateRenewalPeriod,
  updateRenewalPayment,
  deleteRenewalPeriod,
  deleteRenewalPayment,
  markInstallmentPaid,
  resolveAsQuit,
} from "../../api/StudentRenewalsRequests/studentRenewalsRequests";
import { supabase } from "../../api/supabase";

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

const fakePeriodRow = {
  period_id: "per1",
  student_id: "s1",
  school_id: "sc1",
  duration_months: 3,
  expiration_date: "2025-12-01",
  status: "active",
  number_of_classes: 2,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const fakePayment = {
  payment_id: "pay1",
  period_id: "per1",
  student_id: "s1",
  installment_number: 1,
  amount_due: 100,
  amount_paid: 0,
  payment_date: null,
  paid_to: "",
  created_at: "2025-01-01T00:00:00Z",
};

describe("createRenewalPeriod", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a new period with empty payments and zero totals", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakePeriodRow, error: null }),
    });
    const result = await createRenewalPeriod({
      student_id: "s1",
      school_id: "sc1",
      duration_months: 3,
      expiration_date: "2025-12-01",
      number_of_classes: 2,
    });
    expect(result.period_id).toBe("per1");
    expect(result.payments).toEqual([]);
    expect(result.total_due).toBe(0);
    expect(result.total_paid).toBe(0);
    expect(result.balance).toBe(0);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(
      createRenewalPeriod({ student_id: "s1", school_id: "sc1", duration_months: 3, expiration_date: "2025-12-01", number_of_classes: 2 }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("createRenewalPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the created payment", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: fakePayment, error: null }),
    });
    const result = await createRenewalPayment({
      period_id: "per1",
      student_id: "s1",
      installment_number: 1,
      amount_due: 100,
      amount_paid: 0,
    });
    expect(result).toEqual(fakePayment);
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
    });
    await expect(
      createRenewalPayment({ period_id: "per1", student_id: "s1", installment_number: 1, amount_due: 100, amount_paid: 0 }),
    ).rejects.toThrow("Insert failed");
  });
});

describe("updateRenewalPeriod", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates without error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(updateRenewalPeriod("per1", { status: "renewed" })).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("renewal_periods");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Update failed") }),
    });
    await expect(updateRenewalPeriod("per1", { status: "quit" })).rejects.toThrow("Update failed");
  });
});

describe("updateRenewalPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates without error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(
      updateRenewalPayment("pay1", { amount_paid: 100, paid_to: "Admin", payment_date: "2025-08-01" }),
    ).resolves.toBeUndefined();
  });
});

describe("deleteRenewalPeriod", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteRenewalPeriod("per1")).resolves.toBeUndefined();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Delete failed") }),
    });
    await expect(deleteRenewalPeriod("per1")).rejects.toThrow("Delete failed");
  });
});

describe("deleteRenewalPayment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes without error", async () => {
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(deleteRenewalPayment("pay1")).resolves.toBeUndefined();
  });
});

describe("markInstallmentPaid", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates the payment record", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(
      markInstallmentPaid("pay1", { payment_date: "2025-08-01", amount_paid: 100, paid_to: "Admin" }),
    ).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("renewal_payments");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: new Error("Update failed") }),
    });
    await expect(
      markInstallmentPaid("pay1", { payment_date: null, amount_paid: 0, paid_to: "" }),
    ).rejects.toThrow("Update failed");
  });
});

describe("resolveAsQuit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls updateRenewalPeriod with status=quit", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await expect(resolveAsQuit("per1", "Student moved away")).resolves.toBeUndefined();
    const updateArg = (mockFrom.mock.results[0].value.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.status).toBe("quit");
    expect(updateArg.resolution_notes).toBe("Student moved away");
  });

  it("uses default note when none provided", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    await resolveAsQuit("per1");
    const updateArg = (mockFrom.mock.results[0].value.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.resolution_notes).toBe("Student quit");
  });
});
