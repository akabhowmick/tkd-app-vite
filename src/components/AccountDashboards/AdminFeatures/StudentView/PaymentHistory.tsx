import { useEffect, useMemo, useState } from "react";
import {
  useStudentRenewals,
  enrichPeriod,
} from "../../../../context/StudentRenewalContext";
import { usePrograms } from "../../../../context/ProgramContext";
import { useSchool } from "../../../../context/SchoolContext";
import { Skeleton } from "../../../ui/skeleton";
import { Input } from "../../../ui/input";
import { Pencil, Check, X, Loader2, Info, Trash2 } from "lucide-react";
import { AppConfirmModal } from "../../../ui/modal/index";
import type {
  RenewalPayment,
  RenewalPeriodWithUiStatus,
  UpdateRenewalPaymentRequest,
} from "../../../../types/student_renewal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-blue-100 text-blue-700" },
  expiring_soon: { label: "Expiring Soon", cls: "bg-yellow-100 text-yellow-700" },
  grace_period: { label: "Grace Period", cls: "bg-orange-100 text-orange-700" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-700" },
  payment_overdue: { label: "Overdue", cls: "bg-orange-100 text-orange-700" },
  paid: { label: "Paid", cls: "bg-green-100 text-green-700" },
  paid_off: { label: "Paid Off", cls: "bg-green-100 text-green-700" },
  milestone: { label: "Milestone", cls: "bg-purple-100 text-purple-700" },
  renewed: { label: "Renewed", cls: "bg-gray-100 text-gray-600" },
  quit: { label: "Quit", cls: "bg-red-100 text-red-700" },
};

