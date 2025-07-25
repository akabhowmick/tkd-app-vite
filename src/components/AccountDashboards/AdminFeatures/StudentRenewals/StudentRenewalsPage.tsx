import React, { useState } from "react";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";
import { RenewalCategory } from "./RenewalCategory";
import {
  Renewal,
  CategorizedRenewals,
  CreateRenewalRequest,
} from "../../../../types/student_renewal";
import { CreateRenewalForm } from "./CreateRenewalForm";
import { RenewalCard } from "./RenewalCard";

// Main Component - Single Responsibility: Display renewals
export const StudentRenewalsPage: React.FC = () => {
  const { renewals, loadRenewals, updateRenewal, removeRenewal, createRenewal } =
    useStudentRenewals();
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  const categorizeRenewals = (renewals: Renewal[]): CategorizedRenewals => {
    return renewals.reduce(
      (acc, renewal) => {
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
      },
      { expired: [], active: [], paid: [] } as CategorizedRenewals
    );
  };

  const categorizedRenewals = categorizeRenewals(renewals);

  const handleMarkPaid = (renewalId: number): void => {
    const renewal = renewals.find((r) => r.renewal_id === renewalId);
    if (renewal) {
      updateRenewal(renewalId, { amount_paid: renewal.amount_due });
    }
  };

  const handleCreateRenewal = async (renewalData: CreateRenewalRequest): Promise<void> => {
    await createRenewal(renewalData);
    setShowCreateForm(false);
  };

  const handleLoadRenewals = (): void => {
    loadRenewals();
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
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            ➕ Register Renewal
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
            {categorizedRenewals.active.map((renewal, index) => (
              <RenewalCard
                key={`${renewal.renewal_id}+${index}`}
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
