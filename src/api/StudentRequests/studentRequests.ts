import { supabase } from "../supabase";
import { Student } from "../../types/user";

// CREATE a student
export const createStudent = async (student: Omit<Student, "id">): Promise<void> => {
  const { error } = await supabase.from("students").insert([student]);
  if (error) throw error;
};

// READ all students by schoolId
export const getStudents = async (schoolId: string): Promise<Student[]> => {
  let query = supabase.from("students").select("*");
  if (schoolId) query = query.eq("school_id", schoolId);

  const { data, error } = await query;
  if (error) throw error;

  return (data as Student[]).sort((a, b) => {
    const getLastName = (name: string = "") => name.trim().split(" ").pop() ?? "";
    return getLastName(a.name).localeCompare(getLastName(b.name));
  });
};

// UPDATE a student => update the rule afterwards using better backend checks
export const updateStudent = async (id: string, student: Partial<Student>): Promise<void> => {
  const { error } = await supabase.from("students").update(student).eq("id", id);
  if (error) throw error;
};

// DELETE a student => update the rule afterwards using better backend checks
export const deleteStudent = async (id: string): Promise<void> => {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
};
