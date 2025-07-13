// api/SchoolRequests.ts
import { School, SchoolInput } from "../../types/school";
import { supabase } from "../supabase"; 


export const createSchool = async (school: SchoolInput) => {
  const { data, error } = await supabase.from("schools").insert(school).select().single();
  if (error) throw error;
  return data as School;
};

export const updateSchool = async (id: string, school: SchoolInput) => {
  const { data, error } = await supabase.from("schools").update(school).eq("id", id).select().single();
  if (error) throw error;
  return data as School;
};

export const deleteSchool = async (id: string) => {
  const { error } = await supabase.from("schools").delete().eq("id", id);
  if (error) throw error;
};

export const getSchoolByAdmin = async (adminId: string) => {
  const { data, error } = await supabase.from("schools").select("*").eq("admin_id", adminId).single();
  if (error){
    console.error(error)
  };
  return data as School;
};
