import { useState } from "react";
import { UserProfile } from "../../../types/user";
import { createStudent } from "../../../api/StudentRequests/studentRequests";
import { useSchool } from "../../../context/SchoolContext";

interface AdminStudentFormProps {
  existingUser?: UserProfile;
  onSuccess: () => void;
}

const userTypes = [
  { label: "Student", value: "Student" },
  { label: "Instructor", value: "Instructor" },
  { label: "Parent", value: "Parent" },
  { label: "Admin", value: "Admin" },
];

const fieldConfigs = [
  { name: "name", label: "Full Name", type: "text" },
  { name: "email", label: "Email Address", type: "text" },
  { name: "phone", label: "Phone Number", type: "tel" },
  { name: "school_id", label: "School ID", type: "text" },
];

export const AdminStudentForm: React.FC<AdminStudentFormProps> = ({ existingUser, onSuccess }) => {
  const { school } = useSchool();

  const [formData, setFormData] = useState<UserProfile>({
    name: existingUser?.name ?? "",
    email: existingUser?.email ?? "",
    phone: existingUser?.phone ?? "",
    school_id: (school && school.id!) || "",
    role: existingUser?.role ?? "Student",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { ...createData } = formData;
      await createStudent(createData);
      onSuccess();
    } catch (err: unknown) {
      console.error("❌ Error during submission:", err);

      // Enhanced error logging for Supabase
      if (err && typeof err === "object") {
        const error = err as Record<string, unknown>;
        console.error("- Message:", error.message);
      }

      // Set user-friendly error message
      let errorMessage: string = "Something went wrong.";

      if (err instanceof Error) {
        errorMessage = err.message;

        // Handle common Supabase errors
        if (err.message.includes("duplicate key")) {
          errorMessage = "A record with this information already exists.";
        } else if (err.message.includes("permission denied")) {
          errorMessage = "You don't have permission to perform this operation.";
        } else if (err.message.includes("violates foreign key constraint")) {
          errorMessage = "Invalid reference data provided.";
        } else if (err.message.includes("violates not-null constraint")) {
          errorMessage = "Required fields are missing.";
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg mx-auto space-y-4 w-full max-w-md"
    >
      <h2 className="text-2xl text-black font-bold mb-4">
        {formData.id ? "Edit Student" : "Add Student"}
      </h2>

      {fieldConfigs
        .filter((field) => field.name !== "school_id")
        .map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="block mb-1 font-medium text-gray-700">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              value={formData[field.name as keyof UserProfile] || ""}
              onChange={handleChange}
              className="w-full border bg-slate-100 border-gray-300 p-2 rounded transition duration-200
          hover:border-gray-500 focus:outline-none focus:ring-3 focus:ring-red-200 text-black"
              required
            />
          </div>
        ))}

      <div>
        <label htmlFor="role" className="block mb-1 font-medium text-gray-700">
          User Type
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full p-2 border text-black border-gray-300 rounded bg-slate-100 focus:outline-none focus:ring-0"
          required
        >
          <option value="">Select role</option>
          {userTypes.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-700 text-white py-2 px-4 rounded-md hover:bg-red-800 transition"
      >
        {loading ? "Saving..." : formData.id ? "Update Student" : "Add Student"}
      </button>
    </form>
  );
};
