import { supabase } from "../supabase";
import {
  Class,
  ClassRow,
  ClassSession,
  ClassWithSessions,
  CreateClassPayload,
  CreateSessionRequest,
  UpdateClassRequest,
  UpdateSessionRequest,
} from "../../types/classes";

export async function getClassById(classId: string): Promise<Class> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("class_id", classId)
    .single();

  if (error) throw error;
  return data;
}

export async function getClassesWithSessions(schoolId: string): Promise<ClassWithSessions[]> {
  const { data: classes, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("class_name");

  if (classError) throw classError;

  const classesWithSessions = await Promise.all(
    (classes || []).map(async (cls) => {
      const { data: sessions, error: sessionError } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("class_id", cls.class_id)
        .order("day_of_week");

      if (sessionError) throw sessionError;

      return {
        ...cls,
        sessions: sessions || [],
      };
    }),
  );

  return classesWithSessions;
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

export async function getSessions(classId: string): Promise<ClassSession[]> {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("class_id", classId)
    .order("day_of_week");

  if (error) throw error;
  return data || [];
}

export async function getSessionById(sessionId: string): Promise<ClassSession> {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function createSession(sessionData: CreateSessionRequest): Promise<ClassSession> {
  const { data, error } = await supabase
    .from("class_sessions")
    .insert(sessionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSession(
  sessionId: string,
  updates: UpdateSessionRequest,
): Promise<ClassSession> {
  const { data, error } = await supabase
    .from("class_sessions")
    .update(updates)
    .eq("session_id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from("class_sessions").delete().eq("session_id", sessionId);

  if (error) throw error;
}

export async function getClasses(schoolId: string): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("day_of_week")
    .order("start_time");
  if (error) throw error;
  return data ?? [];
}

export async function createClass(payload: CreateClassPayload): Promise<ClassRow> {
  const { data, error } = await supabase.from("classes").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClass(classId: string): Promise<void> {
  const { error } = await supabase.from("classes").delete().eq("class_id", classId);
  if (error) throw error;
}
