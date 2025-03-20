import { supabase } from "../supabase";


// Define the user type
export interface User {
  id: string;
  name: string;
  phone: string;
  schoolId: string;
  userType: "Student" | "Instructor" | "Parent" | "Admin"; 
}

// ✅ Create a new user
export const createUser = async (userData: Omit<User, "id">): Promise<User | null> => {
  const { data, error } = await supabase.from("users").insert([userData]).select().single();

  if (error) {
    console.error("Error creating user:", error);
    return null;
  }
  return data;
};

// ✅ Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }
  return data;
};

// ✅ Update user profile
export const updateUser = async (userId: string, updatedData: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase.from("users").update(updatedData).eq("id", userId).select().single();

  if (error) {
    console.error("Error updating user:", error);
    return null;
  }
  return data;
};

// ✅ Delete user by ID
export const deleteUser = async (userId: string): Promise<boolean> => {
  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    console.error("Error deleting user:", error);
    return false;
  }
  return true;
};
