import { useState } from "react";
import {
  Sale,
  SaleFormData,
  PaymentType,
  PaymentCategory,
  PAYMENT_CATEGORIES,
  PAYMENT_TYPES,
} from "../../../../types/sales";
import {
  FaCalendar,
  FaCheckCircle,
  FaDollarSign,
  FaPiggyBank,
  FaPlus,
  FaUser,
} from "react-icons/fa";

const mockTodaysSales: Sale[] = [
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
const mockStudents = [
  { student_id: 101, first_name: "Alice", last_name: "Johnson" },
  { student_id: 102, first_name: "Bob", last_name: "Smith" },
  { student_id: 103, first_name: "Carol", last_name: "Williams" },
];

export default function SalesTrackingPage() {
  const [currentPage, setCurrentPage] = useState<"main" | "add">("main");
  const [sales, setSales] = useState<Sale[]>(mockTodaysSales);
  const [loading, setLoading] = useState(false);

  // Add Sale Form State
  const [formData, setFormData] = useState<SaleFormData>({
    student_id: undefined,
    amount: "",
    payment_type: "",
    payment_date: new Date().toISOString().split("T")[0],
    category: "",
    notes: "",
    processed_by: "",
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Calculate today's totals
  const todaysTotal = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const salesCount = sales.length;

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get category label
  const getCategoryLabel = (category: PaymentCategory): string => {
    return PAYMENT_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  // Format time
  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.push("Amount must be a positive number");
    }

    if (!formData.payment_type) {
      errors.push("Payment type is required");
    }

    if (!formData.payment_date) {
      errors.push("Payment date is required");
    }

    if (!formData.category) {
      errors.push("Category is required");
    }

    if (formData.category === "other" && (!formData.notes || formData.notes.trim().length === 0)) {
      errors.push('Notes are required when category is "Other"');
    }

    if (!formData.processed_by.trim()) {
      errors.push("Processed by field is required");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() && !loading && !formErrors) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      const newSale: Sale = {
        sale_id: Date.now(), // Mock ID
        student_id: formData.student_id || undefined,
        amount: Number(formData.amount),
        payment_type: formData.payment_type as PaymentType,
        payment_date: new Date(formData.payment_date).toISOString(),
        category: formData.category as PaymentCategory,
        notes: formData.notes || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setSales((prev) => [newSale, ...prev]);

      // Reset form
      setFormData({
        student_id: undefined,
        amount: "",
        payment_type: "",
        payment_date: new Date().toISOString().split("T")[0],
        category: "",
        notes: "",
        processed_by: "",
      });

      setCurrentPage("main");
    } catch (error) {
      console.error("Error creating sale:", error);
    } finally {
      setLoading(false);
    }
  };

  // Main Sales Page
  if (currentPage === "main") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Today's Sales</h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => setCurrentPage("add")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <FaPlus className="w-5 h-5" />
              Add Sale
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaDollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(todaysTotal)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaCheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{salesCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FaPiggyBank className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Sale</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {salesCount > 0 ? formatCurrency(todaysTotal / salesCount) : "$0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sales List */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Today's Transactions</h2>
            </div>

            {sales.length === 0 ? (
              <div className="p-12 text-center">
                <FaDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No sales recorded today</p>
                <p className="text-gray-400 text-sm mt-1">Add your first sale to get started</p>
              </div>
            ) : (
              <div className="divide-y">
                {sales.map((sale) => (
                  <div key={sale.sale_id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">{sale.payment_type}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(sale.amount)}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              {getCategoryLabel(sale.category)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <FaCalendar className="w-3 h-3" />
                              {formatTime(sale.payment_date)}
                            </span>
                            {sale.student_id && (
                              <span className="flex items-center gap-1">
                                <FaUser className="w-3 h-3" />
                                Student #{sale.student_id}
                              </span>
                            )}
                          </div>
                          {sale.notes && (
                            <p className="text-sm text-gray-500 mt-1 italic">"{sale.notes}"</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {sale.payment_type}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // Add Sale Page
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setCurrentPage("main")}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Sale</h1>
            <p className="text-gray-600 mt-1">Record a new payment transaction</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="space-y-6">
            {/* Error Messages */}
            {formErrors.length > 0 && (
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
                  {formErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student (Optional)
              </label>
              <select
                value={formData.student_id || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    student_id: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a student (or leave blank)</option>
                {mockStudents.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.first_name} {student.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, payment_type: type.value }))}
                    className={`p-4 border-2 rounded-lg transition-colors flex flex-col items-center gap-2 ${
                      formData.payment_type === type.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {/* {type.icon} */}
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
                value={formData.payment_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, payment_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as PaymentCategory,
                    notes: e.target.value !== "other" ? "" : prev.notes, // Clear notes if not 'other'
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {PAYMENT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes (required for 'other' category) */}
            {(formData.category === "other" || formData.notes) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes {formData.category === "other" && "*"}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={
                    formData.category === "other"
                      ? "Please specify what this payment is for..."
                      : "Optional notes about this payment..."
                  }
                />
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCurrentPage("main")}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={(e) => handleSubmit(e)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "Adding Sale..." : "Add Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
