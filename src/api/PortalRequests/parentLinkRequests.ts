import { supabase } from "../supabase";
import { UserProfile } from "../../types/user";

export interface ParentLink {
  id: string;
  parent_id: string;
  student_id: string;
  school_id: string;
  created_at: string;
  parent?: UserProfile;
}

// Get all parent links for a specific student
export async function getParentLinksForStudent(studentId: string): Promise<ParentLink[]> {
  const { data, error } = await supabase
    .from("parent_students")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Look up a user by email to find a parent account
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Link a parent to a student
export async function linkParentToStudent(
  parentId: string,
  studentId: string,
  schoolId: string,
): Promise<void> {
  const { error } = await supabase.from("parent_students").insert({
    parent_id: parentId,
    student_id: studentId,
    school_id: schoolId,
  });

  if (error) throw error;
}

// Unlink a parent from a student
export async function unlinkParentFromStudent(linkId: string): Promise<void> {
  const { error } = await supabase
    .from("parent_students")
    .delete()
    .eq("id", linkId);

  if (error) throw error;
}

// Get all students linked to a parent
export async function getStudentsForParent(parentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("parent_students")
    .select("student_id")
    .eq("parent_id", parentId);

  if (error) throw error;
  return (data ?? []).map((r) => r.student_id);
}
