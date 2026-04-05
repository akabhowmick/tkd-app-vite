import { describe, it, expect } from "vitest";
import { validateFormData } from "../../utils/formValidation";
import { calculateAttendanceStats } from "../../components/AccountDashboards/AdminFeatures/AttendanceRecords/AttendanceStats";

describe("validateFormData", () => {
  it("returns null for fully valid data", () => {
    expect(
      validateFormData({ name: "Jane Doe", email: "jane@example.com", phone: "5551234567" }),
    ).toBeNull();
  });

  it("returns error when name is empty", () => {
    expect(
      validateFormData({ name: "", email: "jane@example.com", phone: "" }),
    ).not.toBeNull();
  });

  it("returns error when name is only 1 character", () => {
    expect(
      validateFormData({ name: "J", email: "jane@example.com", phone: "" }),
    ).not.toBeNull();
  });

  it("returns error when email is empty", () => {
    expect(
      validateFormData({ name: "Jane Doe", email: "", phone: "" }),
    ).not.toBeNull();
  });

  it("returns error for invalid email format", () => {
    expect(
      validateFormData({ name: "Jane Doe", email: "not-an-email", phone: "" }),
    ).not.toBeNull();
  });

  it("returns null when phone is empty (phone is optional)", () => {
    expect(
      validateFormData({ name: "Jane Doe", email: "jane@example.com", phone: "" }),
    ).toBeNull();
  });

  it("returns error for invalid phone number format", () => {
    expect(
      validateFormData({ name: "Jane Doe", email: "jane@example.com", phone: "123" }),
    ).not.toBeNull();
  });

  it("returns null for a phone with formatting chars", () => {
    expect(
      validateFormData({ name: "Jane Doe", email: "jane@example.com", phone: "(555) 123-4567" }),
    ).toBeNull();
  });

  it("returns the first validation error encountered", () => {
    const result = validateFormData({ name: "", email: "", phone: "" });
    expect(result).toBe("Please enter the student's name");
  });

  it("returns email error when name is valid but email is blank", () => {
    const result = validateFormData({ name: "Jane Doe", email: "", phone: "" });
    expect(result).toBe("Please enter an email address");
  });
});

describe("calculateAttendanceStats", () => {
  it("counts present, absent, and unmarked correctly", () => {
    const attendance = {
      s1: "present" as const,
      s2: "absent" as const,
      s3: "present" as const,
    };
    const stats = calculateAttendanceStats(attendance, 4);
    expect(stats.present).toBe(2);
    expect(stats.absent).toBe(1);
    expect(stats.unmarked).toBe(1);
  });

  it("returns all unmarked when attendance map is empty", () => {
    const stats = calculateAttendanceStats({}, 5);
    expect(stats.present).toBe(0);
    expect(stats.absent).toBe(0);
    expect(stats.unmarked).toBe(5);
  });

  it("returns all present when every student is marked present", () => {
    const attendance = { s1: "present" as const, s2: "present" as const };
    const stats = calculateAttendanceStats(attendance, 2);
    expect(stats.present).toBe(2);
    expect(stats.unmarked).toBe(0);
  });

  it("returns zeros when totalStudents is 0", () => {
    const stats = calculateAttendanceStats({}, 0);
    expect(stats.present).toBe(0);
    expect(stats.absent).toBe(0);
    expect(stats.unmarked).toBe(0);
  });

  it("present + absent + unmarked always equals totalStudents", () => {
    const attendance = {
      s1: "present" as const,
      s2: "absent" as const,
    };
    const total = 5;
    const stats = calculateAttendanceStats(attendance, total);
    expect(stats.present + stats.absent + stats.unmarked).toBe(total);
  });
});
