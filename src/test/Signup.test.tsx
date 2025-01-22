import { render, screen, fireEvent } from "@testing-library/react";

import { AuthProvider } from "../context/AuthContext";
import SignUp from "../pages/Signup";

describe("SignUp Component", () => {
  it("renders the SignUp form with all inputs", () => {
    render(
      <AuthProvider>
        <SignUp />
      </AuthProvider>
    );

    // Check for form elements
    expect(screen.getByPlaceholderText("Full Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("School ID")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("updates input values when user types", () => {
    render(
      <AuthProvider>
        <SignUp />
      </AuthProvider>
    );

    const nameInput = screen.getByPlaceholderText("Full Name");
    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    expect(nameInput).toHaveValue("John Doe");
  });

  it("shows error when required fields are missing", () => {
    render(
      <AuthProvider>
        <SignUp />
      </AuthProvider>
    );

    const submitButton = screen.getByRole("button", { name: "Sign Up" });
    fireEvent.click(submitButton);

    expect(screen.getByText("Please fill in all required fields.")).toBeInTheDocument();
  });
});
