import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  deriveUiStatus,
  groupPeriods,
  enrichPeriod,
  isInstallmentOverdue,
  getNextUnpaidInstallment,
} from "../../context/StudentRenewalContext";
import { RenewalPeriod, RenewalPayment } from "../../types/student_renewal";
import { SchoolProgram } from "../../types/programs";

// All dates use "T12:00:00" (local noon, no Z) to avoid UTC-midnight parsing
// issues when mixed with setHours(0,0,0,0) in non-UTC timezones.

const PINNED = new Date(2025, 7, 20, 12); // Aug 20, 2025, LOCAL noon

const makePeriod = (overrides: Partial<RenewalPeriod> = {}): RenewalPeriod => ({
  period_id: "p1",
  student_id: "s1",
  school_id: "sc1",
  duration_months: 3,
  expiration_date: "2025-09-25T12:00:00", // 36 days out — clearly active
  number_of_classes: 2,
  status: "active",
  program_id: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  payments: [],
  total_due: 100,
  total_paid: 0,
  balance: 100,
  ...overrides,
});

const makePayment = (overrides: Partial<RenewalPayment> = {}): RenewalPayment => ({
  payment_id: "pay1",
  period_id: "p1",
  student_id: "s1",
  due_date: "2025-08-10T12:00:00", // 10 days before PINNED — past due
  payment_date: null,
  amount_due: 100,
  amount_paid: 0,
  installment_number: 1,
  paid_to: "admin",
  created_at: "2025-01-01T00:00:00Z",
  ...overrides,
});

const makeProgram = (overrides: Partial<SchoolProgram> = {}): SchoolProgram => ({
  program_id: "prog1",
  school_id: "sc1",
  name: "Test Program",
  program_type: "time_based",
  description: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  ...overrides,
});

describe("isInstallmentOverdue", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  it("returns false when payment_date is set (already paid)", () => {
    expect(isInstallmentOverdue(makePayment({ payment_date: "2025-08-05T12:00:00" }))).toBe(false);
  });

  it("returns true when payment_date is null and due_date is past", () => {
    // due_date = Aug 10, PINNED = Aug 20 → overdue
    expect(isInstallmentOverdue(makePayment({ payment_date: null, due_date: "2025-08-10T12:00:00" }))).toBe(true);
  });

  it("returns false when payment_date is null and due_date is today", () => {
    expect(isInstallmentOverdue(makePayment({ payment_date: null, due_date: "2025-08-20T12:00:00" }))).toBe(false);
  });

  it("returns false when payment_date is null and due_date is in the future", () => {
    expect(isInstallmentOverdue(makePayment({ payment_date: null, due_date: "2025-08-30T12:00:00" }))).toBe(false);
  });

  it("returns false when due_date is null", () => {
    expect(isInstallmentOverdue(makePayment({ payment_date: null, due_date: null }))).toBe(false);
  });
});

describe("getNextUnpaidInstallment", () => {
  it("returns null for an empty payments array", () => {
    expect(getNextUnpaidInstallment([])).toBeNull();
  });

  it("returns null when all payments are paid", () => {
    const paid = [
      makePayment({ payment_id: "a", payment_date: "2025-08-01", amount_paid: 100 }),
      makePayment({ payment_id: "b", payment_date: "2025-08-05", amount_paid: 100 }),
    ];
    expect(getNextUnpaidInstallment(paid)).toBeNull();
  });

  it("returns the first unpaid installment", () => {
    const payments = [
      makePayment({ payment_id: "a", payment_date: "2025-08-01", amount_paid: 100 }), // paid
      makePayment({ payment_id: "b", payment_date: null, amount_paid: 0 }),             // unpaid
      makePayment({ payment_id: "c", payment_date: null, amount_paid: 0 }),             // unpaid
    ];
    expect(getNextUnpaidInstallment(payments)?.payment_id).toBe("b");
  });

  it("returns null when amount_paid equals amount_due even with no payment_date", () => {
    const payments = [makePayment({ payment_date: null, amount_paid: 100, amount_due: 100 })];
    expect(getNextUnpaidInstallment(payments)).toBeNull();
  });
});

describe("enrichPeriod", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  it("adds ui_status that matches deriveUiStatus", () => {
    const period = makePeriod({ expiration_date: "2025-09-25T12:00:00" });
    const enriched = enrichPeriod(period);
    expect(enriched.ui_status).toBe(deriveUiStatus(period));
  });

  it("adds a numeric days_until_expiration", () => {
    const enriched = enrichPeriod(makePeriod({ expiration_date: "2025-09-25T12:00:00" }));
    expect(typeof enriched.days_until_expiration).toBe("number");
  });

  it("sets days_until_expiration to null when no expiration_date", () => {
    const enriched = enrichPeriod(makePeriod({ expiration_date: null }));
    expect(enriched.days_until_expiration).toBeNull();
  });

  it("sets is_milestone false for time-based programs", () => {
    const program = makeProgram({ program_type: "time_based" });
    const enriched = enrichPeriod(makePeriod({ program_id: "prog1" }), program);
    expect(enriched.is_milestone).toBe(false);
  });

  it("sets is_milestone true for milestone_based programs", () => {
    const program = makeProgram({ program_type: "milestone_based" });
    const enriched = enrichPeriod(makePeriod({ program_id: "prog1" }), program);
    expect(enriched.is_milestone).toBe(true);
  });

  it("wires next_unpaid_installment from payments", () => {
    const payment = makePayment({ payment_date: null, amount_paid: 0 });
    const period = makePeriod({ payments: [payment] });
    const enriched = enrichPeriod(period);
    expect(enriched.next_unpaid_installment?.payment_id).toBe(payment.payment_id);
  });

  it("sets next_unpaid_installment null when all installments are paid", () => {
    const payment = makePayment({ payment_date: "2025-08-01", amount_paid: 100 });
    const enriched = enrichPeriod(makePeriod({ payments: [payment] }));
    expect(enriched.next_unpaid_installment).toBeNull();
  });

  it("adds a non-empty status_message", () => {
    const enriched = enrichPeriod(makePeriod());
    expect(typeof enriched.status_message).toBe("string");
    expect(enriched.status_message.length).toBeGreaterThan(0);
  });
});

