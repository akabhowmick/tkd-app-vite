import React, { useState } from "react";
import { FaCog, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { RenewalCardProps, RenewalPayment } from "../../../../types/student_renewal";
import { useSchool } from "../../../../context/SchoolContext";
import { AppModal, AppFormModal, AppConfirmModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";

const STATUS_STYLES: Record<string, { card: string; badge: string; icon: string; label: string }> =
  {
    active: {
      card: "bg-blue-50 border-blue-200",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "⏰",
      label: "Active",
    },
    expiring_soon: {
      card: "bg-yellow-50 border-yellow-200",
      badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: "⚠️",
      label: "Expiring Soon",
    },
    grace_period: {
      card: "bg-orange-50 border-orange-200",
      badge: "bg-orange-100 text-orange-800 border-orange-200",
      icon: "🕓",
      label: "Grace Period",
    },
    expired: {
      card: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-800 border-red-200",
      icon: "⛔",
      label: "Expired",
    },
    paid: {
      card: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-800 border-green-200",
      icon: "✓",
      label: "Paid",
    },
  };

type AddPaymentForm = {
  payment_date: string;
  amount_due: string;
  amount_paid: string;
  paid_to: string;
};

type MarkPaidForm = {
  payment_date: string;
  amount_paid: string;
  paid_to: string;
};

const today = () => new Date().toISOString().split("T")[0];

export const RenewalCard: React.FC<RenewalCardProps> = ({
  period,
  onMarkInstallmentPaid,
  onDelete,
  onResolveAsQuit,
  onRenew,
  onAddPayment,
}) => {
  const { students } = useSchool();
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Add-installment modal
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddPaymentForm>({
    payment_date: today(),
    amount_due: period.balance.toFixed(2),
    amount_paid: "0",
    paid_to: "",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Mark-paid modal
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState<{
    paymentId: string;
    amountDue: number;
    installmentNumber: number;
  } | null>(null);
  const [markPaidForm, setMarkPaidForm] = useState<MarkPaidForm>({
    payment_date: today(),
    amount_paid: "0",
    paid_to: "",
  });
  const [markPaidLoading, setMarkPaidLoading] = useState(false);
  const [markPaidError, setMarkPaidError] = useState<string | null>(null);

  const student = students.find((s) => s.id === period.student_id);
  const style = STATUS_STYLES[period.ui_status] ?? STATUS_STYLES.active;
  const isPaid = period.balance <= 0 && period.total_due > 0;
  const nextInstallment = period.payments.length + 1;

  // ── Handlers ────────────────────────────────────────────────

  const openMarkPaid = () => {
    const firstUnpaid = period.payments.find((p) => p.amount_paid < p.amount_due);
    if (!firstUnpaid) return;
    setMarkPaidTarget({
      paymentId: firstUnpaid.payment_id,
      amountDue: firstUnpaid.amount_due,
      installmentNumber: firstUnpaid.installment_number,
    });
    setMarkPaidForm({
      payment_date: today(),
      amount_paid: firstUnpaid.amount_due.toFixed(2),
      paid_to: "",
    });
    setMarkPaidError(null);
    setManageOpen(false);
    setMarkPaidOpen(true);
  };

  const handleMarkPaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markPaidTarget) return;
    setMarkPaidError(null);
    if (!markPaidForm.payment_date) { setMarkPaidError("Payment date is required."); return; }
    if (!markPaidForm.paid_to.trim()) { setMarkPaidError("Paid To is required."); return; }
    const amountPaid = parseFloat(markPaidForm.amount_paid);
    if (isNaN(amountPaid) || amountPaid < 0) { setMarkPaidError("Invalid amount paid."); return; }

    setMarkPaidLoading(true);
    try {
      await onMarkInstallmentPaid(
        period.period_id,
        markPaidTarget.paymentId,
        markPaidForm.payment_date,
        amountPaid,
        markPaidForm.paid_to.trim(),
      );
      setMarkPaidOpen(false);
    } catch {
      setMarkPaidError("Failed to record payment. Please try again.");
    } finally {
      setMarkPaidLoading(false);
    }
  };

  const openAddPayment = () => {
    setAddForm({
      payment_date: today(),
      amount_due: period.balance.toFixed(2),
      amount_paid: "0",
      paid_to: "",
    });
    setAddError(null);
    setManageOpen(false);
    setAddPaymentOpen(true);
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addForm.payment_date) { setAddError("Payment date is required."); return; }
    if (!addForm.paid_to.trim()) { setAddError("Paid To is required."); return; }
    const amountDue = parseFloat(addForm.amount_due);
    const amountPaid = parseFloat(addForm.amount_paid);
    if (isNaN(amountDue) || amountDue < 0) { setAddError("Invalid amount due."); return; }
    if (isNaN(amountPaid) || amountPaid < 0) { setAddError("Invalid amount paid."); return; }

    setAddLoading(true);
    try {
      if (onAddPayment) {
        onAddPayment(period.period_id, {
          due_date: addForm.payment_date,
          payment_date: addForm.payment_date,
          amount_due: amountDue,
          amount_paid: amountPaid,
          paid_to: addForm.paid_to.trim(),
          installment_number: nextInstallment,
        });
      }
      setAddPaymentOpen(false);
    } finally {
      setAddLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className={`${style.card} border rounded-lg p-4 flex flex-col gap-3`}>
      {/* Header row */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">
            {period.duration_months}M · {student?.name ?? "Unknown Student"}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{period.status_message}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${style.badge}`}>
            {style.icon} {style.label}
          </span>
          <button
            onClick={() => setManageOpen(true)}
            className="text-gray-500 hover:text-gray-800 transition-colors"
            title="Manage"
          >
            <FaCog />
          </button>
        </div>
      </div>

      {/* Key details */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <span>
          Expires:{" "}
          <strong>
            {period.expiration_date
              ? new Date(period.expiration_date).toLocaleDateString()
              : "—"}
          </strong>
        </span>
        <span>
          Classes/wk: <strong>{period.number_of_classes}</strong>
        </span>
        <span>
          Total Due: <strong>${period.total_due.toFixed(2)}</strong>
        </span>
        <span>
          Total Paid: <strong>${period.total_paid.toFixed(2)}</strong>
        </span>
      </div>

      {/* Balance */}
      {period.balance > 0 && (
        <div className="bg-white rounded-md px-3 py-2 text-sm font-semibold text-red-600 border border-red-100">
          Balance Owed: ${period.balance.toFixed(2)}
        </div>
      )}

      {/* Payment history toggle */}
      <button
        onClick={() => setPaymentsOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors self-start"
      >
        {paymentsOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        {period.payments.length} payment{period.payments.length !== 1 ? "s" : ""}
      </button>

      {/* Payment history rows */}
      {paymentsOpen && (
        <div className="flex flex-col gap-2 mt-1">
          {period.payments.map((payment: RenewalPayment) => {
            const settled = payment.amount_paid >= payment.amount_due;
            return (
              <div
                key={payment.payment_id}
                className={`rounded-md px-3 py-2 text-xs border ${
                  settled ? "bg-green-50 border-green-100" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Installment {payment.installment_number}
                  </span>
                  <span
                    className={
                      settled ? "text-green-600 font-semibold" : "text-red-500 font-semibold"
                    }
                  >
                    {settled
                      ? "Paid"
                      : `Bal: $${(payment.amount_due - payment.amount_paid).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 mt-1">
                  <span>
                    {payment.payment_date
                      ? new Date(payment.payment_date).toLocaleDateString()
                      : "—"}{" "}
                    · {payment.paid_to}
                  </span>
                  <span>
                    ${payment.amount_paid.toFixed(2)} / ${payment.amount_due.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Manage Modal ── */}
      <AppModal open={manageOpen} onOpenChange={setManageOpen} title="Manage Renewal" size="compact">
        <div className="flex flex-col gap-2">
          {!isPaid && (
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={openMarkPaid}
            >
              ✓ Mark Next Payment Paid
            </Button>
          )}
          {onAddPayment && (
            <Button variant="default" className="w-full" onClick={openAddPayment}>
              ＋ Add Payment Installment
            </Button>
          )}
          {onRenew && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                onRenew(period);
                setManageOpen(false);
              }}
            >
              🔄 Renew
            </Button>
          )}
          {onResolveAsQuit && (
            <Button
              variant="outline"
              className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50"
              onClick={() => {
                onResolveAsQuit(period.period_id);
                setManageOpen(false);
              }}
            >
              🚪 Mark as Quit
            </Button>
          )}
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              setManageOpen(false);
              setDeleteConfirmOpen(true);
            }}
          >
            🗑 Delete
          </Button>
        </div>
      </AppModal>

      {/* ── Mark Payment Paid Modal ── */}
      <AppFormModal
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        title={`Mark Installment #${markPaidTarget?.installmentNumber ?? ""} Paid`}
        description={`Amount due: $${markPaidTarget?.amountDue.toFixed(2) ?? "0.00"}`}
        size="compact"
        onSubmit={handleMarkPaidSubmit}
        submitLabel="Record Payment"
        loading={markPaidLoading}
        error={markPaidError}
      >
        <ModalField label="Payment Date" required htmlFor="mp-date">
          <Input
            id="mp-date"
            type="date"
            value={markPaidForm.payment_date}
            onChange={(e) => setMarkPaidForm((f) => ({ ...f, payment_date: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Amount Paid" required htmlFor="mp-amount">
          <Input
            id="mp-amount"
            type="number"
            step="0.01"
            value={markPaidForm.amount_paid}
            onChange={(e) => setMarkPaidForm((f) => ({ ...f, amount_paid: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Paid To" required htmlFor="mp-to">
          <Input
            id="mp-to"
            type="text"
            placeholder="e.g., MR, Amy"
            value={markPaidForm.paid_to}
            onChange={(e) => setMarkPaidForm((f) => ({ ...f, paid_to: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Add Installment Modal ── */}
      <AppFormModal
        open={addPaymentOpen}
        onOpenChange={setAddPaymentOpen}
        title={`Add Installment #${nextInstallment}`}
        description={`Balance remaining: $${period.balance.toFixed(2)}`}
        size="compact"
        onSubmit={handleAddPaymentSubmit}
        submitLabel="Add Payment"
        loading={addLoading}
        error={addError}
      >
        <ModalField label="Payment Date" required htmlFor="pay-date">
          <Input
            id="pay-date"
            type="date"
            value={addForm.payment_date}
            onChange={(e) => setAddForm((f) => ({ ...f, payment_date: e.target.value }))}
          />
        </ModalField>
        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Amount Due" required htmlFor="pay-due">
            <Input
              id="pay-due"
              type="number"
              step="0.01"
              value={addForm.amount_due}
              onChange={(e) => setAddForm((f) => ({ ...f, amount_due: e.target.value }))}
            />
          </ModalField>
          <ModalField label="Amount Paid" required htmlFor="pay-paid">
            <Input
              id="pay-paid"
              type="number"
              step="0.01"
              value={addForm.amount_paid}
              onChange={(e) => setAddForm((f) => ({ ...f, amount_paid: e.target.value }))}
            />
          </ModalField>
        </div>
        <ModalField label="Paid To" required htmlFor="pay-to">
          <Input
            id="pay-to"
            type="text"
            placeholder="e.g., MR, Amy"
            value={addForm.paid_to}
            onChange={(e) => setAddForm((f) => ({ ...f, paid_to: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Delete Confirm ── */}
      <AppConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Renewal?"
        description="Are you sure you want to delete this renewal period? This cannot be undone."
        onConfirm={() => {
          onDelete(period.period_id);
          setDeleteConfirmOpen(false);
        }}
        confirmLabel="Delete"
      />
    </div>
  );
};
