import { AttendanceRecord, AttendanceRecordInsert } from "../../types/attendance";
import { supabase } from "../supabase";


export const createAttendance = async (records: AttendanceRecordInsert[]) => {
  const { data, error } = await supabase.from("attendance_records").upsert(records);
  return { data, error }; 
};

export const getAttendanceByDate = async (
  schoolId: string,
  date: string
): Promise<{ data: AttendanceRecord[] | null; error: unknown }> => {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("school_id", schoolId)
    .eq("date", date);

  return { data: data as AttendanceRecord[] | null, error };
};

export async function updateAttendance(id: string, status: "present" | "absent") {
  const { data, error } = await supabase.from("attendance_records").update({ status }).eq("id", id);

  return { data, error };
}

export async function deleteAttendance(id: string) {
  const { error } = await supabase.from("attendance_records").delete().eq("id", id);
  return { error };
}
