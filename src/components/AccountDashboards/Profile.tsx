import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../api/supabase";

const userTypes = ["Admin", "Instructor", "Parent", "Student"];

export const Profile = () => {
  const { user } = useAuth(); // Get current authenticated user
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    schoolId: "",
    userType: "",
  });

  // Fetch user profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("users")
        .select("*")
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // const { error } = await supabase
    //   .from("profiles")
    // if (error) console.error("Error updating profile:", error);
    else alert("Profile updated successfully!");
  };

  return (
    <div className="max-w-lg mx-auto text-black p-6 ">
      <h2 className="text-2xl font-bold text-center mb-6">User Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label className="block font-semibold">Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            className="w-full p-2 bg-slate-100 rounded-xl text-black"
            required
          />
        </div>

        {/* Phone Input */}
        <div>
          <label className="block font-semibold">Phone</label>
          <input
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            className="w-full bg-slate-100 p-2 rounded-xl text-black"
            required
          />
        </div>

        {/* School ID Input */}
        <div>
          <label className="block font-semibold">School ID</label>
          <input
            type="text"
            name="schoolId"
            value={profile.schoolId}
            onChange={handleChange}
            className="w-full p-2 bg-slate-100 rounded-xl text-black"
            required
          />
        </div>

        {/* User Type Dropdown */}
        <div>
          <label className="block font-semibold">User Type</label>
          <select
            name="userType"
            value={profile.userType}
            onChange={handleChange}
            className="w-full p-2  bg-slate-100 rounded-xl text-black"
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
          className="w-full bg-red-900 text-white font-bold p-2 rounded-xl hover:bg-gray-200"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};
