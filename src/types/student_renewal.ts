export type DbRenewalStatus = "active" | "expired" | "renewed" | "quit";
export type UiRenewalStatus = DbRenewalStatus | "expiring_soon" | "grace_period" | "paid";

// Prevents expiring_soon / grace_period / paid from ever reaching Supabase
export function toDbStatus(status: DbRenewalStatus): DbRenewalStatus {
  return status;
}

// ─────────────────────────────────────────────
// Core data shapes
// ─────────────────────────────────────────────
export interface RenewalPayment {
  payment_id: string;
  period_id: string;
  student_id: string;
  payment_date: string;
  amount_due: number;
  amount_paid: number;
  installment_number: number;
  paid_to: string;
  created_at: string;
}

export interface RenewalPeriod {
  period_id: string;
  student_id: string;
  school_id: string;
  duration_months: number;
  expiration_date: string;
  number_of_classes: number;
  status: DbRenewalStatus;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  payments: RenewalPayment[];
  total_due: number;
  total_paid: number;
  balance: number;
}

export interface RenewalPeriodWithUiStatus extends RenewalPeriod {
  ui_status: UiRenewalStatus;
  days_until_expiration: number; // negative = already expired
  status_message: string;
}

export interface CreateRenewalPeriodRequest {
  student_id: string;
  school_id: string;
  duration_months: number;
  expiration_date: string;
  number_of_classes: number;
}

export interface CreateRenewalPaymentRequest {
  period_id: string;
  student_id: string;
  payment_date: string;
  amount_due: number;
  amount_paid: number;
  installment_number: number;
  paid_to: string;
}

export interface CreateRenewalRequest {
  period: CreateRenewalPeriodRequest;
  payment: Omit<CreateRenewalPaymentRequest, "period_id" | "student_id">;
}

export interface UpdateRenewalPeriodRequest {
  duration_months?: number;
  expiration_date?: string; // was incorrectly typed as number
  number_of_classes?: number;
  status?: DbRenewalStatus;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface GroupedRenewals {
  expiring_soon: RenewalPeriodWithUiStatus[];
  grace_period: RenewalPeriodWithUiStatus[];
  expired: RenewalPeriodWithUiStatus[];
  active: RenewalPeriodWithUiStatus[];
  paid: RenewalPeriodWithUiStatus[];
}

export interface RenewalCardProps {
  period: RenewalPeriodWithUiStatus;
  onMarkPaid: (periodId: string, paymentId: string) => void;
  onDelete: (periodId: string) => void;
  onResolveAsQuit?: (periodId: string) => void;
  onRenew?: (period: RenewalPeriod) => void;
  onAddPayment?: (
    periodId: string,
    req: Omit<CreateRenewalPaymentRequest, "period_id" | "student_id">,
  ) => void;
}

export interface RenewalCategoryProps {
  title: string;
  icon: string;
  periods: RenewalPeriodWithUiStatus[];
  borderColor: string;
  children: React.ReactNode;
}

export interface CreateRenewalFormProps {
  onSubmit: (data: CreateRenewalRequest) => Promise<void>;
  onCancel: () => void;
}
