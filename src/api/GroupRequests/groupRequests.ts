import { supabase } from "../supabase";
import { StudentGroup } from "../../types/groups";

export async function getSchoolGroups(schoolId: string): Promise<StudentGroup[]> {
  const { data, error } = await supabase
    .from("student_groups")
    .select("*")
    .eq("school_id", schoolId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createGroup(schoolId: string, name: string): Promise<StudentGroup> {
  const { data, error } = await supabase
    .from("student_groups")
    .insert({ school_id: schoolId, name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return data as StudentGroup;
}

export async function updateGroup(groupId: string, name: string): Promise<StudentGroup> {
  const { data, error } = await supabase
    .from("student_groups")
    .update({ name: name.trim() })
    .eq("id", groupId)
    .select()
    .single();
  if (error) throw error;
  return data as StudentGroup;
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from("student_groups").delete().eq("id", groupId);
  if (error) throw error;
}

export async function getStudentGroups(studentId: string): Promise<StudentGroup[]> {
  const { data, error } = await supabase
    .from("student_group_members")
    .select("group:student_groups(*)")
    .eq("student_id", studentId);
  if (error) throw error;
  return (data ?? []).map((row: { group: StudentGroup }) => row.group).filter(Boolean);
}

export async function setStudentGroups(studentId: string, groupIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from("student_group_members")
    .delete()
    .eq("student_id", studentId);
  if (deleteError) throw deleteError;

  if (groupIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("student_group_members")
    .insert(groupIds.map((group_id) => ({ group_id, student_id: studentId })));
  if (insertError) throw insertError;
}

export async function getAllGroupMembersForSchool(
  schoolId: string,
): Promise<{ student_id: string; group_id: string; group_name: string }[]> {
  const { data, error } = await supabase
    .from("student_group_members")
    .select("student_id, group_id, group:student_groups!inner(name, school_id)")
    .eq("group.school_id", schoolId);
  if (error) throw error;
  return (data ?? []).map((row: { student_id: string; group_id: string; group: { name: string } }) => ({
    student_id: row.student_id,
    group_id: row.group_id,
    group_name: row.group?.name ?? "",
  }));
}
