import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateInput = () => {
    const { email, password } = formData;

    // Simple email format validation (using regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    // Ensure password is at least 6 characters long
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any previous errors
    setError("");

    // Validate input
    if (!validateInput()) return;

    try {
      // Call the login function (backend validation occurs here)
      const success = await login(formData.email, formData.password);
      if (!success) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      // Redirect to the dashboard after successful login
      navigate("/dashboard");
    } catch (err) {
      // Handle unexpected backend errors
      setError("Something went wrong. Please try again later. " + err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} // Start slightly below and invisible
      animate={{ opacity: 1, y: 0 }} // Fade in and move to normal position
      transition={{ duration: 0.5, ease: "easeOut" }} // Smooth transition
      className="flex flex-col items-center p-6 gap-6 bg-white text-black"
    >
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 rounded w-full bg-gray-100 text-black"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="border p-2 rounded w-full bg-gray-100 text-black"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>

      <p className="text-sm">
        Don't have an account?{" "}
        <Link to="/signup" className="text-blue-500 hover:underline">
          Sign Up
        </Link>
      </p>
    </motion.div>
  );

};

export default Login;
