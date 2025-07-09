import { useState } from "react";
import { CreateRenewalFormProps, RenewalFormField, RenewalFormData } from "../../../../types/student_renewal";

export const CreateRenewalForm: React.FC<CreateRenewalFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<RenewalFormData>({
    student_id: "",
    duration_months: "",
    payment_date: "",
    expiration_date: "",
    amount_due: "",
    amount_paid: "",
    number_of_payments: "",
    number_of_classes: "",
    paid_to: "",
  });

  const handleSubmit = async (): Promise<void> => {
    try {
      await onSubmit({
        student_id: parseInt(formData.student_id),
        duration_months: parseInt(formData.duration_months),
        payment_date: formData.payment_date,
        expiration_date: formData.expiration_date,
        amount_due: parseFloat(formData.amount_due),
        amount_paid: parseFloat(formData.amount_paid) || 0,
        number_of_payments: parseInt(formData.number_of_payments),
        number_of_classes: parseInt(formData.number_of_classes),
        paid_to: formData.paid_to,
      });
      setFormData({
        student_id: "",
        duration_months: "",
        payment_date: "",
        expiration_date: "",
        amount_due: "",
        amount_paid: "",
        number_of_payments: "",
        number_of_classes: "",
        paid_to: "",
      });
    } catch (error) {
      console.error("Error creating renewal:", error);
    }
  };

  const handleChange = (field: keyof RenewalFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formFields: RenewalFormField[] = [
    { name: "student_id", label: "Student ID", type: "number", required: true },
    { name: "duration_months", label: "Duration (Months)", type: "number", required: true },
    { name: "payment_date", label: "Payment Date", type: "date", required: true },
    { name: "expiration_date", label: "Expiration Date", type: "date", required: true },
    { name: "amount_due", label: "Amount Due", type: "number", step: "0.01", required: true },
    {
      name: "amount_paid",
      label: "Amount Paid",
      type: "number",
      step: "0.01",
      placeholder: "0.00",
    },
    { name: "number_of_payments", label: "Number of Payments", type: "number", required: true },
    { name: "number_of_classes", label: "Number of Classes", type: "number", required: true },
    {
      name: "paid_to",
      label: "Paid To",
      type: "text",
      placeholder: "e.g., John Doe, Credit Card, etc.",
      required: true,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Renewal</h2>
        <div className="space-y-4">
          {formFields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                step={field.step}
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={field.placeholder}
                required={field.required}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
            >
              Create Renewal
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};