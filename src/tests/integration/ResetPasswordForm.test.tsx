import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResetPassword from "../../pages/ResetPassword";
import { supabase } from "../../api/supabase";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className}>{children}</div>
    ),
  },
}));

const mockResetPasswordForEmail = supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>;
const mockUpdateUser = supabase.auth.updateUser as ReturnType<typeof vi.fn>;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>;

const renderResetPassword = () =>
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>,
  );

describe("ResetPassword — request mode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the request reset form by default", () => {
    renderResetPassword();
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows error when email is empty", async () => {
    renderResetPassword();
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/please enter your email/i)).toBeInTheDocument();
    });
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("calls resetPasswordForEmail and shows success message", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    renderResetPassword();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({ redirectTo: expect.stringContaining("/reset-password") }),
      );
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it("shows error when reset email fails", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: new Error("Failed") });
    renderResetPassword();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/could not send reset email/i)).toBeInTheDocument();
    });
  });
});

describe("ResetPassword — set password mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate PASSWORD_RECOVERY event to switch to "set" mode
    mockOnAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      callback("PASSWORD_RECOVERY");
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it("renders the set password form when in recovery mode", () => {
    renderResetPassword();
    expect(screen.getByText(/set a new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("shows validation error when password doesn't meet all rules", async () => {
    renderResetPassword();
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));
    await waitFor(() => {
      expect(screen.getByText(/please make sure your password meets all requirements/i)).toBeInTheDocument();
    });
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("calls updateUser on a valid password and shows success", async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });
    renderResetPassword();
    const validPassword = "StrongPass1!";
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: validPassword } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: validPassword });
      expect(screen.getByText(/password updated/i)).toBeInTheDocument();
    });
  });

  it("shows error when updateUser fails", async () => {
    mockUpdateUser.mockResolvedValue({ data: null, error: new Error("Expired link") });
    renderResetPassword();
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "StrongPass1!" } });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to update password/i)).toBeInTheDocument();
    });
  });
});

describe("ResetPassword — password rules display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      callback("PASSWORD_RECOVERY");
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it("shows password rules when user starts typing", () => {
    renderResetPassword();
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "a" } });
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
  });
});
