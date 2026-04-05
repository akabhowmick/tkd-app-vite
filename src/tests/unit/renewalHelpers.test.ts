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

const makePeriod = (overrides: Partial<RenewalPeriod> = {}): RenewalPeriod => ({
  period_id: "p1",
  student_id: "s1",
  school_id: "sc1",
  duration_months: 3,
  expiration_date: "2025-12-01",
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

describe("calculateNewExpirationDate", () => {
  it("adds duration months starting the day after expiration", () => {
    const period = makePeriod({ expiration_date: "2025-08-01" });
    expect(calculateNewExpirationDate(period, 3)).toBe("2025-11-02");
  });

  it("handles month-end edge case without overflow", () => {
    const period = makePeriod({ expiration_date: "2025-01-31" });
    // Feb 1 + 1 month = Mar 1 (not Feb 29)
    expect(calculateNewExpirationDate(period, 1)).toBe("2025-03-01");
  });

  it("crosses year boundary correctly", () => {
    const period = makePeriod({ expiration_date: "2025-11-30" });
    expect(calculateNewExpirationDate(period, 3)).toBe("2026-03-01");
  });
});

describe("calculateExpirationFromStart", () => {
  it("adds 3 months to a start date", () => {
    expect(calculateExpirationFromStart("2025-05-15", 3)).toBe("2025-08-15");
  });

  it("adds 12 months crossing year boundary", () => {
    expect(calculateExpirationFromStart("2025-01-01", 12)).toBe("2026-01-01");
  });
});

describe("calculateDaysUntilExpiration", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2025-08-20T12:00:00Z"));
  });

  it("returns 0 when expiration is today", () => {
    expect(calculateDaysUntilExpiration("2025-08-20")).toBe(0);
  });

  it("returns positive days for future expiration", () => {
    expect(calculateDaysUntilExpiration("2025-08-30")).toBe(10);
  });

  it("returns negative days for past expiration", () => {
    expect(calculateDaysUntilExpiration("2025-08-10")).toBe(-10);
  });

  it("returns 30 for 30 days in the future", () => {
    expect(calculateDaysUntilExpiration("2025-09-19")).toBe(30);
  });
});

describe("isInGracePeriod", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2025-08-20T12:00:00Z"));
  });

  it("returns true when 3 days overdue (within 7-day grace)", () => {
    expect(isInGracePeriod("2025-08-17")).toBe(true);
  });

  it("returns false when 8 days overdue (past grace period)", () => {
    expect(isInGracePeriod("2025-08-12")).toBe(false);
  });

  it("returns false when not yet expired", () => {
    expect(isInGracePeriod("2025-08-25")).toBe(false);
  });

  it("respects custom grace period days", () => {
    // 5 days overdue, custom grace of 3 days — outside grace
    expect(isInGracePeriod("2025-08-15", 3)).toBe(false);
    // 2 days overdue, custom grace of 3 days — inside grace
    expect(isInGracePeriod("2025-08-18", 3)).toBe(true);
  });
});

describe("isExpiringSoon", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2025-08-20T12:00:00Z"));
  });

  it("returns true when expiring in 10 days (within 15-day window)", () => {
    expect(isExpiringSoon("2025-08-30")).toBe(true);
  });

  it("returns false when expiring in 20 days (outside 15-day window)", () => {
    expect(isExpiringSoon("2025-09-09")).toBe(false);
  });

  it("returns false when already expired", () => {
    expect(isExpiringSoon("2025-08-10")).toBe(false);
  });

  it("returns true when expiring today", () => {
    expect(isExpiringSoon("2025-08-20")).toBe(true);
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
    vi.setSystemTime(new Date("2025-08-20T12:00:00Z"));
  });

  it("returns paid when balance is 0 and total_due > 0", () => {
    const p = makePeriod({ balance: 0, total_due: 100, total_paid: 100, expiration_date: "2025-09-20" });
    expect(determineRenewalStatus(p)).toBe("paid");
  });

  it("returns active when expiring in 30 days and not paid", () => {
    const p = makePeriod({ expiration_date: "2025-09-19", balance: 50, total_due: 100 });
    expect(determineRenewalStatus(p)).toBe("active");
  });

  it("returns expiring_soon when expiring in 10 days", () => {
    const p = makePeriod({ expiration_date: "2025-08-30", balance: 50, total_due: 100 });
    expect(determineRenewalStatus(p)).toBe("expiring_soon");
  });

  it("returns grace_period when 3 days overdue", () => {
    const p = makePeriod({ expiration_date: "2025-08-17", balance: 50, total_due: 100 });
    expect(determineRenewalStatus(p)).toBe("grace_period");
  });

  it("returns expired when 10 days overdue", () => {
    const p = makePeriod({ expiration_date: "2025-08-10", balance: 50, total_due: 100 });
    expect(determineRenewalStatus(p)).toBe("expired");
  });

  it("paid overrides expiring_soon when balance is cleared", () => {
    const p = makePeriod({
      expiration_date: "2025-08-25",
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
