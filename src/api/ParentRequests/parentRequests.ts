import { supabase } from "../supabase";
import { UserProfile } from "../../types/user";

// CREATE a parent
export const createParent = async (parent: Omit<UserProfile, "id">): Promise<void> => {
  const { error } = await supabase.from("parents").insert([parent]);
  if (error) throw error;
};

// READ all parents by schoolId 
export const getParents = async (schoolId?: string): Promise<UserProfile[]> => {
  let query = supabase.from("parents").select("*");
  if (schoolId) query = query.eq("school_id", schoolId);

  const { data, error } = await query;
  if (error) throw error;
  return data as UserProfile[];
};

// UPDATE a parent
export const updateParent = async (id: string, parent: Partial<UserProfile>): Promise<void> => {
  const { error } = await supabase.from("parents").update(parent).eq("id", id);
  if (error) throw error;
};

// DELETE a parent
export const deleteParent = async (id: string): Promise<void> => {
  const { error } = await supabase.from("parents").delete().eq("id", id);
  if (error) throw error;
};
