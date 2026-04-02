// src/types/student_renewal.ts - UPDATED VERSION

export type RenewalStatus =
  | "active"
  | "quit"
  | "renewed"
  | "expired"
  | "expiring_soon"
  | "grace_period";

export interface Renewal {
  renewal_id: string;
  student_id: string;
  duration_months: number;
  payment_date: string; // ISO date string
  expiration_date: string; // ISO date string
  amount_due: number;
  amount_paid: number;
  number_of_payments: number;
  number_of_classes: number;
  paid_to: string;
  status?: RenewalStatus; // Optional for backward compatibility
  resolved_at?: string; // ISO timestamp when renewal was resolved
  resolution_notes?: string; // Notes about why/how it was resolved
  created_at: string;
  updated_at: string;
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
  // joined from payments, computed client-side
  payments?: RenewalPayment[];
  total_due?: number; // sum of payment amount_due
  total_paid?: number; // sum of payment amount_paid
  balance?: number; // total_due - total_paid
}

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

// Split the status types
export type DbRenewalStatus = "active" | "expired" | "renewed" | "quit";
export type UiRenewalStatus = DbRenewalStatus | "expiring_soon" | "grace_period";

export interface CreateRenewalRequest {
  student_id: string;
  duration_months: number;
  payment_date: string;
  expiration_date: string;
  amount_due: number;
  amount_paid: number;
  number_of_payments: number;
  number_of_classes: number;
  paid_to: string;
  status?: RenewalStatus; // Defaults to 'active' if not provided
}

export interface UpdateRenewalRequest {
  duration_months?: number;
  payment_date?: string;
  expiration_date?: string;
  amount_due?: number;
  amount_paid?: number;
  number_of_payments?: number;
  number_of_classes?: number;
  paid_to?: string;
  status?: RenewalStatus;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface RenewalFormData {
  student_id: string;
  duration_months: string;
  payment_date: string;
  expiration_date: string;
  amount_due: string;
  amount_paid: string;
  number_of_payments: string;
  number_of_classes: string;
  paid_to: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RenewalFormField {
  name: keyof RenewalFormData;
  label: string;
  type: string;
  step?: string;
  placeholder?: string;
  required?: boolean;
}

export interface StatusConfig {
  color: string;
  bgColor: string;
  icon: string;
  text: string;
}

export interface CategorizedRenewals {
  expired: Renewal[];
  active: Renewal[];
  paid: Renewal[];
}

export interface RenewalCategoryProps {
  title: string;
  icon: string;
  renewals: Renewal[];
  borderColor: string;
  children: React.ReactNode;
}

export interface CreateRenewalFormProps {
  onSubmit: (data: CreateRenewalRequest) => Promise<void>;
  onCancel: () => void;
}

export interface ExpiringRenewal extends Renewal {
  daysOverdue: number;
  status: "expired" | "expiring_soon" | "grace_period";
  statusMessage: string;
  priority: number;
}

export interface RenewalCardProps {
  renewal: Renewal | ExpiringRenewal;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
  onResolveAsQuit?: (id: string) => void;
  onResolveWithNext?: (renewal: Renewal) => void;
  statusMessage?: string;
}

export interface RenewalResolution {
  renewal_id: string;
  action: "quit" | "renew";
  resolved_at: string;
  notes?: string;
}

// Renewal filter options for queries
export interface RenewalFilters {
  student_id?: string;
  status?: RenewalStatus | RenewalStatus[];
  expiring_within_days?: number;
  payment_status?: "paid" | "unpaid" | "partial";
  date_range?: {
    start: string;
    end: string;
  };
}

// Renewal statistics for dashboard
export interface RenewalStats {
  total: number;
  active: number;
  expired: number;
  expiring_soon: number;
  grace_period: number;
  quit: number;
  renewed: number;
  total_revenue: number;
  outstanding_balance: number;
}
