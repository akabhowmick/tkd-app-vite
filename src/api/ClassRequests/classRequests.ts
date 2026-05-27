import { supabase } from "../supabase";
import {
  Class,
  CreateClassPayload,
  UpdateClassRequest,
} from "../../types/classes";

export async function getClasses(schoolId: string): Promise<Class[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("day_of_week")
    .order("start_time");
  if (error) throw error;
  return data ?? [];
}

export async function getClassById(classId: string): Promise<Class> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("class_id", classId)
    .single();
  if (error) throw error;
  return data;
}

export async function createClass(payload: CreateClassPayload): Promise<Class> {
  const { data, error } = await supabase.from("classes").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateClass(classId: string, updates: UpdateClassRequest): Promise<Class> {
  const { data, error } = await supabase
    .from("classes")
    .update(updates)
    .eq("class_id", classId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClass(classId: string): Promise<void> {
  const { error } = await supabase.from("classes").delete().eq("class_id", classId);
  if (error) throw error;
}
