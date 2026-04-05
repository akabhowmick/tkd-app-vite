// Consolidated user API — replaces both AppUserRequests.ts and the old UserService.ts.
// AppUserRequests.ts can be safely deleted; nothing in the app imports from it.

import { supabase } from "../supabase";
import { UserProfile } from "../../types/user";

export const createUser = async (user: Omit<UserProfile, "id" | "created_at">) => {
  const { data, error } = await supabase.from("users").insert(user).select().single();
  if (error) throw error;
  return data;
};

export const getUsers = async (role?: UserProfile["role"]) => {
  let query = supabase.from("users").select("*");
  if (role) query = query.eq("role", role);
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
  return true;
};
