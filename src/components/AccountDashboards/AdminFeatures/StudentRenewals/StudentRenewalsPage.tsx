import React, { useEffect, useState } from "react";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";
import { RenewalCategory } from "./RenewalCategory";
import { RenewalCard } from "./RenewalCard";
import { CreateRenewalForm } from "./CreateRenewalForm";
import { RenewalPeriodWithUiStatus } from "../../../../types/student_renewal";
import { Skeleton } from "../../../ui/skeleton";

const RenewalsSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-wrap gap-4 mb-8">
        <Skeleton className="h-12 w-28 rounded-xl" />
        <Skeleton className="h-12 w-44 rounded-xl" />
      </div>
      {[3, 2].map((count, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-200 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, j) => (
              <div key={j} className="rounded-xl border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const StudentRenewalsPage: React.FC = () => {
  const {
    grouped,
    loading,
    error,
    loadPeriods,
    deletePeriod,
    quitRenewal,
    renewPeriod,
    markInstallmentPaid,
    addPayment,
  } = useStudentRenewals();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const { createRenewal } = useStudentRenewals();

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const isEmpty = Object.values(grouped).every((g) => g.length === 0);
  if (loading && isEmpty) return <RenewalsSkeleton />;

  const totalActive =
    grouped.active.length + grouped.expiring_soon.length + grouped.grace_period.length;

  const renderCategory = (
    title: string,
    icon: string,
    periods: RenewalPeriodWithUiStatus[],
    borderColor: string,
  ) => (
    <RenewalCategory
      key={title}
      title={title}
      icon={icon}
      periods={periods}
      borderColor={borderColor}
    >
      {periods.map((period) => (
        <RenewalCard
          key={period.period_id}
          period={period}
          onMarkInstallmentPaid={markInstallmentPaid}
          onDelete={deletePeriod}
          onResolveAsQuit={quitRenewal}
          onRenew={(p) => renewPeriod(p, p.duration_months ?? 0)}
          onAddPayment={addPayment}
        />
      ))}
    </RenewalCategory>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Renewal Management</h1>
          <p className="text-gray-600">
            {totalActive} active · {grouped.expiring_soon.length} expiring soon ·{" "}
            {grouped.grace_period.length} in grace period
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={loadPeriods}
            disabled={loading}
            className="bg-white text-black rounded-xl shadow-lg px-6 py-3 border-b-4 border-red-500 disabled:opacity-50"
          >
            {loading ? "⏳ Loading..." : "📅 Refresh"}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={loading}
            className="bg-white text-black rounded-xl shadow-lg px-6 py-3 border-b-4 border-red-500 disabled:opacity-50"
          >
            ➕ Register Renewal
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Create form */}
        {showCreateForm && (
          <CreateRenewalForm
            onSubmit={async (data) => {
              await createRenewal(data);
              setShowCreateForm(false);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Renewal buckets */}
        <div className="flex flex-col gap-6">
          {renderCategory("Expiring Soon", "⚠️", grouped.expiring_soon, "border-yellow-500")}
          {renderCategory("Grace Period", "🕓", grouped.grace_period, "border-orange-500")}
          {renderCategory("Expired", "⛔", grouped.expired, "border-red-600")}
          {renderCategory("Active", "⏰", grouped.active, "border-blue-500")}
          {renderCategory("Paid", "✅", grouped.paid, "border-green-500")}

          {!loading && Object.values(grouped).every((g) => g.length === 0) && (
            <div className="text-center text-gray-400 py-16 text-sm">
              No renewals yet. Register one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
