import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getTodayDate, formatDate } from "../../utils/AttendanceUtils/DateUtils";

// LOCAL noon avoids UTC-midnight off-by-one when getDate/getMonth/getFullYear
// are used in the implementation (they read local time, not UTC).
const PINNED = new Date(2025, 7, 20, 12); // Aug 20, 2025, local noon

describe("getTodayDate", () => {
  beforeEach(() => {
    vi.setSystemTime(PINNED);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the pinned date as YYYY-MM-DD", () => {
    expect(getTodayDate()).toBe("2025-08-20");
  });

  it("output always matches YYYY-MM-DD pattern", () => {
    expect(getTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("zero-pads single-digit month and day", () => {
    vi.setSystemTime(new Date(2025, 2, 5, 12)); // March 5
    expect(getTodayDate()).toBe("2025-03-05");
  });

  it("returns correct value on the first day of the year", () => {
    vi.setSystemTime(new Date(2025, 0, 1, 12)); // Jan 1
    expect(getTodayDate()).toBe("2025-01-01");
  });

  it("returns correct value on the last day of the year", () => {
    vi.setSystemTime(new Date(2025, 11, 31, 12)); // Dec 31
    expect(getTodayDate()).toBe("2025-12-31");
  });
});

describe("formatDate", () => {
  // formatDate("YYYY-MM-DD") builds new Date(year, month-1, day) — local
  // time constructor — then formats with en-US long locale options.

  it("formats Aug 20 2025 with full weekday, month, day, year", () => {
    // Aug 20, 2025 is a Wednesday
    expect(formatDate("2025-08-20")).toBe("Wednesday, August 20, 2025");
  });

  it("formats Jan 1 2025 correctly", () => {
    // Jan 1, 2025 is a Wednesday
    expect(formatDate("2025-01-01")).toBe("Wednesday, January 1, 2025");
  });

  it("formats Dec 31 2025 correctly", () => {
    // Dec 31, 2025 is a Wednesday
    expect(formatDate("2025-12-31")).toBe("Wednesday, December 31, 2025");
  });

  it("contains the full month name", () => {
    expect(formatDate("2025-03-15")).toContain("March");
  });

  it("contains the 4-digit year", () => {
    expect(formatDate("2025-06-10")).toContain("2025");
  });

  it("contains the day number without leading zero", () => {
    expect(formatDate("2025-08-05")).toContain("5");
    expect(formatDate("2025-08-05")).not.toContain("05");
  });
});
