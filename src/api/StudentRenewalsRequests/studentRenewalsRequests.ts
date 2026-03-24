import { CreateRenewalRequest, Renewal } from "../../types/student_renewal";
import { supabase } from "../supabase";

export const createStudentRenewal = async (renewal: CreateRenewalRequest): Promise<void> => {
  const { error } = await supabase.from("student_renewals").insert([renewal]);
  if (error) throw error;
};

export const getStudentRenewals = async (studentId?: string): Promise<Renewal[]> => {
  let query = supabase
    .from("student_renewals")
    .select("*")
    .order("created_at", { ascending: false });

  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query;
  if (error) throw error;
  return data as Renewal[];
};

export const getStudentRenewalById = async (renewalId: string): Promise<Renewal> => {
  const { data, error } = await supabase
    .from("student_renewals")
    .select("*")
    .eq("renewal_id", renewalId)
    .single();

  if (error) throw error;
  return data as Renewal;
};

export const getExpiringRenewals = async (daysFromNow: number = 30): Promise<Renewal[]> => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);

  const { data, error } = await supabase
    .from("student_renewals")
    .select("*")
    .lte("expiration_date", futureDate.toISOString().split("T")[0])
    .gte("expiration_date", new Date().toISOString().split("T")[0])
    .eq("status", "active")
    .order("expiration_date", { ascending: true });

  if (error) throw error;
  return data as Renewal[];
};

export const updateStudentRenewal = async (
  renewalId: string,
  renewal: Partial<Renewal>,
): Promise<void> => {
  const { error } = await supabase
    .from("student_renewals")
    .update(renewal)
    .eq("renewal_id", renewalId);

  if (error) throw error;
};

export const deleteStudentRenewal = async (renewalId: string): Promise<void> => {
  const { error } = await supabase.from("student_renewals").delete().eq("renewal_id", renewalId);

  if (error) throw error;
};
