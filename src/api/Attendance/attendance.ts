import { supabase } from "../supabase";


export async function createAttendance(records: {
  student_id: string;
  status: "present" | "absent";
  school_id: string;
  date: string; // YYYY-MM-DD
}[]) {
  const { data, error } = await supabase.from("attendance").insert(records);
  return { data, error };
}

export async function getAttendanceByDate(school_id: string, date: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*, users(full_name)")
    .eq("school_id", school_id)
    .eq("date", date);

  return { data, error };
}

export async function updateAttendance(id: string, status: "present" | "absent") {
  const { data, error } = await supabase
    .from("attendance")
    .update({ status })
    .eq("id", id);

  return { data, error };
}

export async function deleteAttendance(id: string) {
  const { error } = await supabase.from("attendance").delete().eq("id", id);
  return { error };
}
