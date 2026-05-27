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
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-300 overflow-hidden">
        {/* Header banner */}
        <div className="bg-red-700 h-24 w-full" />

        {/* Profile body */}
        <div className="px-8 pb-8 -mt-8">
          <div className="flex items-end justify-between mb-6">
            <div className="h-16 w-16 rounded-xl bg-white shadow border border-gray-200 flex items-center justify-center">
              <SchoolIcon size={28} className="text-red-700" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">{school!.name}</h2>

          <div className="mt-6 border-t border-gray-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Address</p>
              <p className="text-sm text-gray-800">{school!.address || "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
