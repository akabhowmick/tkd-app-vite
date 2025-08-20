import { FaCreditCard, FaMoneyBill, FaMoneyCheck } from "react-icons/fa";
import { IconType } from "react-icons/lib";

export type PaymentType = 'cash' | 'check' | 'credit';

export type PaymentCategory = 
  | 'tuition'
  | 'test_fee'
  | 'demo_fee'
  | 'kpop'
  | 'other';

export interface Sale {
  sale_id: number;
  student_id?: number; 
  amount: number;
  payment_type: PaymentType;
  payment_date: string; 
  category: PaymentCategory;
  notes?: string; 
  created_at: string;
  updated_at: string;
}

export type CreateSaleRequest = Omit<Sale, 'sale_id' | 'created_at' | 'updated_at'>;

export type UpdateSaleRequest = Partial<Omit<Sale, 'sale_id' | 'created_at'>>;


export const PAYMENT_TYPES: { value: PaymentType; label: string, icon: IconType }[] = [
  { value: 'cash', label: 'Cash', icon: FaMoneyBill},
  { value: 'check', label: 'Check', icon: FaMoneyCheck },
  { value: 'credit', label: 'Credit Card', icon: FaCreditCard }
];

export const PAYMENT_CATEGORIES: { value: PaymentCategory; label: string; requiresNotes?: boolean }[] = [
  { value: 'tuition', label: 'Tuition' },
  { value: 'test_fee', label: 'Test Fee' },
  { value: 'demo_fee', label: 'Demo Fee' },
  { value: 'kpop', label: 'K-Pop Classes' },
  { value: 'other', label: 'Other', requiresNotes: true }
];

export interface SaleFormData {
  student_id?: number;
  amount: string; // String for form input, will be converted to number
  payment_type: PaymentType | '';
  payment_date: string;
  category: PaymentCategory | '';
  notes: string;
  processed_by: string;
}

// For sales analytics/reporting
export interface SalesSummary {
  totalAmount: number;
  totalSales: number;
  averageSale: number;
  byPaymentType: Record<PaymentType, { count: number; total: number }>;
  byCategory: Record<PaymentCategory, { count: number; total: number }>;
  dateRange: {
    start: string;
    end: string;
  };
}