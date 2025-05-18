// api/SchoolRequests.ts
import { School } from "../../types/user";
import { supabase } from "../supabase"; // adjust path to your Supabase client


// CREATE
export const createSchool = async (school: Omit<School, "id" | "created_at">) => {
  const { data, error } = await supabase
    .from("schools")
    .insert(school)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// READ ALL
export const getAllSchools = async (): Promise<School[]> => {
  const { data, error } = await supabase.from("schools").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

// READ ONE
export const getSchoolById = async (id: string): Promise<School | null> => {
  const { data, error } = await supabase.from("schools").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
};

// UPDATE
export const updateSchool = async (id: string, updatedFields: Partial<Omit<School, "id" | "created_at">>) => {
  const { data, error } = await supabase.from("schools").update(updatedFields).eq("id", id).select().single();
  if (error) throw error;
  return data;
};

// DELETE
export const deleteSchool = async (id: string) => {
  const { error } = await supabase.from("schools").delete().eq("id", id);
  if (error) throw error;
};
