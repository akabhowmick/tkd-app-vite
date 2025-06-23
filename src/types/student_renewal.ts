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