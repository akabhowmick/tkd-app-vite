import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateNewExpirationDate,
  calculateExpirationFromStart,
  calculateDaysUntilExpiration,
  isInGracePeriod,
  isExpiringSoon,
  validateRenewalDates,
  determineRenewalStatus,
  calculateRemainingBalance,
  calculatePaymentPercentage,
} from "../../utils/RenewalsUtils/renewalHelpers";
import { RenewalPeriod } from "../../types/student_renewal";

// Using LOCAL noon ("T12:00:00" without Z) for all dates avoids UTC-midnight
// parsing issues: new Date("YYYY-MM-DD") is UTC midnight, but setHours(0,0,0,0)
// uses local time, causing off-by-one in any non-UTC timezone.
// LOCAL noon → setHours(0,0,0,0) always lands on the same local calendar day.

const makePeriod = (overrides: Partial<RenewalPeriod> = {}): RenewalPeriod => ({
  period_id: "p1",
  student_id: "s1",
  school_id: "sc1",
  duration_months: 3,
  expiration_date: "2025-09-20T12:00:00", // 31 days from pinned "today"
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

// Pinned to LOCAL noon Aug 20, 2025 — timezone-safe
const PINNED = new Date(2025, 7, 20, 12); // month is 0-indexed

describe("calculateNewExpirationDate", () => {
  it("adds duration months starting the day after expiration", () => {
    // Aug 15 noon + 1 day = Aug 16, + 3 months = Nov 16
    const period = makePeriod({ expiration_date: "2025-08-15T12:00:00" });
    expect(calculateNewExpirationDate(period, 3)).toBe("2025-11-16");
  });

  it("handles mid-month boundary correctly", () => {
    // Jan 15 noon + 1 day = Jan 16, + 1 month = Feb 16
    const period = makePeriod({ expiration_date: "2025-01-15T12:00:00" });
    expect(calculateNewExpirationDate(period, 1)).toBe("2025-02-16");
  });

  it("crosses year boundary correctly", () => {
    // Oct 15 noon + 1 day = Oct 16, + 3 months = Jan 16, 2026
    const period = makePeriod({ expiration_date: "2025-10-15T12:00:00" });
    expect(calculateNewExpirationDate(period, 3)).toBe("2026-01-16");
  });
});

describe("calculateExpirationFromStart", () => {
  it("adds 3 months to a start date", () => {
    expect(calculateExpirationFromStart("2025-05-15T12:00:00", 3)).toBe("2025-08-15");
  });

  it("adds 12 months crossing year boundary", () => {
    expect(calculateExpirationFromStart("2025-01-10T12:00:00", 12)).toBe("2026-01-10");
  });
});

describe("calculateDaysUntilExpiration", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  it("returns 0 when expiration is today (local noon)", () => {
    expect(calculateDaysUntilExpiration("2025-08-20T12:00:00")).toBe(0);
  });

  it("returns positive days for future expiration", () => {
    expect(calculateDaysUntilExpiration("2025-08-30T12:00:00")).toBe(10);
  });

  it("returns negative days for past expiration", () => {
    expect(calculateDaysUntilExpiration("2025-08-10T12:00:00")).toBe(-10);
  });

  it("returns 30 for 30 days in the future", () => {
    expect(calculateDaysUntilExpiration("2025-09-19T12:00:00")).toBe(30);
  });
});

describe("isInGracePeriod", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  it("returns true when 3 days overdue (within 7-day grace)", () => {
    expect(isInGracePeriod("2025-08-17T12:00:00")).toBe(true);
  });

  it("returns false when 8 days overdue (past grace period)", () => {
    expect(isInGracePeriod("2025-08-12T12:00:00")).toBe(false);
  });

  it("returns false when not yet expired", () => {
    expect(isInGracePeriod("2025-08-25T12:00:00")).toBe(false);
  });

  it("respects custom grace period days", () => {
    expect(isInGracePeriod("2025-08-15T12:00:00", 3)).toBe(false); // 5 days overdue > 3
    expect(isInGracePeriod("2025-08-18T12:00:00", 3)).toBe(true);  // 2 days overdue ≤ 3
  });
});

