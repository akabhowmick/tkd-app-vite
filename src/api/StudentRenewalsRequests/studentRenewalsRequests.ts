import { CreateStudentRenewalRequest, StudentRenewal } from "../../types/student_renewal";
import { supabase } from "../supabase";

// CREATE a student renewal
export const createStudentRenewal = async (renewal: CreateStudentRenewalRequest): Promise<void> => {
  const { error } = await supabase.from("student_renewals").insert([renewal]);
  if (error) throw error;
};

// READ all student renewals by student_id
export const getStudentRenewals = async (studentId?: number): Promise<StudentRenewal[]> => {
  let query = supabase.from("student_renewals").select("*");
  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as StudentRenewal[];
};

// READ a single student renewal by ID
export const getStudentRenewalById = async (renewalId: number): Promise<StudentRenewal> => {
  const { data, error } = await supabase
    .from("student_renewals")
    .select("*")
    .eq("renewal_id", renewalId)
    .single();

  if (error) throw error;
  return data as StudentRenewal;
};

// READ expiring renewals
export const getExpiringRenewals = async (daysFromNow: number = 30): Promise<StudentRenewal[]> => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);

  const { data, error } = await supabase
    .from("student_renewals")
    .select("*")
    .lte("expiration_date", futureDate.toISOString().split("T")[0])
    .gte("expiration_date", new Date().toISOString().split("T")[0])
    .order("expiration_date", { ascending: true });

  if (error) throw error;
  return data as StudentRenewal[];
};

// UPDATE a student renewal
export const updateStudentRenewal = async (
  renewalId: number,
  renewal: Partial<StudentRenewal>
): Promise<void> => {
  const { error } = await supabase
    .from("student_renewals")
    .update(renewal)
    .eq("renewal_id", renewalId);

  if (error) throw error;
};

// DELETE a student renewal
export const deleteStudentRenewal = async (renewalId: number): Promise<void> => {
  const { error } = await supabase.from("student_renewals").delete().eq("renewal_id", renewalId);
  if (error) throw error;
};