describe("deriveUiStatus", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  it("returns paid when balance <= 0 and total_due > 0", () => {
    expect(deriveUiStatus(makePeriod({ balance: 0, total_due: 100, total_paid: 100 }))).toBe("paid");
  });

  it("returns renewed for status=renewed", () => {
    expect(deriveUiStatus(makePeriod({ status: "renewed" }))).toBe("renewed");
  });

  it("returns quit for status=quit", () => {
    expect(deriveUiStatus(makePeriod({ status: "quit" }))).toBe("quit");
  });

  it("returns expired for status=expired in DB", () => {
    expect(deriveUiStatus(makePeriod({ status: "expired" }))).toBe("expired");
  });

  it("returns active for expiration 36 days out", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-09-25T12:00:00" }))).toBe("active");
  });

  it("returns expiring_soon when expiring in 10 days", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-08-30T12:00:00" }))).toBe("expiring_soon");
  });

  it("returns grace_period when 3 days overdue", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-08-17T12:00:00" }))).toBe("grace_period");
  });

  it("returns expired when 10 days overdue", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-08-10T12:00:00" }))).toBe("expired");
  });

  it("returns expiring_soon at exactly 15 days out", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-09-04T12:00:00" }))).toBe("expiring_soon");
  });

  it("returns grace_period at exactly 1 day overdue", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-08-19T12:00:00" }))).toBe("grace_period");
  });

  it("paid overrides expiring_soon when balance is zero", () => {
    expect(
      deriveUiStatus(makePeriod({ expiration_date: "2025-08-25T12:00:00", balance: 0, total_due: 100, total_paid: 100 })),
    ).toBe("paid");
  });
});

describe("groupPeriods", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  it("routes periods to correct buckets", () => {
    const periods = [
      makePeriod({ period_id: "active", expiration_date: "2025-09-25T12:00:00" }),         // 36 days → active
      makePeriod({ period_id: "expiring", expiration_date: "2025-08-30T12:00:00" }),        // 10 days → expiring_soon
      makePeriod({ period_id: "grace", expiration_date: "2025-08-17T12:00:00" }),           // -3 days → grace_period
      makePeriod({ period_id: "expired", expiration_date: "2025-08-10T12:00:00" }),         // -10 days → expired
      makePeriod({ period_id: "paid", balance: 0, total_due: 100, expiration_date: "2025-09-25T12:00:00" }), // paid
    ];

    const grouped = groupPeriods(periods, new Map());
    expect(grouped.active.map((p) => p.period_id)).toContain("active");
    expect(grouped.expiring_soon.map((p) => p.period_id)).toContain("expiring");
    expect(grouped.grace_period.map((p) => p.period_id)).toContain("grace");
    expect(grouped.expired.map((p) => p.period_id)).toContain("expired");
    expect(grouped.paid.map((p) => p.period_id)).toContain("paid");
  });

  it("excludes renewed and quit periods from all buckets", () => {
    const periods = [
      makePeriod({ period_id: "r", status: "renewed" }),
      makePeriod({ period_id: "q", status: "quit" }),
    ];
    const grouped = groupPeriods(periods, new Map());
    const all = [
      ...grouped.active,
      ...grouped.expiring_soon,
      ...grouped.grace_period,
      ...grouped.expired,
      ...grouped.paid,
    ];
    expect(all).toHaveLength(0);
  });

  it("handles mixed bag of statuses correctly", () => {
    const periods = [
      makePeriod({ period_id: "1", expiration_date: "2025-09-25T12:00:00" }),  // active
      makePeriod({ period_id: "2", status: "renewed" }),                         // excluded
      makePeriod({ period_id: "3", expiration_date: "2025-08-17T12:00:00" }),  // grace_period
    ];
    const grouped = groupPeriods(periods, new Map());
    expect(grouped.active).toHaveLength(1);
    expect(grouped.grace_period).toHaveLength(1);
  });

  it("returns empty buckets for empty input", () => {
    const grouped = groupPeriods([], new Map());
    expect(grouped.active).toHaveLength(0);
    expect(grouped.expiring_soon).toHaveLength(0);
    expect(grouped.grace_period).toHaveLength(0);
    expect(grouped.expired).toHaveLength(0);
    expect(grouped.paid).toHaveLength(0);
  });

  it("sorts each bucket by expiration date ascending", () => {
    const periods = [
      makePeriod({ period_id: "later", expiration_date: "2025-10-05T12:00:00" }),   // 46 days → active
      makePeriod({ period_id: "earlier", expiration_date: "2025-09-25T12:00:00" }), // 36 days → active
    ];
    const grouped = groupPeriods(periods, new Map());
    expect(grouped.active[0].period_id).toBe("earlier");
    expect(grouped.active[1].period_id).toBe("later");
  });

  it("period with total_due=0 is not categorized as paid", () => {
    const period = makePeriod({ balance: 0, total_due: 0, total_paid: 0, expiration_date: "2025-09-25T12:00:00" });
    const grouped = groupPeriods([period], new Map());
    expect(grouped.paid).toHaveLength(0);
    expect(grouped.active).toHaveLength(1);
  });
});
