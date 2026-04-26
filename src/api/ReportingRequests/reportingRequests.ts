import { supabase } from "../supabase";

// ── Attendance trend: present/absent counts per week for last N weeks
export interface WeeklyAttendance {
  week: string; // e.g. "Aug 12"
  present: number;
  absent: number;
}

export async function getWeeklyAttendance(
  schoolId: string,
  weeks = 12,
): Promise<WeeklyAttendance[]> {
  const from = new Date();
  from.setDate(from.getDate() - weeks * 7);
  const fromStr = from.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance_records")
    .select("date, status")
    .eq("school_id", schoolId)
    .gte("date", fromStr)
    .order("date", { ascending: true });

  if (error) throw error;

  // Group by ISO week
  const weekMap: Record<string, { present: number; absent: number }> = {};

  (data ?? []).forEach((row: { date: string; status: string }) => {
    const d = new Date(row.date + "T12:00:00");
    // Get Monday of that week
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const key = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (!weekMap[key]) weekMap[key] = { present: 0, absent: 0 };
    if (row.status === "present") weekMap[key].present += 1;
    else weekMap[key].absent += 1;
  });

  return Object.entries(weekMap).map(([week, counts]) => ({ week, ...counts }));
}

// ── Revenue by category
export interface CategoryRevenue {
  category: string;
  total: number;
}

export async function getRevenueByCategory(
  schoolId: string,
): Promise<CategoryRevenue[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("category, amount")
    .eq("school_id", schoolId);

  if (error) throw error;

  const map: Record<string, number> = {};
  (data ?? []).forEach((row: { category: string; amount: number }) => {
    map[row.category] = (map[row.category] ?? 0) + row.amount;
  });

  const LABELS: Record<string, string> = {
    tuition: "Tuition",
    test_fee: "Test Fee",
    demo_fee: "Demo Fee",
    kpop: "K-Pop",
    other: "Other",
  };

  return Object.entries(map)
    .map(([category, total]) => ({
      category: LABELS[category] ?? category,
      total: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total);
}

// ── Revenue by payment type
export interface PaymentTypeRevenue {
  type: string;
  total: number;
  count: number;
}

export async function getRevenueByPaymentType(
  schoolId: string,
): Promise<PaymentTypeRevenue[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("payment_type, amount")
    .eq("school_id", schoolId);

  if (error) throw error;

  const map: Record<string, { total: number; count: number }> = {};
  (data ?? []).forEach((row: { payment_type: string; amount: number }) => {
    if (!map[row.payment_type]) map[row.payment_type] = { total: 0, count: 0 };
    map[row.payment_type].total += row.amount;
    map[row.payment_type].count += 1;
  });

  return Object.entries(map).map(([type, { total, count }]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    total: Math.round(total * 100) / 100,
    count,
  }));
}

// ── Student growth: cumulative student count by month
export interface StudentGrowth {
  month: string;
  total: number;
}

export async function getStudentGrowth(schoolId: string): Promise<StudentGrowth[]> {
  const { data, error } = await supabase
    .from("students")
    .select("created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const monthMap: Record<string, number> = {};
  (data ?? []).forEach((row: { created_at: string }) => {
    const d = new Date(row.created_at);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    monthMap[key] = (monthMap[key] ?? 0) + 1;
  });

  // Build cumulative
  let running = 0;
  return Object.entries(monthMap).map(([month, count]) => {
    running += count;
    return { month, total: running };
  });
}

// ── Expiring renewals summary
export interface ExpiringRenewal {
  student_id: string;
  expiration_date: string;
  daysLeft: number;
  balance: number;
}

export async function getExpiringRenewals(
  schoolId: string,
  withinDays = 30,
): Promise<ExpiringRenewal[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(today.getDate() + withinDays);

  const { data, error } = await supabase
    .from("renewal_periods")
    .select("student_id, expiration_date, payments:renewal_payments(amount_due, amount_paid)")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .not("expiration_date", "is", null)
    .lte("expiration_date", future.toISOString().split("T")[0])
    .gte("expiration_date", today.toISOString().split("T")[0])
    .order("expiration_date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: {
    student_id: string;
    expiration_date: string;
    payments: { amount_due: number; amount_paid: number }[];
  }) => {
    const expiry = new Date(row.expiration_date + "T12:00:00");
    const daysLeft = Math.ceil(
      (expiry.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
    );
    const total_due = row.payments.reduce((s, p) => s + p.amount_due, 0);
    const total_paid = row.payments.reduce((s, p) => s + p.amount_paid, 0);
    return {
      student_id: row.student_id,
      expiration_date: row.expiration_date,
      daysLeft,
      balance: total_due - total_paid,
    };
  });
}
