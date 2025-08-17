import { CreateRenewalRequest, Renewal } from "../../types/student_renewal";
import { supabase } from "../supabase";

// CREATE a student renewal
export const createStudentRenewal = async (renewal: CreateRenewalRequest): Promise<void> => {
  const { error } = await supabase.from("student_renewals").insert([renewal]);
  if (error) throw error;
};

// READ all student renewals by student_id
export const getStudentRenewals = async (studentId?: string): Promise<Renewal[]> => {
  let query = supabase.from("student_renewals").select("*");
  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as Renewal[];
};

// READ a single student renewal by ID
export const getStudentRenewalById = async (renewalId: string): Promise<Renewal> => {
  const { data, error } = await supabase
    .from("student_renewals")
    .select("*")
    .eq("renewal_id", renewalId)
    .single();

  if (error) throw error;
  console.log("calling get Student by ID");
  return data as Renewal;
};

// READ expiring renewals
export const getExpiringRenewals = async (daysFromNow: number = 30): Promise<Renewal[]> => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysFromNow);

  const { data, error } = await supabase
    .from("student_renewals")
    .select("*")
    .lte("expiration_date", futureDate.toISOString().split("T")[0])
    .gte("expiration_date", new Date().toISOString().split("T")[0])
    .order("expiration_date", { ascending: true });

  if (error) throw error;
  return data as Renewal[];
};

// UPDATE a student renewal
export const updateStudentRenewal = async (
  renewalId: string,
  renewal: Partial<Renewal>
): Promise<void> => {
  const { error } = await supabase
    .from("student_renewals")
    .update(renewal)
    .eq("renewal_id", renewalId);
  console.log("updateStudentRenewal: ", renewal, " " , renewalId);
  if (error) throw error;
};

// DELETE a student renewal
export const deleteStudentRenewal = async (renewalId: string): Promise<void> => {
  const { error } = await supabase.from("student_renewals").delete().eq("renewal_id", renewalId);
  if (error) throw error;
};
