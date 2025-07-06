import React, { useState } from "react";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";

// Types
interface Renewal {
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

interface NewRenewalData {
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

interface FormData {
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

interface FormField {
  name: keyof FormData;
  label: string;
  type: string;
  step?: string;
  placeholder?: string;
  required?: boolean;
}

interface StatusConfig {
  color: string;
  bgColor: string;
  icon: string;
  text: string;
}

interface CategorizedRenewals {
  expired: Renewal[];
  active: Renewal[];
  paid: Renewal[];
}

// Props interfaces
interface CreateRenewalFormProps {
  onSubmit: (data: NewRenewalData) => Promise<void>;
  onCancel: () => void;
}

interface RenewalCardProps {
  renewal: Renewal;
  onMarkPaid: (renewalId: number) => void;
  onDelete: (renewalId: number) => void;
}

interface RenewalCategoryProps {
  title: string;
  icon: string;
  renewals: Renewal[];
  borderColor: string;
  children: React.ReactNode;
}

// Create Renewal Form Component
const CreateRenewalForm: React.FC<CreateRenewalFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<FormData>({
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

  const handleChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formFields: FormField[] = [
    { name: "student_id", label: "Student ID", type: "number", required: true },
    { name: "duration_months", label: "Duration (Months)", type: "number", required: true },
    { name: "payment_date", label: "Payment Date", type: "date", required: true },
    { name: "expiration_date", label: "Expiration Date", type: "date", required: true },
    { name: "amount_due", label: "Amount Due", type: "number", step: "0.01", required: true },
    { name: "amount_paid", label: "Amount Paid", type: "number", step: "0.01", placeholder: "0.00" },
    { name: "number_of_payments", label: "Number of Payments", type: "number", required: true },
    { name: "number_of_classes", label: "Number of Classes", type: "number", required: true },
    { name: "paid_to", label: "Paid To", type: "text", placeholder: "e.g., John Doe, Credit Card, etc.", required: true }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Renewal</h2>
        <div className="space-y-4">
          {formFields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
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

// Renewal Card Component
const RenewalCard: React.FC<RenewalCardProps> = ({ renewal, onMarkPaid, onDelete }) => {
  const isExpired = new Date(renewal.expiration_date) < new Date();
  const isPaid = renewal.amount_paid >= renewal.amount_due;

  const getStatusConfig = (): StatusConfig => {
    if (isPaid) {
      return {
        color: "bg-green-100 text-green-800 border-green-200",
        bgColor: "bg-green-50 border-green-200",
        icon: "✓",
        text: "Paid"
      };
    } else if (isExpired) {
      return {
        color: "bg-red-100 text-red-800 border-red-200",
        bgColor: "bg-red-50 border-red-200",
        icon: "❌",
        text: "Expired"
      };
    } else {
      return {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        bgColor: "bg-blue-50 border-blue-200",
        icon: "⏰",
        text: "Active"
      };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`${statusConfig.bgColor} border rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {renewal.duration_months} Month Renewal
          </h3>
          <p className="text-sm text-gray-600">Student ID: {renewal.student_id}</p>
          <p className="text-sm text-gray-600">
            Expires: {new Date(renewal.expiration_date).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            Classes: {renewal.number_of_classes}
          </p>
          {isPaid && renewal.paid_to && (
            <p className="text-sm text-gray-600">Paid to: {renewal.paid_to}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color} flex items-center gap-1`}
        >
          <span>{statusConfig.icon}</span>
          {statusConfig.text}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <span className="text-2xl font-bold text-gray-900">
            ${renewal.amount_due}
          </span>
          <span className="text-sm text-gray-600 ml-2">
            (Paid: ${renewal.amount_paid})
          </span>
        </div>
        <div className="flex gap-2">
          {!isPaid && (
            <button
              onClick={() => onMarkPaid(renewal.renewal_id)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
            >
              <span>✓</span>
              Mark Paid
            </button>
          )}
          <button
            onClick={() => onDelete(renewal.renewal_id)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
          >
            <span>🗑️</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Renewal Category Component
const RenewalCategory: React.FC<RenewalCategoryProps> = ({ title, icon, renewals, borderColor, children }) => {
  if (renewals.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${borderColor}`}>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title} ({renewals.length})
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

// Main Component - Single Responsibility: Display renewals
export const StudentRenewalsPage: React.FC = () => {
  const { renewals, loadRenewals, updateRenewal, removeRenewal, createRenewal } = useStudentRenewals();
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  const categorizeRenewals = (renewals: Renewal[]): CategorizedRenewals => {
    return renewals.reduce((acc, renewal) => {
      const isExpired = new Date(renewal.expiration_date) < new Date();
      const isPaid = renewal.amount_paid >= renewal.amount_due;

      if (isPaid) {
        acc.paid.push(renewal);
      } else if (isExpired) {
        acc.expired.push(renewal);
      } else {
        acc.active.push(renewal);
      }

      return acc;
    }, { expired: [], active: [], paid: [] } as CategorizedRenewals);
  };

  const categorizedRenewals = categorizeRenewals(renewals);

  const handleMarkPaid = (renewalId: number): void => {
    const renewal = renewals.find(r => r.renewal_id === renewalId);
    if (renewal) {
      updateRenewal(renewalId, { amount_paid: renewal.amount_due });
    }
  };

  const handleCreateRenewal = async (renewalData: NewRenewalData): Promise<void> => {
    await createRenewal(renewalData);
    setShowCreateForm(false);
  };

  const handleLoadRenewals = (): void => {
    loadRenewals();
  };

  const handleLoadSpecificStudent = (): void => {
    loadRenewals(123);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Renewal Management</h1>
          <p className="text-gray-600">Track and manage student renewals across all categories</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={handleLoadRenewals}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            📅 Load All Renewals
          </button>
          <button
            onClick={handleLoadSpecificStudent}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            📅 Load Student 123
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            ➕ Create Renewal
          </button>
        </div>

        {/* Create Renewal Form */}
        {showCreateForm && (
          <CreateRenewalForm
            onSubmit={handleCreateRenewal}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Renewal Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RenewalCategory
            title="Expired"
            icon="❌"
            renewals={categorizedRenewals.expired}
            borderColor="border-red-500"
          >
            {categorizedRenewals.expired.map((renewal) => (
              <RenewalCard
                key={renewal.renewal_id}
                renewal={renewal}
                onMarkPaid={handleMarkPaid}
                onDelete={removeRenewal}
              />
            ))}
          </RenewalCategory>

          <RenewalCategory
            title="Active"
            icon="⏰"
            renewals={categorizedRenewals.active}
            borderColor="border-blue-500"
          >
            {categorizedRenewals.active.map((renewal) => (
              <RenewalCard
                key={renewal.renewal_id}
                renewal={renewal}
                onMarkPaid={handleMarkPaid}
                onDelete={removeRenewal}
              />
            ))}
          </RenewalCategory>

          <RenewalCategory
            title="Paid"
            icon="✅"
            renewals={categorizedRenewals.paid}
            borderColor="border-green-500"
          >
            {categorizedRenewals.paid.map((renewal) => (
              <RenewalCard
                key={renewal.renewal_id}
                renewal={renewal}
                onMarkPaid={handleMarkPaid}
                onDelete={removeRenewal}
              />
            ))}
          </RenewalCategory>
        </div>

        {/* Empty State */}
        {renewals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-400 mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No renewals found</h3>
            <p className="text-gray-500">Click "Load All Renewals" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRenewalsPage;