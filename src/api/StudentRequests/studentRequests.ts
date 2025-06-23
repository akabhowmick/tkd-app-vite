import { supabase } from "../supabase";
import { UserProfile } from "../../types/user";

// CREATE a student
export const createStudent = async (student: Omit<UserProfile, "id">): Promise<void> => {
  const { error } = await supabase.from("students").insert([student]);
  if (error) throw error;
};

// READ all students by schoolId 
export const getStudents = async (schoolId?: string): Promise<UserProfile[]> => {
  let query = supabase.from("students").select("*");
  if (schoolId) query = query.eq("school_id", schoolId);

  const { data, error } = await query;
  if (error) throw error;
  return data as UserProfile[];
};

// UPDATE a student => update the rule afterwards using better backend checks
export const updateStudent = async (id: string, student: Partial<UserProfile>): Promise<void> => {
  const { error } = await supabase.from("students").update(student).eq("id", id);
  if (error) throw error;
};

// DELETE a student => update the rule afterwards using better backend checks
export const deleteStudent = async (id: string): Promise<void> => {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
};
 