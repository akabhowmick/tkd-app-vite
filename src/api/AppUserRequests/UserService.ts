import { UserProfile } from "../../types/user";
import { supabase } from "../supabase";


// Create a new user (e.g., student)
export const createUser = async (user: UserProfile) => {
  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Read all users (or filter by role)
export const getUsers = async (role?: string) => {
  const query = supabase.from('users').select('*');

  if (role) {
    query.eq('role', role);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

// Update a user
export const updateUser = async (id: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a user
export const deleteUser = async (id: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
