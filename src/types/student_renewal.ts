// Core renewal interface with all fields
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
  created_at: string;
  updated_at: string;
}

// For creating new renewals (omits auto-generated fields)
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
}

// For updating existing renewals (all fields optional except ID)
export interface UpdateRenewalRequest {
  duration_months?: number;
  payment_date?: string;
  expiration_date?: string;
  amount_due?: number;
  amount_paid?: number;
  number_of_payments?: number;
  number_of_classes?: number;
  paid_to?: string;
}

// Form data interface (string values for form inputs)
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

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Paginated response interface
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

// UI-related interfaces
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

// Component props interfaces
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
  renewal_id: number;
  action: "quit" | "renew";
  resolved_at: string;
  notes?: string;
}
