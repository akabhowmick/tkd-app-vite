import { useState } from "react";
import { createUser, updateUser } from "../../api/AppUserRequests/AppUserRequests";
import { UserProfile } from "../../types/user";

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
  { name: "phone", label: "Phone Number", type: "tel" },
  { name: "school_id", label: "School ID", type: "text" },
];

export const AdminStudentForm: React.FC<AdminStudentFormProps> = ({ existingUser, onSuccess }) => {
  const [formData, setFormData] = useState<UserProfile>({
    name: existingUser?.name ?? "",
    phone: existingUser?.phone ?? "",
    schoolId: existingUser?.schoolId ?? "",
    userType: existingUser?.userType ?? "Student",
    id: existingUser?.id, // optional for edit
  });

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
      if (formData.id) {
        await updateUser(formData.id, formData);
      } else {
        await createUser(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg mx-auto space-y-4 w-full max-w-md"
    >
      <h2 className="text-2xl text-black font-bold mb-4">{formData.id ? "Edit Student" : "Add Student"}</h2>

      {fieldConfigs.map((field) => (
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
             hover:border-gray-500 focus:outline-none focus:ring-3 focus:ring-red-200"
            required
          />
        </div>
      ))}

      <div>
        <label htmlFor="role" className="block mb-1 font-medium text-gray-700">User Type</label>
        <select
          id="role"
          name="role"
          value={formData.userType}
          onChange={handleChange}
          className="w-full p-2 border text-black border-gray-300 rounded bg-slate-100 focus:outline-none focus:ring-0"
          required
        >
          <option value="">Select role</option>
          {userTypes.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition"
      >
        {loading ? "Saving..." : formData.id ? "Update Student" : "Add Student"}
      </button>
    </form>
  );
};
