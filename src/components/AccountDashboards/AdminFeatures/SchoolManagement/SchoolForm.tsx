import React, { useState } from "react";
import { School, SchoolInput } from "../../../../types/school";

const fields = [
  { name: "name", label: "School Name", type: "text", required: true },
  { name: "address", label: "Address", type: "text", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone Number", type: "tel" },
  { name: "website", label: "Website", type: "url" },
  { name: "logo_url", label: "Logo URL", type: "url" },
  { name: "description", label: "Description", type: "text" },
  { name: "established_at", label: "Established Year", type: "text" },
];

interface SchoolFormProps {
  existingSchool?: School | null;
  onSubmit: (schoolData: Omit<School, "id" | "created_at">) => Promise<void>;
}

export const SchoolForm: React.FC<SchoolFormProps> = ({ existingSchool, onSubmit }) => {
  const [formData, setFormData] = useState<SchoolInput>(
    existingSchool || { name: "", address: "" }
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = !!existingSchool;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      setError("Name and address are required.");
      return;
    }
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (err) {
      setError(`Submission failed. ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold text-black">{isEditing ? "Edit School" : "Create School"}</h2>
      {fields.map(({ name, label, type, required }) => (
        <div key={name}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={type}
            id={name}
            name={name}
            value={formData[name as keyof SchoolInput] || ""}
            onChange={handleChange}
            required={required}
            className="w-full mt-1 p-2 border rounded text-black bg-slate-100"
            autoComplete="true"
          />
        </div>
      ))}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
      >
        {loading ? "Saving..." : isEditing ? "Update School" : "Create School"}
      </button>
    </form>
  );
};
