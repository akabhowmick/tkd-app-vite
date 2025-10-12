import React, { useMemo, useState } from "react";
import { FaDollarSign } from "react-icons/fa";
import { useSales } from "../../../context/SalesContext";
import { SaleFormData, PAYMENT_TYPES, PaymentCategory, PAYMENT_CATEGORIES } from "../../../types/sales";
import { mockStudents } from "../../../utils/SalesUtils/mockStudents";

const emptyForm: SaleFormData = {
  student_id: undefined,
  amount: "",
  payment_type: "",
  payment_date: new Date().toISOString().split("T")[0],
  category: "",
  notes: "",
  processed_by: "",
};

export const AddSaleForm: React.FC<{ onCancel: () => void; onSaved?: () => void }> = ({ onCancel, onSaved }) => {
  const { addSale, validateForm } = useSales();
  const [form, setForm] = useState<SaleFormData>(emptyForm);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const paymentTypeButtons = useMemo(() => PAYMENT_TYPES, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form);
    setErrors(errs);
    if (errs.length) return;

    setSaving(true);
    try {
      await addSale(form);
      setForm(emptyForm);
      onSaved?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message.replace(/\|/g, "; ") : "Unknown error";
      setErrors([msg]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="space-y-6">
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Please fix the following errors:
            </div>
            <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Student */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Student (Optional)</label>
          <select
            value={form.student_id ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, student_id: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a student (or leave blank)</option>
            {mockStudents.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.first_name} {s.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
          <div className="relative">
            <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Payment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
          <div className="grid grid-cols-3 gap-3">
            {paymentTypeButtons.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, payment_type: type.value }))}
                className={`p-4 border-2 rounded-lg transition-colors flex flex-col items-center gap-2 ${
                  form.payment_type === type.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label>
          <input
            type="date"
            value={form.payment_date}
            onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                category: e.target.value as PaymentCategory,
                notes: e.target.value !== "other" ? "" : p.notes,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {PAYMENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        {(form.category === "other" || form.notes) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes {form.category === "other" && "*"}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={
                form.category === "other"
                  ? "Please specify what this payment is for..."
                  : "Optional notes about this payment..."
              }
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? "Adding Sale..." : "Add Sale"}
          </button>
        </div>
      </div>
    </div>
  );
};