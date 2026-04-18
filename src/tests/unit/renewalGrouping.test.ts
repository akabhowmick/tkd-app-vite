import { describe, it, expect, beforeEach, vi } from "vitest";
import { deriveUiStatus, groupPeriods } from "../../context/StudentRenewalContext";
import { RenewalPeriod } from "../../types/student_renewal";

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
