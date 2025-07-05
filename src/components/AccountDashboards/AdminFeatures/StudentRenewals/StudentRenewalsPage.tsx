import { useState } from "react";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";

export const StudentRenewalsPage = () => {
  const { renewals, loadRenewals, updateRenewal, removeRenewal, createRenewal } = useStudentRenewals();
  
  // State for create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRenewal, setNewRenewal] = useState({
    student_id: "",
    amount_due: "",
    due_date: "",
    description: "",
  });

  // Handler for creating renewal
  const handleCreateRenewal = async () => {
    try {
      await createRenewal({
        student_id: parseInt(newRenewal.student_id),
        amount_due: parseFloat(newRenewal.amount_due),
        due_date: newRenewal.due_date,
        description: newRenewal.description,
        status: "upcoming",
        amount_paid: 0,
      });
      setShowCreateForm(false);
      setNewRenewal({
        student_id: "",
        amount_due: "",
        due_date: "",
        description: "",
      });
    } catch (error) {
      console.error("Error creating renewal:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "expiring":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return "✓";
      case "expiring":
        return "⚠";
      case "upcoming":
        return "⏰";
      case "overdue":
        return "❌";
      default:
        return "⏰";
    }
  };

  const categorizedRenewals = {
    overdue: renewals.filter((r) => r.status === "overdue"),
    expiring: renewals.filter((r) => r.status === "expiring"),
    upcoming: renewals.filter((r) => r.status === "upcoming"),
    paid: renewals.filter((r) => r.status === "paid"),
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
            onClick={() => loadRenewals()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            📅 Load All Renewals
          </button>
          <button
            onClick={() => loadRenewals(123)}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-4">Create New Renewal</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                  <input
                    type="number"
                    value={newRenewal.student_id}
                    onChange={(e) => setNewRenewal({ ...newRenewal, student_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRenewal.amount_due}
                    onChange={(e) => setNewRenewal({ ...newRenewal, amount_due: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newRenewal.due_date}
                    onChange={(e) => setNewRenewal({ ...newRenewal, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newRenewal.description}
                    onChange={(e) => setNewRenewal({ ...newRenewal, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateRenewal}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Create Renewal
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Renewal Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overdue Renewals */}
          {categorizedRenewals.overdue.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <h2 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">❌</span>
                Overdue ({categorizedRenewals.overdue.length})
              </h2>
              <div className="space-y-4">
                {categorizedRenewals.overdue.map((renewal) => (
                  <div
                    key={renewal.renewal_id}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{renewal.description}</h3>
                        <p className="text-sm text-gray-600">Student ID: {renewal.student_id}</p>
                        <p className="text-sm text-gray-600">Due: {renewal.due_date}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          renewal.status
                        )} flex items-center gap-1`}
                      >
                        <span>{getStatusIcon(renewal.status)}</span>
                        Overdue
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        ${renewal.amount_due}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateRenewal(renewal.renewal_id, { amount_paid: renewal.amount_due })
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
                        >
                          <span>✓</span>
                          Mark Paid
                        </button>
                        <button
                          onClick={() => removeRenewal(renewal.renewal_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
                        >
                          <span>🗑️</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon */}
          {categorizedRenewals.expiring.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <h2 className="text-2xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚠</span>
                Expiring Soon ({categorizedRenewals.expiring.length})
              </h2>
              <div className="space-y-4">
                {categorizedRenewals.expiring.map((renewal) => (
                  <div
                    key={renewal.renewal_id}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{renewal.description}</h3>
                        <p className="text-sm text-gray-600">Student ID: {renewal.student_id}</p>
                        <p className="text-sm text-gray-600">Due: {renewal.due_date}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          renewal.status
                        )} flex items-center gap-1`}
                      >
                        <span>{getStatusIcon(renewal.status)}</span>
                        Expiring
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        ${renewal.amount_due}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateRenewal(renewal.renewal_id, { amount_paid: renewal.amount_due })
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
                        >
                          <span>✓</span>
                          Mark Paid
                        </button>
                        <button
                          onClick={() => removeRenewal(renewal.renewal_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
                        >
                          <span>🗑️</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Renewals */}
          {categorizedRenewals.upcoming.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                Upcoming ({categorizedRenewals.upcoming.length})
              </h2>
              <div className="space-y-4">
                {categorizedRenewals.upcoming.map((renewal) => (
                  <div
                    key={renewal.renewal_id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{renewal.description}</h3>
                        <p className="text-sm text-gray-600">Student ID: {renewal.student_id}</p>
                        <p className="text-sm text-gray-600">Due: {renewal.due_date}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          renewal.status
                        )} flex items-center gap-1`}
                      >
                        <span>{getStatusIcon(renewal.status)}</span>
                        Upcoming
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        ${renewal.amount_due}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateRenewal(renewal.renewal_id, { amount_paid: renewal.amount_due })
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
                        >
                          <span>✓</span>
                          Mark Paid
                        </button>
                        <button
                          onClick={() => removeRenewal(renewal.renewal_id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
                        >
                          <span>🗑️</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paid Renewals */}
          {categorizedRenewals.paid.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Paid ({categorizedRenewals.paid.length})
              </h2>
              <div className="space-y-4">
                {categorizedRenewals.paid.map((renewal) => (
                  <div
                    key={renewal.renewal_id}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{renewal.description}</h3>
                        <p className="text-sm text-gray-600">Student ID: {renewal.student_id}</p>
                        <p className="text-sm text-gray-600">Due: {renewal.due_date}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          renewal.status
                        )} flex items-center gap-1`}
                      >
                        <span>{getStatusIcon(renewal.status)}</span>
                        Paid
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-gray-900">
                        ${renewal.amount_due}
                      </span>
                      <button
                        onClick={() => removeRenewal(renewal.renewal_id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 text-sm"
                      >
                        <span>🗑️</span>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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