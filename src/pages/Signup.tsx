import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";
import { Link } from "react-router-dom";

const SignUp: React.FC = () => {
  const { login } = useAuth(); // Optional: If you want to auto-login after sign-up
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.schoolId) {
      setError("Please fill in all required fields.");
      return;
    }

    // Save user data (Replace with API call or database logic)
    console.log("User signed up:", formData);

    // Optional: Auto-login after sign-up
    login(formData.email, formData.role);

    // Reset form
    setFormData({
      name: "",
      email: "",
      password: "",
      role: UserRole.Parent,
      schoolId: "",
      contactNumber: "",
    });

    setError("");
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
            <option value={UserRole.SchoolAdmin}>School Admin</option>
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