function resolveDisplayStatus(period: RenewalPeriodWithUiStatus, isLatest: boolean): string {
  if (!isLatest && (period.ui_status === "active" || period.ui_status === "paid")) {
    return period.balance <= 0 && period.total_due > 0 ? "paid_off" : "renewed";
  }
  return period.ui_status;
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const PaymentHistorySkeleton = () => (
  <div className="flex flex-col gap-6">
    {[0, 1].map((i) => (
      <div key={i} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    ))}
  </div>
);

// ─── PeriodBlock ──────────────────────────────────────────────────────────────

interface PeriodBlockProps {
  period: RenewalPeriodWithUiStatus;
  displayStatus: string;
  programName: string;
  onSave: (periodId: string, paymentId: string, updates: UpdateRenewalPaymentRequest) => Promise<void>;
  onDelete: (periodId: string) => Promise<void>;
}

function PeriodBlock({ period, displayStatus, programName, onSave, onDelete }: PeriodBlockProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isActiveDelete = displayStatus === "active";
  const hasLinkedStudents = (period.linked_student_ids?.length ?? 0) > 0;

  const deleteDescription = [
    isActiveDelete
      ? "Warning: this is the student's current active enrollment. Deleting it will remove their enrollment record."
      : "This will permanently delete this renewal period and all its payments.",
    hasLinkedStudents
      ? "This renewal is shared with sibling students — their payment records will also be deleted."
      : null,
    deleteError ?? null,
    "This cannot be undone.",
  ].filter(Boolean).join(" ");

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <StatusBadge status={displayStatus} />
          <span className="text-sm font-semibold text-gray-800 truncate">{programName}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span className="text-xs text-gray-400">Started {fmt(period.created_at)}</span>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Delete renewal period"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
        {[
          { label: "Expires", value: fmt(period.expiration_date) },
          { label: "Total Due", value: fmtMoney(period.total_due) },
          { label: "Paid", value: fmtMoney(period.total_paid) },
          { label: "Balance", value: fmtMoney(period.balance), highlight: period.balance > 0 },
        ].map((cell) => (
          <div key={cell.label} className="bg-white px-4 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">{cell.label}</p>
            <p className={`text-sm font-semibold ${cell.highlight ? "text-orange-600" : "text-gray-800"}`}>
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      {period.payments.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-400">No installments recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-gray-400 uppercase bg-gray-50">
                <th className="px-4 py-2 text-left w-8">#</th>
                <th className="px-4 py-2 text-left">Due Date</th>
                <th className="px-4 py-2 text-left">Paid Date</th>
                <th className="px-4 py-2 text-right">Amount Due</th>
                <th className="px-4 py-2 text-right">Amount Paid</th>
                <th className="px-4 py-2 text-left">Paid To</th>
                <th className="px-4 py-2 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {period.payments.map((payment) => (
                <PaymentRow
                  key={payment.payment_id}
                  payment={payment}
                  periodId={period.period_id}
                  totalInstallments={period.payments.length}
                  onSave={onSave}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AppConfirmModal
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setDeleteError(null);
          setConfirmDelete(open);
        }}
        title={isActiveDelete ? "Delete Active Enrollment?" : "Delete Renewal Period?"}
        description={deleteDescription}
        variant="destructive"
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          setDeleteError(null);
          try {
            await onDelete(period.period_id);
            setConfirmDelete(false);
          } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Delete failed. Please try again.");
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}

// ─── PaymentRow ───────────────────────────────────────────────────────────────

interface PaymentRowProps {
  payment: RenewalPayment;
  periodId: string;
  totalInstallments: number;
  onSave: (periodId: string, paymentId: string, updates: UpdateRenewalPaymentRequest) => Promise<void>;
}

function PaymentRow({ payment, periodId, totalInstallments, onSave }: PaymentRowProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    payment_date: "",
    amount_due: "",
    amount_paid: "",
    paid_to: "",
  });

  const startEdit = () => {
    setForm({
      payment_date: payment.payment_date ?? "",
      amount_due: payment.amount_due.toFixed(2),
      amount_paid: payment.amount_paid.toFixed(2),
      paid_to: payment.paid_to,
    });
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    const amountDue = parseFloat(form.amount_due);
    const amountPaid = parseFloat(form.amount_paid);

    if (isNaN(amountDue) || amountDue < 0) {
      setError("Amount due must be ≥ 0.");
      return;
    }
    if (isNaN(amountPaid) || amountPaid < 0) {
      setError("Amount paid must be ≥ 0.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(periodId, payment.payment_id, {
        payment_date: form.payment_date || null,
        amount_due: amountDue,
        amount_paid: amountPaid,
        paid_to: form.paid_to,
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const isPaid = payment.payment_date !== null && payment.amount_paid >= payment.amount_due;

  if (editing) {
    return (
      <>
        <tr className="bg-blue-50/40">
          <td className="px-4 py-2 text-gray-500">{payment.installment_number}</td>
          <td className="px-4 py-2 text-gray-400 text-xs">{fmt(payment.due_date)}</td>
          <td className="px-4 py-2">
            <Input
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
              className="h-8 text-xs w-32"
            />
          </td>
          <td className="px-4 py-2 text-right">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount_due}
              onChange={(e) => setForm((f) => ({ ...f, amount_due: e.target.value }))}
              className="h-8 text-xs w-24 text-right ml-auto"
            />
          </td>
          <td className="px-4 py-2 text-right">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount_paid}
              onChange={(e) => setForm((f) => ({ ...f, amount_paid: e.target.value }))}
              className="h-8 text-xs w-24 text-right ml-auto"
            />
          </td>
          <td className="px-4 py-2">
            <Input
              type="text"
              placeholder="e.g. Cash"
              value={form.paid_to}
              onChange={(e) => setForm((f) => ({ ...f, paid_to: e.target.value }))}
              className="h-8 text-xs w-28"
            />
          </td>
          <td className="px-4 py-2">
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1 rounded text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                title="Save"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        </tr>
        {error && (
          <tr className="bg-red-50">
            <td colSpan={7} className="px-4 py-1.5 text-xs text-red-600">
              {error}
            </td>
          </tr>
        )}
      </>
    );
  }

  const tooltipText = totalInstallments === 1
    ? "The single full payment for this renewal period."
    : `Payment ${payment.installment_number} of ${totalInstallments} — the total cost for this renewal is split across ${totalInstallments} installments.`;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2.5 text-gray-500">
        <div className="flex items-center gap-1">
          {payment.installment_number}
          <div className="relative group">
            <Info className="h-3 w-3 text-gray-300 hover:text-gray-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-gray-800 text-white text-xs rounded-md px-2.5 py-2 shadow-lg z-10 pointer-events-none">
              <p className="font-semibold mb-0.5">Installment {payment.installment_number} of {totalInstallments}</p>
              <p className="text-gray-300 leading-relaxed">{tooltipText}</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-gray-700">{fmt(payment.due_date)}</td>
      <td className="px-4 py-2.5">
        {payment.payment_date ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-gray-700">{fmt(payment.payment_date)}</span>
            {isPaid && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                Paid Off
              </span>
            )}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right font-medium text-gray-800">
        {fmtMoney(payment.amount_due)}
      </td>
      <td className="px-4 py-2.5 text-right font-medium text-gray-800">
        {fmtMoney(payment.amount_paid)}
      </td>
      <td className="px-4 py-2.5 text-gray-600">
        {payment.paid_to || <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-2.5">
        <button
          onClick={startEdit}
          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Edit payment"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── PaymentHistory ───────────────────────────────────────────────────────────

export function PaymentHistory({ studentId }: { studentId: string }) {
  const { schoolId } = useSchool();
  const { periods, loading, loadPeriods, updatePayment, deletePeriod } = useStudentRenewals();
  const { programs } = usePrograms();

  useEffect(() => {
    if (schoolId && periods.length === 0) loadPeriods();
  }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  const programMap = useMemo(
    () => new Map(programs.map((p) => [p.program_id, p])),
    [programs],
  );

  const studentPeriods = useMemo(
    () =>
      [...periods.filter((p) => p.student_id === studentId)]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((p) => enrichPeriod(p, p.program_id ? programMap.get(p.program_id) : undefined)),
    [periods, studentId, programMap],
  );

  if (loading && studentPeriods.length === 0) return <PaymentHistorySkeleton />;

  if (studentPeriods.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-400 text-sm">
        No payment history found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {studentPeriods.map((period, idx) => {
        const displayStatus = resolveDisplayStatus(period, idx === 0);
        const programName = period.program_id
          ? (programMap.get(period.program_id)?.name ?? "Unknown Program")
          : "No Program";

        return (
          <PeriodBlock
            key={period.period_id}
            period={period}
            displayStatus={displayStatus}
            programName={programName}
            onSave={updatePayment}
            onDelete={deletePeriod}
          />
        );
      })}
    </div>
  );
}
