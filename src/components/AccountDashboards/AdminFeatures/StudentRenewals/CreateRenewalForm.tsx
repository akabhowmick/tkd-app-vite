import React, { useState } from "react";
import { CreateRenewalFormProps } from "../../../../types/student_renewal";
import { useSchool } from "../../../../context/SchoolContext";

export const CreateRenewalForm: React.FC<CreateRenewalFormProps> = ({ onSubmit, onCancel }) => {
  const { students, schoolId } = useSchool();

  const [form, setForm] = useState({
    student_id: "",
    duration_months: "",
    expiration_date: "",
    number_of_classes: "",
    payment_date: new Date().toISOString().split("T")[0],
    amount_due: "",
    amount_paid: "",
    paid_to: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setError("");

    if (!form.student_id) return setError("Please select a student.");
    if (!form.duration_months) return setError("Duration is required.");
    if (!form.expiration_date) return setError("Expiration date is required.");
    if (!form.number_of_classes) return setError("Number of classes is required.");
    if (!form.amount_due) return setError("Amount due is required.");
    if (!form.paid_to) return setError("Paid to is required.");

    setLoading(true);
    try {
      await onSubmit({
        period: {
          student_id: form.student_id,
          school_id: schoolId,
          duration_months: parseInt(form.duration_months),
          expiration_date: form.expiration_date,
          number_of_classes: parseInt(form.number_of_classes),
        },
        payment: {
          payment_date: form.payment_date,
          amount_due: parseFloat(form.amount_due),
          amount_paid: parseFloat(form.amount_paid) || 0,
          installment_number: 1,
          paid_to: form.paid_to,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-black rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Register Renewal</h2>

        <div className="space-y-4">
          {/* Student */}
          <div>
            <label className={labelClass}>Student</label>
            <select
              value={form.student_id}
              onChange={(e) => set("student_id", e.target.value)}
              className={fieldClass}
            >
              <option value="">Select a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id!}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Duration (months)</label>
              <input
                type="number"
                value={form.duration_months}
                onChange={(e) => set("duration_months", e.target.value)}
                className={fieldClass}
                placeholder="3"
              />
            </div>
            <div>
              <label className={labelClass}>Classes / week</label>
              <input
                type="number"
                value={form.number_of_classes}
                onChange={(e) => set("number_of_classes", e.target.value)}
                className={fieldClass}
                placeholder="2"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Expiration Date</label>
            <input
              type="date"
              value={form.expiration_date}
              onChange={(e) => set("expiration_date", e.target.value)}
              className={fieldClass}
            />
          </div>

          {/* Payment fields */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-500 mb-3">First Payment Installment</p>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Payment Date</label>
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => set("payment_date", e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Amount Due</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount_due}
                    onChange={(e) => set("amount_due", e.target.value)}
                    className={fieldClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelClass}>Amount Paid</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount_paid}
                    onChange={(e) => set("amount_paid", e.target.value)}
                    className={fieldClass}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Paid To</label>
                <input
                  type="text"
                  value={form.paid_to}
                  onChange={(e) => set("paid_to", e.target.value)}
                  className={fieldClass}
                  placeholder="e.g. MR, Amy"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors"
            >
              {loading ? "Saving..." : "Register Renewal"}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
