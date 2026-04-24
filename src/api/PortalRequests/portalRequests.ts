import { supabase } from "../supabase";
import { Student } from "../../types/user";
import { AttendanceRecord } from "../../types/attendance";
import { RenewalPeriod } from "../../types/student_renewal";
import { PromotionWithRanks } from "../../types/belts";

// ── Parent: fetch linked student IDs
export async function getLinkedStudentIds(parentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("parent_students")
    .select("student_id")
    .eq("parent_id", parentId);

  if (error) throw error;
  return (data ?? []).map((r) => r.student_id);
}

// ── Student / Parent: attendance history for a student
export async function getStudentAttendance(
  studentId: string,
  limit = 60,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AttendanceRecord[];
}

// ── Student / Parent: active renewal for a student
export async function getStudentRenewal(studentId: string): Promise<RenewalPeriod | null> {
  const { data, error } = await supabase
    .from("renewal_periods")
    .select("*, payments:renewal_payments(*)")
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const payments = (data.payments ?? []).sort(
    (a: { installment_number: number }, b: { installment_number: number }) =>
      a.installment_number - b.installment_number,
  );
  const total_due = payments.reduce((s: number, p: { amount_due: number }) => s + p.amount_due, 0);
  const total_paid = payments.reduce(
    (s: number, p: { amount_paid: number }) => s + p.amount_paid,
    0,
  );
  return { ...data, payments, total_due, total_paid, balance: total_due - total_paid };
}

// ── Student / Parent: belt promotion history
export async function getStudentBeltHistory(studentId: string): Promise<PromotionWithRanks[]> {
  const { data, error } = await supabase
    .from("belt_promotions")
    .select(
      `
      *,
      from_rank:belt_ranks!belt_promotions_from_rank_id_fkey(*),
      to_rank:belt_ranks!belt_promotions_to_rank_id_fkey(*)
    `,
    )
    .eq("student_id", studentId)
    .order("promotion_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// ── Instructor: fetch students for their school
export async function getInstructorStudents(schoolId: string): Promise<Student[]> {
  const { data, error } = await supabase.from("students").select("*").eq("school_id", schoolId);

  if (error) throw error;
  return (data ?? []).sort((a, b) => {
    const last = (n: string) => n.trim().split(" ").pop() ?? "";
    return last(a.name).localeCompare(last(b.name));
  });
}
