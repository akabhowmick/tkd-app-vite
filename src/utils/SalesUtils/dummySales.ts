import { Sale } from "../../types/sales";

export const mockTodaysSales: Sale[] = [
  {
    sale_id: 1,
    student_id: 101,
    amount: 120.0,
    payment_type: "credit",
    payment_date: "2025-08-18T10:30:00Z",
    category: "tuition",
    created_at: "2025-08-18T10:30:00Z",
    updated_at: "2025-08-18T10:30:00Z",
  },
  {
    sale_id: 2,
    student_id: 102,
    amount: 50.0,
    payment_type: "cash",
    payment_date: "2025-08-18T14:15:00Z",
    category: "test_fee",
    created_at: "2025-08-18T14:15:00Z",
    updated_at: "2025-08-18T14:15:00Z",
  },
  {
    sale_id: 3,
    amount: 25.0,
    payment_type: "check",
    payment_date: "2025-08-18T16:45:00Z",
    category: "other",
    notes: "Uniform purchase",
    created_at: "2025-08-18T16:45:00Z",
    updated_at: "2025-08-18T16:45:00Z",
  },
];
