// File: StudentRenewalsPage.tsx
import React, { useState } from "react";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";
import { RenewalCategory } from "./RenewalCategory";
import { CreateRenewalForm } from "./CreateRenewalForm";
import { RenewalCard } from "./RenewalCard";
import {
  CategorizedRenewals,
  CreateRenewalRequest,
  Renewal,
  ExpiringRenewal,
} from "../../../../types/student_renewal";

export const StudentRenewalsPage: React.FC = () => {
  const {
    renewals,
    getGroupedExpiringRenewals,
    createRenewal,
    updateRenewal,
    removeRenewal,
    resolveRenewalAsQuit,
    resolveRenewalWithNext,
    loadRenewals,
  } = useStudentRenewals();

  const [showCreateForm, setShowCreateForm] = useState(false);

  const categorizedRenewals = renewals.reduce(
    (acc, renewal) => {
      const isExpired = new Date(renewal.expiration_date) < new Date();
      const isPaid = renewal.amount_paid >= renewal.amount_due;

      if (isPaid) acc.paid.push(renewal);
      else if (isExpired) acc.expired.push(renewal);
      else acc.active.push(renewal);

      return acc;
    },
    { expired: [], active: [], paid: [] } as CategorizedRenewals
  );

  // TODO the expired and gracePeriod are not returning anything
  const { expired, gracePeriod, expiringSoon } = getGroupedExpiringRenewals();

  const handleCreateRenewal = async (data: CreateRenewalRequest) => {
    await createRenewal(data);
    setShowCreateForm(false);
  };

  const handleMarkPaid = (id: number) => {
    const renewal = renewals.find((r) => r.renewal_id === id);
    if (renewal) updateRenewal(id, { amount_paid: renewal.amount_due });
  };

  const handleResolveAsQuit = async (id: number) => {
    await resolveRenewalAsQuit(id);
  };

  const handleResolveWithNext = async (renewal: Renewal) => {
    await resolveRenewalWithNext(renewal, {
      duration_months: 1,
      amount_paid: renewal.amount_due,
      number_of_classes: renewal.number_of_classes,
      paid_to: renewal.paid_to,
    });
  };

  const renderCategory = (title: string, icon: string, items: Renewal[], color: string) => (
    <RenewalCategory title={title} icon={icon} renewals={items} borderColor={color}>
      {items.map((renewal) => (
        <RenewalCard
          key={renewal.renewal_id}
          renewal={renewal}
          onMarkPaid={handleMarkPaid}
          onDelete={removeRenewal}
          onResolveAsQuit={handleResolveAsQuit}
          onResolveWithNext={handleResolveWithNext}
          statusMessage={(renewal as ExpiringRenewal)?.statusMessage}
        />
      ))}
    </RenewalCategory>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Renewal Management</h1>
          <p className="text-gray-600">Track and manage student renewals across all categories</p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => loadRenewals()}
            className="bg-white text-black rounded-xl shadow-lg px-6 py-3 border-b-4 border-red-500"
          >
            📅 Load All Renewals
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-white text-black rounded-xl shadow-lg px-6 py-3 border-b-4 border-red-500"
          >
            ➕ Register Renewal
          </button>
        </div>

        {showCreateForm && (
          <CreateRenewalForm
            onSubmit={handleCreateRenewal}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        <div className="flex flex-wrap gap-4">
          {renderCategory("Expiring Soon", "⚠️", expiringSoon, "border-yellow-500")}
          {renderCategory("Grace Period", "🕓", gracePeriod, "border-orange-500")}
          {renderCategory("Expired", "⛔", expired, "border-red-600")}
          {renderCategory("Active", "⏰", categorizedRenewals.active, "border-blue-500")}
          {renderCategory("Paid", "✅", categorizedRenewals.paid, "border-green-500")}
        </div>
      </div>
    </div>
  );
};
