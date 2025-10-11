/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { fetchTodaysSales, createSale } from "../api/SalesRequests/salesApi";
import { Sale, SaleFormData, PaymentType, PaymentCategory } from "../types/sales";

interface SalesContextValue {
  sales: Sale[];
  loading: boolean;
  refresh: () => Promise<void>;
  addSale: (form: SaleFormData) => Promise<void>;
  validateForm: (form: SaleFormData) => string[];
}

const SalesContext = createContext<SalesContextValue | null>(null);

export const useSales = () => {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error("useSales must be used within <SalesProvider>");
  return ctx;
};

export const SalesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fetchTodaysSales();
      setSales(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);
  const validateForm = (form: SaleFormData): string[] => {
    const errors: string[] = [];
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errors.push("Amount must be a positive number");
    }
    if (!form.payment_type) errors.push("Payment type is required");
    if (!form.payment_date) errors.push("Payment date is required");
    if (!form.category) errors.push("Category is required");
    if (form.category === "other" && (!form.notes || form.notes.trim().length === 0)) {
      errors.push('Notes are required when category is "Other"');
    }
    if (!form.processed_by.trim()) errors.push("Processed by field is required");
    return errors;
  };

  const addSale = async (form: SaleFormData) => {
    const errs = validateForm(form);
    if (errs.length) throw new Error(errs.join("|"));

    const newSale = {
      sale_id: Date.now(),
      student_id: form.student_id || undefined,
      amount: Number(form.amount),
      payment_type: form.payment_type as PaymentType,
      payment_date: new Date(form.payment_date).toISOString(),
      category: form.category as PaymentCategory,
      notes: form.notes || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies Sale;

    await createSale(newSale);
    setSales((prev) => [newSale, ...prev]);
  };

  const value = useMemo(
    () => ({ sales, loading, refresh, addSale, validateForm }),
    [sales, loading]
  );

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
};
