import { useState } from "react";
import { SchoolForm } from "./SchoolForm";
import { School } from "../../../../types/school";
import { useSchool } from "../../../../context/SchoolContext";
import { School as SchoolIcon } from "lucide-react";

export const SchoolManagement = () => {
  const { school, loading, updateSchool, createSchool, deleteSchool } = useSchool();
  const [editing, setEditing] = useState(false);

  const handleDelete = async () => {
    if (!school) return;
    await deleteSchool(school.id);
  };

  const handleUpdateOrCreate = async (formData: Omit<School, "id" | "created_at">) => {
    if (school?.id) {
      await updateSchool(school.id, formData);
    } else {
      await createSchool(formData);
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!school && !editing) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <SchoolIcon size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No school set up yet</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-6">
          Create your school profile to get started. You'll be able to add students and manage
          everything from here.
        </p>
        <button
          onClick={() => setEditing(true)}
          className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Create School Profile
        </button>
      </div>
    );
  }

  if (editing) {
    return <SchoolForm existingSchool={school} onSubmit={handleUpdateOrCreate} />;
  }

  return (
    <div className="bg-white text-black rounded shadow p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Your School</h2>
      <p>
        <strong>Name:</strong> {school!.name}
      </p>
      <p>
        <strong>Address:</strong> {school!.address}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
