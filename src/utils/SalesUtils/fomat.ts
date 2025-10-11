import { PaymentCategory, PAYMENT_CATEGORIES } from "../../types/sales";

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export const formatTime = (dateString: string): string =>
  new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export const getCategoryLabel = (category: PaymentCategory): string =>
  PAYMENT_CATEGORIES.find((c) => c.value === category)?.label || category;
