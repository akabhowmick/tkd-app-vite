import { supabase } from "../supabase";

export interface AttendanceRecord {
  id?: string;
  student_id: string;
  status: "present" | "absent";
  school_id: string;
  date: string; //
}

// TODO 
// make an attendance table 
export const createAttendance = async (records: AttendanceRecord[]) => {
  const { data, error } = await supabase.from("attendance").upsert(records);
  return { data, error };
};

export const getAttendanceByDate = async (
  schoolId: string,
  date: string
): Promise<{ data: AttendanceRecord[] | null; error: unknown }> => {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("school_id", schoolId)
    .eq("date", date);

  return { data: data as AttendanceRecord[] | null, error };
};

export async function updateAttendance(id: string, status: "present" | "absent") {
  const { data, error } = await supabase.from("attendance").update({ status }).eq("id", id);

  return { data, error };
}

export async function deleteAttendance(id: string) {
  const { error } = await supabase.from("attendance").delete().eq("id", id);
  return { error };
}
