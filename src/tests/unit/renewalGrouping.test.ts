import { describe, it, expect, beforeEach, vi } from "vitest";
import { deriveUiStatus, groupPeriods } from "../../context/StudentRenewalContext";
import { RenewalPeriod } from "../../types/student_renewal";

const makePeriod = (overrides: Partial<RenewalPeriod> = {}): RenewalPeriod => ({
  period_id: "p1",
  student_id: "s1",
  school_id: "sc1",
  duration_months: 3,
  expiration_date: "2025-09-20",
  number_of_classes: 2,
  status: "active",
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
    vi.setSystemTime(new Date("2025-08-20T12:00:00Z"));
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

  it("returns active for expiration 30 days out", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-09-19" }))).toBe("active");
  });

  it("returns expiring_soon when expiring in 10 days", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-08-30" }))).toBe("expiring_soon");
  });

  it("returns grace_period when 3 days overdue", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-08-17" }))).toBe("grace_period");
  });

  it("returns expired when 10 days overdue", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-08-10" }))).toBe("expired");
  });

  it("returns expiring_soon at edge of 15-day window", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-09-04" }))).toBe("expiring_soon");
  });

  it("returns grace_period at edge of 7-day grace (1 day overdue)", () => {
    expect(deriveUiStatus(makePeriod({ expiration_date: "2025-08-19" }))).toBe("grace_period");
  });

  it("paid overrides expiring_soon when balance is zero", () => {
    expect(
      deriveUiStatus(makePeriod({ expiration_date: "2025-08-25", balance: 0, total_due: 100, total_paid: 100 })),
    ).toBe("paid");
  });
});

describe("groupPeriods", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2025-08-20T12:00:00Z"));
  });

  it("routes periods to correct buckets", () => {
    const periods = [
      makePeriod({ period_id: "a", expiration_date: "2025-09-19" }),          // active
      makePeriod({ period_id: "b", expiration_date: "2025-08-30" }),          // expiring_soon
      makePeriod({ period_id: "c", expiration_date: "2025-08-17" }),          // grace_period
      makePeriod({ period_id: "d", expiration_date: "2025-08-10" }),          // expired
      makePeriod({ period_id: "e", balance: 0, total_due: 100, expiration_date: "2025-09-19" }), // paid
    ];

    const grouped = groupPeriods(periods);
    expect(grouped.active.map((p) => p.period_id)).toContain("a");
    expect(grouped.expiring_soon.map((p) => p.period_id)).toContain("b");
    expect(grouped.grace_period.map((p) => p.period_id)).toContain("c");
    expect(grouped.expired.map((p) => p.period_id)).toContain("d");
    expect(grouped.paid.map((p) => p.period_id)).toContain("e");
  });

  it("excludes renewed and quit periods from all buckets", () => {
    const periods = [
      makePeriod({ period_id: "r", status: "renewed" }),
      makePeriod({ period_id: "q", status: "quit" }),
    ];
    const grouped = groupPeriods(periods);
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
      makePeriod({ period_id: "1", expiration_date: "2025-09-19" }),
      makePeriod({ period_id: "2", status: "renewed" }),
      makePeriod({ period_id: "3", expiration_date: "2025-08-17" }),
    ];
    const grouped = groupPeriods(periods);
    expect(grouped.active).toHaveLength(1);
    expect(grouped.grace_period).toHaveLength(1);
  });

  it("returns empty buckets for empty input", () => {
    const grouped = groupPeriods([]);
    expect(grouped.active).toHaveLength(0);
    expect(grouped.expiring_soon).toHaveLength(0);
    expect(grouped.grace_period).toHaveLength(0);
    expect(grouped.expired).toHaveLength(0);
    expect(grouped.paid).toHaveLength(0);
  });

  it("sorts each bucket by expiration date ascending", () => {
    const periods = [
      makePeriod({ period_id: "z", expiration_date: "2025-09-15" }),
      makePeriod({ period_id: "a", expiration_date: "2025-09-01" }),
    ];
    const grouped = groupPeriods(periods);
    expect(grouped.active[0].period_id).toBe("a");
    expect(grouped.active[1].period_id).toBe("z");
  });

  it("period with total_due=0 is not categorized as paid", () => {
    const period = makePeriod({ balance: 0, total_due: 0, total_paid: 0, expiration_date: "2025-09-19" });
    const grouped = groupPeriods([period]);
    expect(grouped.paid).toHaveLength(0);
    expect(grouped.active).toHaveLength(1);
  });
});
