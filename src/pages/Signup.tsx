import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";
import { Link, useNavigate } from "react-router-dom";

const SignUp: React.FC = () => {
  const { login } = useAuth(); // Optional: Auto-login after sign-up
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.Parent,
    schoolId: "",
    contactNumber: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateInput = () => {
    const { name, email, password, schoolId } = formData;

    // Check required fields
    if (!name || !email || !password || !schoolId) {
      setError("Please fill in all required fields.");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    // Validation passed
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError("");

    // Validate inputs
    if (!validateInput()) return;

    try {
      // Simulate backend sign-up logic (replace with actual API call)
      console.log("User signed up:", formData);

      // Optional: Auto-login after successful sign-up
      await login(formData.email, formData.password);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      // Handle backend errors
      setError("Sign-up failed. Please try again later. " + err);
    }

    // Reset form
    setFormData({
      name: "",
      email: "",
      password: "",
      role: UserRole.Parent,
      schoolId: "",
      contactNumber: "",
    });
  };

  // Input configuration array
  const inputs = [
    { label: "Full Name", type: "text", name: "name", placeholder: "Full Name" },
    { label: "Email", type: "email", name: "email", placeholder: "Email" },
    { label: "Password", type: "password", name: "password", placeholder: "Password" },
    { label: "School ID", type: "text", name: "schoolId", placeholder: "School ID" },
    {
      label: "Contact Number",
      type: "text",
      name: "contactNumber",
      placeholder: "Contact Number (optional)",
    },
  ];

  return (
    <div className="flex flex-col items-center p-6 gap-6 bg-white text-black">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        {inputs.map((input) => (
          <div key={input.name} className="flex flex-col gap-2">
            <label htmlFor={input.name} className="text-md font-medium">
              {input.label}
            </label>
            <input
              id={input.name}
              type={input.type}
              name={input.name}
              value={formData[input.name as keyof typeof formData]}
              onChange={handleChange}
              placeholder={input.placeholder}
              className="border p-2 rounded w-full bg-gray-100 text-black"
            />
          </div>
        ))}

        {/* Role Selection */}
        <div className="flex flex-col gap-2">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="border p-2 rounded w-full bg-gray-100 text-black"
          >
            <option value={UserRole.Parent}>Parent</option>
            <option value={UserRole.Student}>Student</option>
            <option value={UserRole.Instructor}>Instructor</option>
            <option value={UserRole.Admin}>School Admin</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>
      <p className="text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-500 hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
};

export default SignUp;
