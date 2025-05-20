import { useEffect, useState } from "react";
import { SchoolForm } from "./SchoolForm";
import { School } from "../../../../types/school";
import { supabase } from "../../../../api/supabase";
import { useAuth } from "../../../../context/AuthContext";

export const SchoolManagement = () => {
  const { user } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const fetchSchool = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("admin_id", user.id)
      .single();

    if (!error) {
      setSchool(data);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!school) return;
    const { error } = await supabase.from("schools").delete().eq("id", school.id);
    if (!error) {
      setSchool(null);
    }
  };

  const handleUpdateOrCreate = async (formData: Omit<School, "id" | "created_at">) => {
    if (school?.id) {
      // Update
      await supabase.from("schools").update(formData).eq("id", school.id);
    } else {
      // Create
      await supabase.from("schools").insert([{ ...formData, admin_id: user?.id }]);
    }

    setEditing(false);
    fetchSchool();
  };

  useEffect(() => {
    fetchSchool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <p className="text-black">Loading...</p>;

  if (!school || editing) {
    return <SchoolForm existingSchool={school} onSubmit={handleUpdateOrCreate} />;
  }

  return (
    <div className="bg-white text-black rounded shadow p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Your School</h2>
      <p>
        <strong>Name:</strong> {school.name}
      </p>
      <p>
        <strong>Address:</strong> {school.address}
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
