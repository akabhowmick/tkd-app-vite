import { supabase } from "../supabase";

export const signUpUserSupabase = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signInUserSupabase = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  return { data, error };
};

export const signOutUserSupabase = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const updateUserSupabase = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: password,
  });
  return { data, error };
};
