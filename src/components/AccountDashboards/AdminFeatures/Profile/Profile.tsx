import { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { supabase } from "../../../../api/supabase";

const userTypes = ["Admin", "Instructor", "Parent", "Student"];

export const Profile = () => {
  const { user } = useAuth(); // Get current authenticated user
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    schoolId: "",
    userType: "",
  });

  // Input fields configuration
  const inputFields = [
    { name: "name", label: "Name", type: "text" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "schoolId", label: "School ID", type: "text" },
  ];

  // Fetch user details from the "users" table
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("users") // Using the existing "users" table
        .select("name, phone, schoolId, userType")
        .eq("id", user.id)
        .single();

      if (error) console.error("Error fetching profile:", error);
      else if (data) setProfile(data);
    };

    fetchProfile();
  }, [user]);

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // Handle form submission (Update user in Supabase)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from("users") // Updating "users" table
      .update(profile)
      .eq("id", user.id);

    if (error) console.error("Error updating profile:", error);
    else alert("Profile updated successfully!");
  };

  return (
    <div className="max-w-lg mx-auto text-black p-6">
      <h2 className="text-2xl font-bold text-center mb-6">User Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dynamically Render Input Fields */}
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

        {/* User Type Dropdown */}
        <div>
          <label className="block font-semibold">User Type</label>
          <select
            name="userType"
            value={profile.userType}
            onChange={handleChange}
            className="w-full p-2 rounded-xl bg-slate-100 text-black"
            required
          >
            <option value="">Select User Type</option>
            {userTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
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
