export type DbRenewalStatus = "active" | "expired" | "renewed" | "quit";
export type UiRenewalStatus =
  | DbRenewalStatus
  | "expiring_soon"
  | "grace_period"
  | "paid"
  | "payment_overdue";

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
  /** When the payment is scheduled/expected — set at creation */
  due_date: string | null;
  /** When the payment was actually received — null until paid */
  payment_date: string | null;
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
  /** Null for milestone_based programs */
  duration_months: number | null;
  /** Null for milestone_based programs */
  expiration_date: string | null;
  number_of_classes: number;
  status: DbRenewalStatus;
  /** FK to school_programs — nullable for legacy records */
  program_id: string | null;
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
  /** Null for milestone_based (no expiration) */
  days_until_expiration: number | null;
  status_message: string;
  /** First unpaid installment by installment_number */
  next_unpaid_installment: RenewalPayment | null;
  /** Whether this period is milestone-based (derived from program) */
  is_milestone: boolean;
}

// ─────────────────────────────────────────────
// Installment form shape used during creation
// ─────────────────────────────────────────────

export interface InstallmentInput {
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  paid_to: string;
}

// ─────────────────────────────────────────────
// Request shapes
// ─────────────────────────────────────────────

export interface CreateRenewalPeriodRequest {
  student_id: string;
  school_id: string;
  duration_months: number | null;
  expiration_date: string | null;
  number_of_classes: number;
  program_id: string | null;
}

export interface CreateRenewalPaymentRequest {
  period_id: string;
  student_id: string;
  due_date: string | null;
  payment_date: string | null;
  amount_due: number;
  amount_paid: number;
  installment_number: number;
  paid_to: string;
}

export interface CreateRenewalRequest {
  period: CreateRenewalPeriodRequest;
  installments: Omit<CreateRenewalPaymentRequest, "period_id" | "student_id">[];
}

export interface UpdateRenewalPeriodRequest {
  duration_months?: number | null;
  expiration_date?: string | null;
  number_of_classes?: number;
  status?: DbRenewalStatus;
  program_id?: string | null;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface UpdateRenewalPaymentRequest {
  due_date?: string | null;
  payment_date?: string | null;
  amount_paid?: number;
  paid_to?: string;
}

// ─────────────────────────────────────────────
// Grouped renewal buckets
// ─────────────────────────────────────────────

export interface GroupedRenewals {
  payment_overdue: RenewalPeriodWithUiStatus[];
  expiring_soon: RenewalPeriodWithUiStatus[];
  grace_period: RenewalPeriodWithUiStatus[];
  expired: RenewalPeriodWithUiStatus[];
  active: RenewalPeriodWithUiStatus[];
  paid: RenewalPeriodWithUiStatus[];
}

// ─────────────────────────────────────────────
// Component prop shapes
// ─────────────────────────────────────────────

export interface RenewalCardProps {
  period: RenewalPeriodWithUiStatus;
  programName?: string;
  onMarkInstallmentPaid: (
    periodId: string,
    paymentId: string,
    actualPaymentDate: string,
    amountPaid: number,
    paidTo: string,
  ) => Promise<void>;
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
