import { PaymentCategory, PAYMENT_CATEGORIES, PaymentType, PAYMENT_TYPES, SaleFormData } from "../types/sales";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function getCategoryLabel(category: PaymentCategory): string {
  const categoryObj = PAYMENT_CATEGORIES.find(c => c.value === category);
  return categoryObj?.label || category;
}

export function getPaymentTypeLabel(paymentType: PaymentType): string {
  const typeObj = PAYMENT_TYPES.find(t => t.value === paymentType);
  return typeObj?.label || paymentType;
}

export function validateSaleForm(formData: SaleFormData): string[] {
  const errors: string[] = [];

  if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (!formData.payment_type) {
    errors.push('Payment type is required');
  }

  if (!formData.payment_date) {
    errors.push('Payment date is required');
  }

  if (!formData.category) {
    errors.push('Category is required');
  }

  if (formData.category === 'other' && (!formData.notes || formData.notes.trim().length === 0)) {
    errors.push('Notes are required when category is "Other"');
  }

  return errors;
}