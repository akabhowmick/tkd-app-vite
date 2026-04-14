import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../api/supabase";
import { useAuth } from "../../../context/AuthContext";
import { Input } from "../../ui/input";
import { ProgramsSettings } from "../../AccountDashboards/AdminFeatures/Programs/ProgramsSettings";

export const SettingsPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* ── Programs section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <ProgramsSettings />
      </div>

      {/* ── Password section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">Change Password</h2>
        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-pass" className="text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="relative">
              <Input
                id="new-pass"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-pass" className="text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                id="confirm-pass"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Password updated successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="self-end px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* ── Danger zone */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Account</h2>
        <p className="text-xs text-gray-400 mb-4">Sign out from this session.</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};
