
import { supabase } from "../supabase";
import { UserProfile } from "../../types/user";

// CREATE a user
export const createUser = async (user: Omit<UserProfile, "id">): Promise<void> => {
  const { error } = await supabase.from("users").insert([user]);
  if (error) throw error;
};

// READ all users by schoolId (optional filter)
export const getUsers = async (schoolId?: string): Promise<UserProfile[]> => {
  let query = supabase.from("users").select("*");
  if (schoolId) query = query.eq("school_id", schoolId);

  const { data, error } = await query;
  if (error) throw error;
  return data as UserProfile[];
};

// UPDATE a user
export const updateUser = async (id: string, user: Partial<UserProfile>): Promise<void> => {
  const { error } = await supabase.from("users").update(user).eq("id", id);
  if (error) throw error;
};

// DELETE a user
export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
};