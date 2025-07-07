import React, { useState } from "react";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";
import { RenewalCategory } from "./RenewalCategory";
import { RenewalCardProps, StatusConfig, Renewal, CategorizedRenewals, NewRenewalData } from "../../../../types/student_renewal";
import { CreateRenewalForm } from "./CreateRenewalForm";

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