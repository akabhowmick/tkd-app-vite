import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../../pages/Login";
import { supabase } from "../../api/supabase";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();
const mockCaptchaReset = vi.fn();

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

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

// Stand-in widget: a button that "solves" the captcha, plus a spy-able reset()
vi.mock("@marsidev/react-turnstile", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  return {
    Turnstile: forwardRef<unknown, { onSuccess?: (token: string) => void }>(({ onSuccess }, ref) => {
      useImperativeHandle(ref, () => ({ reset: mockCaptchaReset }));
      return (
        <button type="button" onClick={() => onSuccess?.("captcha-token")}>
          Solve captcha
        </button>
      );
    }),
  };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe("Login form — validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows error when both fields are empty on submit", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/please enter both email and password/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows error when only email is missing", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/please enter both email and password/i)).toBeInTheDocument();
    });
  });

  it("shows error when only password is missing", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/please enter both email and password/i)).toBeInTheDocument();
    });
  });
});

describe("Login form — submission", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls login and navigates to dashboard on success", async () => {
    mockLogin.mockResolvedValue({ success: true });
    renderLogin();
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "mypassword" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "mypassword", undefined);
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error message returned from login on failure", async () => {
    mockLogin.mockResolvedValue({ success: false, message: "Invalid credentials" });
    renderLogin();
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows generic error when login throws", async () => {
    mockLogin.mockRejectedValue(new Error("Network error"));
    renderLogin();
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "pass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});

describe("Login form — captcha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "test-site-key");
  });
  afterEach(() => vi.stubEnv("VITE_TURNSTILE_SITE_KEY", ""));

  const fillCredentials = () => {
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "mypassword" } });
  };

  it("blocks sign-in until the security check is completed", async () => {
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/please complete the security check/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("sends the captcha token and resets the widget after a failed attempt", async () => {
    mockLogin.mockResolvedValue({ success: false, message: "Incorrect email or password." });
    renderLogin();
    fillCredentials();
    fireEvent.click(screen.getByRole("button", { name: /solve captcha/i }));
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@example.com", "mypassword", "captcha-token");
      expect(mockCaptchaReset).toHaveBeenCalled();
    });
  });
});

describe("Login form — Google sign-in", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls signInWithOAuth with google provider", async () => {
    const mockOAuth = supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>;
    mockOAuth.mockResolvedValue({ data: {}, error: null });
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() => {
      expect(mockOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "google" }),
      );
    });
  });

  it("shows error when Google sign-in fails", async () => {
    const mockOAuth = supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>;
    mockOAuth.mockResolvedValue({ data: null, error: new Error("OAuth failed") });
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() => {
      expect(screen.getByText(/google sign-in failed/i)).toBeInTheDocument();
    });
  });
});

describe("Login form — password visibility toggle", () => {
  it("toggles password field type when eye icon is clicked", () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute("type", "password");
    // The toggle button is adjacent to the password input
    const toggleBtn = passwordInput.closest("div")!.querySelector("button[type='button']")!;
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
