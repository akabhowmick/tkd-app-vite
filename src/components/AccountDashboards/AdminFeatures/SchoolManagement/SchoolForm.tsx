import { useState } from "react";
import { School } from "../../../../types/user";
import { supabase } from "../../../../api/supabase";
import { useAuth } from "../../../../context/AuthContext";

interface Props {
  existingSchool?: School;
  onSuccess: () => void;
}

export const SchoolForm: React.FC<Props> = ({ existingSchool, onSuccess }) => {
  const { user } = useAuth();
  const [name, setName] = useState(existingSchool?.name || "");
  const [address, setAddress] = useState(existingSchool?.address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user) return;

    try {
      if (existingSchool) {
        const { error } = await supabase
          .from("schools")
          .update({ name, address })
          .eq("id", existingSchool.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("schools").insert({
          name,
          address,
          admin_id: user.id,
        });

        if (error) throw error;
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
      className="bg-white text-black p-6 rounded shadow max-w-md mx-auto space-y-4"
    >
      <h2 className="text-2xl font-bold mb-2">
        {existingSchool ? "Edit School" : "Create School"}
      </h2>

      <div>
        <label className="block mb-1">School Name</label>
        <input
          type="text"
          className="w-full p-2 border bg-slate-100 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-300"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block mb-1">Address</label>
        <input
          type="text"
          className="w-full p-2 border bg-slate-100 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-300"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-700 text-white py-2 px-4 rounded hover:bg-red-800 transition"
      >
        {loading ? "Saving..." : existingSchool ? "Update School" : "Create School"}
      </button>
    </form>
  );
};
