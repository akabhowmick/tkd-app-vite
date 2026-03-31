import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";
import { Eye, EyeOff, Check, X } from "lucide-react";

const passwordRules = [
  { label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  // Two modes: "request" (enter email) or "set" (enter new password after clicking link)
  const [mode, setMode] = useState<"request" | "set">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Supabase puts the recovery token in the URL hash on redirect
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("set");
    });
    return () => subscription.unsubscribe();
  }, []);

  const allRulesPassed = passwordRules.every((r) => r.test(password));

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!email) {
      setStatus({ type: "error", message: "Please enter your email." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      setStatus({
        type: "error",
        message: "Could not send reset email. Please check the address and try again.",
      });
    } else {
      setStatus({ type: "success", message: "Check your inbox -- we sent a password reset link." });
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!allRulesPassed) {
      setStatus({
        type: "error",
        message: "Please make sure your password meets all requirements.",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setStatus({
        type: "error",
        message:
          "Failed to update password. Your link may have expired -- please request a new one.",
      });
    } else {
      setStatus({ type: "success", message: "Password updated! Redirecting you to login..." });
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {mode === "request" ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset your password</h1>
            <p className="text-sm text-gray-500 mb-6">We'll send a reset link to your email.</p>

            <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus(null);
                  }}
                  placeholder="you@example.com"
                  className="border border-gray-300 p-2.5 rounded-lg w-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {status && (
                <p
                  className={`text-sm rounded-lg px-3 py-2 border ${status.type === "error" ? "text-red-500 bg-red-50 border-red-200" : "text-green-600 bg-green-50 border-green-200"}`}
                >
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Set a new password</h1>
            <p className="text-sm text-gray-500 mb-6">Make it strong.</p>

            <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordTouched(true);
                      setStatus(null);
                    }}
                    placeholder="••••••••••"
                    className="border border-gray-300 p-2.5 pr-10 rounded-lg w-full bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {passwordTouched && (
                  <div className="mt-2 flex flex-col gap-1">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {passed ? (
                            <Check size={12} className="text-green-500 shrink-0" />
                          ) : (
                            <X size={12} className="text-gray-300 shrink-0" />
                          )}
                          <span
                            className={`text-xs ${passed ? "text-green-600" : "text-gray-400"}`}
                          >
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {status && (
                <p
                  className={`text-sm rounded-lg px-3 py-2 border ${status.type === "error" ? "text-red-500 bg-red-50 border-red-200" : "text-green-600 bg-green-50 border-green-200"}`}
                >
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}

        <p className="text-sm text-center text-gray-500 mt-6">
          <Link to="/login" className="text-blue-500 hover:underline font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
