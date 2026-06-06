import { supabase } from "../supabase";
import {
  Class,
  ClassEnrollment,
  ClassSession,
  CreateClassPayload,
  CreateSessionPayload,
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

export async function getStudentEnrollments(
  studentId: string,
): Promise<(ClassEnrollment & { class: Class })[]> {
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("*, class:classes(*)")
    .eq("student_id", studentId)
    .order("enrolled_at");
  if (error) throw error;
  return (data ?? []) as (ClassEnrollment & { class: Class })[];
}

export async function enrollStudentInClass(
  classId: string,
  studentId: string,
  schoolId: string,
): Promise<ClassEnrollment> {
  const { data, error } = await supabase
    .from("class_enrollments")
    .insert({ class_id: classId, student_id: studentId, school_id: schoolId })
    .select()
    .single();
  if (error) throw error;
  return data as ClassEnrollment;
}

export async function unenrollStudentFromClass(enrollmentId: string): Promise<void> {
  const { error } = await supabase
    .from("class_enrollments")
    .delete()
    .eq("id", enrollmentId);
  if (error) throw error;
}

export async function getClassesWithSessions(
  schoolId: string,
): Promise<(Class & { sessions: ClassSession[] })[]> {
  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("class_name");
  if (classError) throw classError;
  const { data: sessions, error: sessionError } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("school_id", schoolId)
    .order("day_of_week");
  if (sessionError) throw sessionError;
  const sessionsByClass = ((sessions ?? []) as ClassSession[]).reduce<Record<string, ClassSession[]>>(
    (acc, s) => {
      (acc[s.class_id] ??= []).push(s);
      return acc;
    },
    {},
  );
  return ((classes ?? []) as Class[]).map((c) => ({
    ...c,
    sessions: sessionsByClass[c.class_id] ?? [],
  }));
}

export async function createSession(payload: CreateSessionPayload): Promise<ClassSession> {
  const { data, error } = await supabase
    .from("class_sessions")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as ClassSession;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("class_sessions")
    .delete()
    .eq("session_id", sessionId);
  if (error) throw error;
}
