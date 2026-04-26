import React, { useState } from "react";
import { useSchool } from "../../../../context/SchoolContext";
import { createOrInviteUser, CreateUserRole } from "../../../../api/AdminRequests/createUserRequest";
import { AppFormModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ROLES: { value: CreateUserRole; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Can view their own attendance, belt history, and membership." },
  { value: "parent", label: "Parent", description: "Can view their linked children's data." },
  { value: "instructor", label: "Instructor", description: "Can take attendance, manage belts, and view renewals." },
];

type Mode = "create" | "invite";

export const CreateUserModal: React.FC<Props> = ({ open, onOpenChange, onSuccess }) => {
  const { schoolId } = useSchool();

  const [mode, setMode] = useState<Mode>("invite");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CreateUserRole>("student");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("student");
    setPassword("");
    setError(null);
    setSuccess(null);
    setMode("invite");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) { setError("Name is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }
    if (mode === "create" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await createOrInviteUser({
        action: mode,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        school_id: schoolId,
        password: mode === "create" ? password : undefined,
      });

      setSuccess(
        mode === "invite"
          ? `Invite sent to ${email}. They'll receive an email to set their password.`
          : `Account created for ${name}. They can now log in with the password you set.`,
      );
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFormModal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Add User"
      description="Create an account directly or send an email invite."
      size="default"
      onSubmit={handleSubmit}
      submitLabel={
        loading
          ? mode === "invite" ? "Sending..." : "Creating..."
          : mode === "invite" ? "Send Invite" : "Create Account"
      }
      loading={loading}
      error={error}
    >
      {/* Success state */}
      {success ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-sm text-gray-700">{success}</p>
        </div>
      ) : (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["invite", "create"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === m
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "invite" ? "Send Invite Link" : "Set Password"}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            {mode === "invite"
              ? "An email will be sent with a link to set their own password."
              : "You set the password now. Share it with the user securely."}
          </p>

          {/* Fields */}
          <ModalField label="Full Name" required htmlFor="cu-name">
            <Input
              id="cu-name"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </ModalField>

          <ModalField label="Email Address" required htmlFor="cu-email">
            <Input
              id="cu-email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </ModalField>

          {/* Role selector */}
          <ModalField label="Role" required htmlFor="cu-role">
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border-2 text-left transition-colors ${
                    role === r.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${
                      role === r.value ? "text-primary" : "text-gray-700"
                    }`}
                  >
                    {r.label}
                  </span>
                  <span className="text-xs text-gray-400">{r.description}</span>
                </button>
              ))}
            </div>
          </ModalField>

          {/* Password — only shown for create mode */}
          {mode === "create" && (
            <ModalField label="Password" required htmlFor="cu-password">
              <div className="relative">
                <Input
                  id="cu-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </ModalField>
          )}
        </>
      )}
    </AppFormModal>
  );
};
