import { describe, it, expect } from "vitest";
import { friendlyAuthError } from "../../context/AuthContext";

// friendlyAuthError is a pure string→string mapper with no side effects.
// Tests pin every branch so any change to the mapping surfaces immediately.

describe("friendlyAuthError", () => {
  it("returns incorrect-credentials message for invalid login", () => {
    expect(friendlyAuthError("Invalid login credentials")).toBe(
      "Incorrect email or password.",
    );
  });

  it("matches the invalid-login string anywhere in the message", () => {
    expect(friendlyAuthError("Error: Invalid login credentials provided")).toBe(
      "Incorrect email or password.",
    );
  });

  it("returns confirm-email message for unconfirmed email", () => {
    expect(friendlyAuthError("Email not confirmed")).toBe(
      "Please confirm your email before logging in.",
    );
  });

  it("returns already-exists message for duplicate registration", () => {
    expect(friendlyAuthError("User already registered")).toBe(
      "An account with this email already exists.",
    );
  });

  it("returns too-short message for weak password", () => {
    expect(friendlyAuthError("Password should be at least 6 characters")).toBe(
      "Password is too short.",
    );
  });

  it("returns valid-email message for bad email format", () => {
    expect(friendlyAuthError("Unable to validate email address: invalid")).toBe(
      "Please enter a valid email address.",
    );
  });

  it("returns rate-limit message when rate limited", () => {
    expect(friendlyAuthError("For security purposes, you can only request this after 60 seconds, rate limit reached")).toBe(
      "Too many attempts. Please wait a moment and try again.",
    );
  });

  it("returns generic fallback for unknown error", () => {
    expect(friendlyAuthError("some unexpected server error")).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("returns generic fallback for empty string", () => {
    expect(friendlyAuthError("")).toBe("Something went wrong. Please try again.");
  });
});
