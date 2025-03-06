import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../api/supabase";

const SignUp: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: UserRole.Admin, // Default role
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate input
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const isSignedUp = await signup(formData, formData.password);
      if (isSignedUp) navigate("/dashboard");
    } catch (err) {
      setError("Sign-up failed. Please try again.");
      console.error(err);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      setError("Google Sign-in failed. Please try again.");
      console.error(error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center p-6 gap-6 bg-white text-black">
        <h1 className="text-2xl font-bold">Sign Up</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-md font-medium">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="border p-2 rounded w-full bg-gray-100 text-black"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-md font-medium">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="border p-2 rounded w-full bg-gray-100 text-black"
            />
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-2">
            <label htmlFor="role" className="text-md font-medium">Are you an Admin?</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="border p-2 rounded w-full bg-gray-100 text-black"
            >
              <option value={UserRole.Admin}>Yes, I am an Admin</option>
              <option value={UserRole.Parent}>No, I am another user</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700">
            Sign Up
          </button>
          <button onClick={handleGoogleSignUp} className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700">
          Sign Up with Google
        </button>
        </form>

      

        <p className="text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">Log In</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default SignUp;