describe("isExpiringSoon", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  it("returns true when expiring in 10 days (within 15-day window)", () => {
    expect(isExpiringSoon("2025-08-30T12:00:00")).toBe(true);
  });

  it("returns false when expiring in 20 days (outside 15-day window)", () => {
    expect(isExpiringSoon("2025-09-09T12:00:00")).toBe(false);
  });

  it("returns false when already expired", () => {
    expect(isExpiringSoon("2025-08-10T12:00:00")).toBe(false);
  });

  it("returns true when expiring today", () => {
    expect(isExpiringSoon("2025-08-20T12:00:00")).toBe(true);
  });
});

describe("validateRenewalDates", () => {
  it("returns null for valid dates", () => {
    expect(validateRenewalDates("2025-01-01", "2025-04-01")).toBeNull();
  });

  it("returns error when expiration equals payment date", () => {
    expect(validateRenewalDates("2025-01-01", "2025-01-01")).not.toBeNull();
  });

  it("returns error when expiration is before payment date", () => {
    expect(validateRenewalDates("2025-06-01", "2025-01-01")).not.toBeNull();
  });

  it("returns error for invalid date string", () => {
    expect(validateRenewalDates("not-a-date", "2025-04-01")).not.toBeNull();
  });
});

describe("determineRenewalStatus", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  it("returns paid when balance is 0 and total_due > 0", () => {
    const p = makePeriod({ balance: 0, total_due: 100, total_paid: 100, expiration_date: "2025-09-20T12:00:00" });
    expect(determineRenewalStatus(p)).toBe("paid");
  });

  it("returns active when expiring in 30 days and not paid", () => {
    const p = makePeriod({ expiration_date: "2025-09-19T12:00:00", balance: 50, total_due: 100 });
    expect(determineRenewalStatus(p)).toBe("active");
  });

  it("returns expiring_soon when expiring in 10 days", () => {
    const p = makePeriod({ expiration_date: "2025-08-30T12:00:00", balance: 50, total_due: 100 });
    expect(determineRenewalStatus(p)).toBe("expiring_soon");
  });

  it("returns grace_period when 3 days overdue", () => {
    const p = makePeriod({ expiration_date: "2025-08-17T12:00:00", balance: 50, total_due: 100 });
    expect(determineRenewalStatus(p)).toBe("grace_period");
  });

  it("returns expired when 10 days overdue", () => {
    const p = makePeriod({ expiration_date: "2025-08-10T12:00:00", balance: 50, total_due: 100 });
    expect(determineRenewalStatus(p)).toBe("expired");
  });

  it("paid overrides expiring_soon when balance is cleared", () => {
    const p = makePeriod({
      expiration_date: "2025-08-25T12:00:00",
      balance: 0,
      total_due: 100,
      total_paid: 100,
    });
    expect(determineRenewalStatus(p)).toBe("paid");
  });
});

describe("calculateRemainingBalance", () => {
  it("returns difference for partial payment", () => {
    expect(calculateRemainingBalance(200, 80)).toBe(120);
  });

  it("returns 0 when overpaid", () => {
    expect(calculateRemainingBalance(100, 150)).toBe(0);
  });

  it("returns full amount when nothing paid", () => {
    expect(calculateRemainingBalance(100, 0)).toBe(100);
  });
});

describe("calculatePaymentPercentage", () => {
  it("returns 50 for half paid", () => {
    expect(calculatePaymentPercentage(200, 100)).toBe(50);
  });

  it("returns 100 when fully paid", () => {
    expect(calculatePaymentPercentage(100, 100)).toBe(100);
  });

  it("caps at 100 when overpaid", () => {
    expect(calculatePaymentPercentage(100, 150)).toBe(100);
  });

  it("returns 0 when amount_due is 0", () => {
    expect(calculatePaymentPercentage(0, 0)).toBe(0);
  });
});
