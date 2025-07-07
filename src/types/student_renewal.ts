export interface StudentRenewal {
  renewal_id: number;
  student_id: number;
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

export interface CreateStudentRenewalRequest {
  student_id: number;
  duration_months: number;
  payment_date: string;
  expiration_date: string;
  amount_due: number;
  amount_paid: number;
  number_of_payments: number;
  number_of_classes: number;
  paid_to: string;
}

export interface UpdateStudentRenewalRequest {
  duration_months?: number;
  payment_date?: string;
  expiration_date?: string;
  amount_due?: number;
  amount_paid?: number;
  number_of_payments?: number;
  number_of_classes?: number;
  paid_to?: string;
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


export interface Renewal {
  renewal_id: number;
  student_id: number;
  duration_months: number;
  payment_date: string;
  expiration_date: string;
  amount_due: number;
  amount_paid: number;
  number_of_payments: number;
  number_of_classes: number;
  paid_to: string;
}

export interface NewRenewalData {
  student_id: number;
  duration_months: number;
  payment_date: string;
  expiration_date: string;
  amount_due: number;
  amount_paid: number;
  number_of_payments: number;
  number_of_classes: number;
  paid_to: string;
}

export interface FormData {
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

export interface FormField {
  name: keyof FormData;
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


// Props interfaces
export interface CreateRenewalFormProps {
  onSubmit: (data: NewRenewalData) => Promise<void>;
  onCancel: () => void;
}

export interface RenewalCardProps {
  renewal: Renewal;
  onMarkPaid: (renewalId: number) => void;
  onDelete: (renewalId: number) => void;
}