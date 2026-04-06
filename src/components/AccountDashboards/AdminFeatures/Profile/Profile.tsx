import { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { supabase } from "../../../../api/supabase";

const userTypes = ["admin", "instructor", "parent", "student"];

export const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    school_id: "",
    role: "",
  });

  const inputFields = [
    { name: "name", label: "Name", type: "text" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "school_id", label: "School ID", type: "text" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("users")
        .select("name, phone, school_id, role") // fixed: was schoolId, userType
        .eq("id", user.id)
        .single();

      if (error) console.error("Error fetching profile:", error);
      else if (data) setProfile(data);
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("users").update(profile).eq("id", user.id);

    if (error) console.error("Error updating profile:", error);
    else alert("Profile updated successfully!");
  };

  return (
    <div className="max-w-lg mx-auto text-black p-6">
      <h2 className="text-2xl font-bold text-center mb-6">User Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {inputFields.map(({ name, label, type }) => (
          <div key={name}>
            <label className="block font-semibold">{label}</label>
            <input
              type={type}
              name={name}
              value={profile[name as keyof typeof profile]}
              onChange={handleChange}
              className="w-full p-2 rounded-xl bg-slate-100 text-black"
              required
            />
          </div>
        ))}

        <div>
          <label className="block font-semibold">Role</label>
          <select
            name="role"
            value={profile.role}
            onChange={handleChange}
            className="w-full p-2 rounded-xl bg-slate-100 text-black"
            required
          >
            <option value="">Select Role</option>
            {userTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-red-900 text-slate-100 font-bold p-2 rounded-xl hover:bg-gray-200"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};
