import { useState } from "react";
import { UserProfile } from "../../types/user";
import { updateUser, createUser } from "../../api/AppUserRequests/AppUserRequests";

interface AdminStudentFormProps {
  existingUser?: UserProfile; // for edit mode
  onSuccess: () => void;      // callback after create/update
}

const fieldConfigs = [
  { name: "name", label: "Full Name", type: "text" },
  { name: "phone", label: "Phone Number", type: "tel" },
  { name: "school_id", label: "School ID", type: "text" },
  { name: "role", label: "Role", type: "select", options: ["student", "parent", "instructor"] },
];

export const AdminStudentForm: React.FC<AdminStudentFormProps> = ({
  existingUser,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<UserProfile>(
    existingUser || { name: "", phone: "", school_id: "", role: "student" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (existingUser?.id) {
        await updateUser(existingUser.id, formData);
      } else {
        await createUser(formData);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md space-y-4 w-full max-w-md"
    >
      <h2 className="text-2xl font-bold mb-4">
        {existingUser ? "Edit Student" : "Add Student"}
      </h2>

      {fieldConfigs.map((field) => (
        <div key={field.name}>
          <label className="block mb-1 font-medium text-gray-700" htmlFor={field.name}>
            {field.label}
          </label>
          {field.type === "select" ? (
            <select
              name={field.name}
              id={field.name}
              value={formData[field.name as keyof UserProfile] || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded-md"
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              name={field.name}
              id={field.name}
              value={formData[field.name as keyof UserProfile] || ""}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded-md"
              required
            />
          )}
        </div>
      ))}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition"
        disabled={loading}
      >
        {loading ? "Saving..." : existingUser ? "Update Student" : "Add Student"}
      </button>
    </form>
  );
};
