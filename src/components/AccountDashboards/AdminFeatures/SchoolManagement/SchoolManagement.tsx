import { useEffect, useState } from "react";
import { SchoolForm } from "./SchoolForm";
import { School } from "../../../../types/school";
import { supabase } from "../../../../api/supabase";
import { useAuth } from "../../../../context/AuthContext";
import { useSchool } from "../../../../context/SchoolContext";
import { School as SchoolIcon } from "lucide-react";

export const SchoolManagement = () => {
  const { user } = useAuth();
  const { setSchoolId } = useSchool();
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const fetchSchool = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("schools").select("*").eq("admin_id", user.id);
    if (!error && data) {
      setCurrentSchool(data[0] ?? null);
      if (data[0]) setSchoolId(data[0].id);
    } else {
      console.error(error);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!currentSchool) return;
    const { error } = await supabase.from("schools").delete().eq("id", currentSchool.id);
    if (!error) setCurrentSchool(null);
  };

  const handleUpdateOrCreate = async (formData: Omit<School, "id" | "created_at">) => {
    if (currentSchool?.id) {
      await supabase.from("schools").update(formData).eq("id", currentSchool.id);
    } else {
      const { error } = await supabase
        .from("schools")
        .insert([{ ...formData, admin_id: user?.id }]);
      if (error) console.error(error);
    }
    setEditing(false);
    fetchSchool();
  };

  useEffect(() => {
    fetchSchool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Empty state — fresh signup with no school yet
  if (!currentSchool && !editing) {
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
    return <SchoolForm existingSchool={currentSchool} onSubmit={handleUpdateOrCreate} />;
  }

  return (
    <div className="bg-white text-black rounded shadow p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Your School</h2>
      <p>
        <strong>Name:</strong> {currentSchool!.name}
      </p>
      <p>
        <strong>Address:</strong> {currentSchool!.address}
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
