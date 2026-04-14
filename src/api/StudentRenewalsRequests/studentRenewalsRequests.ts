import { supabase } from "../supabase";
import {
  RenewalPeriod,
  RenewalPayment,
  CreateRenewalPeriodRequest,
  CreateRenewalPaymentRequest,
  UpdateRenewalPeriodRequest,
  DbRenewalStatus,
} from "../../types/student_renewal";

function attachPaymentTotals(
  period: Omit<RenewalPeriod, "total_due" | "total_paid" | "balance"> & {
    payments: RenewalPayment[];
  },
): RenewalPeriod {
  const total_due = period.payments.reduce((sum, p) => sum + p.amount_due, 0);
  const total_paid = period.payments.reduce((sum, p) => sum + p.amount_paid, 0);
  return { ...period, total_due, total_paid, balance: total_due - total_paid };
}

export async function getRenewalPeriods(schoolId: string): Promise<RenewalPeriod[]> {
  const { data, error } = await supabase
    .from("renewal_periods")
    .select(
      `
      *,
      payments:renewal_payments (*)
    `,
    )
    .eq("school_id", schoolId)
    .order("expiration_date", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) =>
    attachPaymentTotals({
      ...row,
      payments: (row.payments ?? []).sort(
        (a: RenewalPayment, b: RenewalPayment) => a.installment_number - b.installment_number,
      ),
    }),
  );
}

export async function getRenewalPeriodById(periodId: string): Promise<RenewalPeriod> {
  const { data, error } = await supabase
    .from("renewal_periods")
    .select(
      `
      *,
      payments:renewal_payments (*)
    `,
    )
    .eq("period_id", periodId)
    .single();

  if (error) throw error;

  return attachPaymentTotals({
    ...data,
    payments: (data.payments ?? []).sort(
      (a: RenewalPayment, b: RenewalPayment) => a.installment_number - b.installment_number,
    ),
  });
}

export async function createRenewalPeriod(req: CreateRenewalPeriodRequest): Promise<RenewalPeriod> {
  const { data, error } = await supabase.from("renewal_periods").insert(req).select().single();

  if (error) throw error;
  return { ...data, payments: [], total_due: 0, total_paid: 0, balance: 0 };
}

export async function createRenewalPayment(
  req: CreateRenewalPaymentRequest,
): Promise<RenewalPayment> {
  const { data, error } = await supabase.from("renewal_payments").insert(req).select().single();

  if (error) throw error;
  return data;
}

export async function updateRenewalPeriod(
  periodId: string,
  updates: UpdateRenewalPeriodRequest,
): Promise<void> {
  const { error } = await supabase
    .from("renewal_periods")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("period_id", periodId);

  if (error) throw error;
}

export async function updateRenewalPayment(
  paymentId: string,
  updates: Partial<Pick<RenewalPayment, "amount_paid" | "paid_to" | "payment_date">>,
): Promise<void> {
  const { error } = await supabase
    .from("renewal_payments")
    .update(updates)
    .eq("payment_id", paymentId);

  if (error) throw error;
}

export async function deleteRenewalPeriod(periodId: string): Promise<void> {
  const { error } = await supabase.from("renewal_periods").delete().eq("period_id", periodId);

  if (error) throw error;
}

export async function deleteRenewalPayment(paymentId: string): Promise<void> {
  const { error } = await supabase.from("renewal_payments").delete().eq("payment_id", paymentId);

  if (error) throw error;
}

export async function resolveAsQuit(periodId: string, notes?: string): Promise<void> {
  const status: DbRenewalStatus = "quit";
  await updateRenewalPeriod(periodId, {
    status,
    resolved_at: new Date().toISOString(),
    resolution_notes: notes ?? "Student quit",
  });
}

export async function resolveWithRenewal(
  oldPeriod: RenewalPeriod,
  newPeriodData: CreateRenewalPeriodRequest,
  firstPayment: Omit<CreateRenewalPaymentRequest, "period_id" | "student_id">,
): Promise<RenewalPeriod> {
  // Mark old period resolved
  const renewedStatus: DbRenewalStatus = "renewed";
  await updateRenewalPeriod(oldPeriod.period_id, {
    status: renewedStatus,
    resolved_at: new Date().toISOString(),
    resolution_notes: `Renewed for ${newPeriodData.duration_months} months`,
  });

  // Create the new period
  const newPeriod = await createRenewalPeriod(newPeriodData);

  // Create its first payment
  await createRenewalPayment({
    ...firstPayment,
    period_id: newPeriod.period_id,
    student_id: newPeriod.student_id,
    installment_number: 1,
  });

  // Return fresh copy with payments attached
  return getRenewalPeriodById(newPeriod.period_id);
}

export async function markInstallmentPaid(
  paymentId: string,
  updates: {
    payment_date: string | null;
    amount_paid: number;
    paid_to: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("renewal_payments")
    .update(updates)
    .eq("payment_id", paymentId);

  if (error) throw error;
}
