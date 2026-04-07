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

type PaymentForm = {
  payment_date: string;
  amount_due: string;
  amount_paid: string;
  paid_to: string;
};

export const RenewalCard: React.FC<RenewalCardProps> = ({
  period,
  onMarkPaid,
  onDelete,
  onResolveAsQuit,
  onRenew,
  onAddPayment,
}) => {
  const { students } = useSchool();
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const student = students.find((s) => s.id === period.student_id);
  const style = STATUS_STYLES[period.ui_status] ?? STATUS_STYLES.active;
  const isPaid = period.balance <= 0 && period.total_due > 0;

  const nextInstallment = period.payments.length + 1;
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    payment_date: new Date().toISOString().split("T")[0],
    amount_due: String(period.balance.toFixed(2)),
    amount_paid: "0",
    paid_to: "",
  });

  const openAddPayment = () => {
    setPaymentForm({
      payment_date: new Date().toISOString().split("T")[0],
      amount_due: String(period.balance.toFixed(2)),
      amount_paid: "0",
      paid_to: "",
    });
    setPaymentError(null);
    setManageOpen(false);
    setAddPaymentOpen(true);
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    if (!paymentForm.payment_date) { setPaymentError("Payment date is required."); return; }
    if (!paymentForm.paid_to.trim()) { setPaymentError("Paid To is required."); return; }
    const amountDue = parseFloat(paymentForm.amount_due);
    const amountPaid = parseFloat(paymentForm.amount_paid);
    if (isNaN(amountDue) || amountDue < 0) { setPaymentError("Invalid amount due."); return; }
    if (isNaN(amountPaid) || amountPaid < 0) { setPaymentError("Invalid amount paid."); return; }

    setPaymentLoading(true);
    try {
      if (onAddPayment) {
        onAddPayment(period.period_id, {
          payment_date: paymentForm.payment_date,
          amount_due: amountDue,
          amount_paid: amountPaid,
          paid_to: paymentForm.paid_to.trim(),
          installment_number: nextInstallment,
        });
      }
      setAddPaymentOpen(false);
    } finally {
      setPaymentLoading(false);
    }
  };

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
          Expires: <strong>{new Date(period.expiration_date).toLocaleDateString()}</strong>
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
                  <span className={settled ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                    {settled
                      ? "Paid"
                      : `Bal: $${(payment.amount_due - payment.amount_paid).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500 mt-1">
                  <span>
                    {new Date(payment.payment_date).toLocaleDateString()} · {payment.paid_to}
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
      <AppModal
        open={manageOpen}
        onOpenChange={setManageOpen}
        title="Manage Renewal"
        size="compact"
      >
        <div className="flex flex-col gap-2">
          {!isPaid && (
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => {
                const firstUnpaid = period.payments.find((p) => p.amount_paid < p.amount_due);
                if (firstUnpaid) onMarkPaid(period.period_id, firstUnpaid.payment_id);
                setManageOpen(false);
              }}
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
              onClick={() => { onRenew(period); setManageOpen(false); }}
            >
              🔄 Renew
            </Button>
          )}
          {onResolveAsQuit && (
            <Button
              variant="outline"
              className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50"
              onClick={() => { onResolveAsQuit(period.period_id); setManageOpen(false); }}
            >
              🚪 Mark as Quit
            </Button>
          )}
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => { setManageOpen(false); setDeleteConfirmOpen(true); }}
          >
            🗑 Delete
          </Button>
        </div>
      </AppModal>

      {/* ── Add Payment Modal ── */}
      <AppFormModal
        open={addPaymentOpen}
        onOpenChange={setAddPaymentOpen}
        title={`Add Installment #${nextInstallment}`}
        description={`Balance remaining: $${period.balance.toFixed(2)}`}
        size="compact"
        onSubmit={handleAddPaymentSubmit}
        submitLabel="Add Payment"
        loading={paymentLoading}
        error={paymentError}
      >
        <ModalField label="Payment Date" required htmlFor="pay-date">
          <Input
            id="pay-date"
            type="date"
            value={paymentForm.payment_date}
            onChange={(e) => setPaymentForm((f) => ({ ...f, payment_date: e.target.value }))}
          />
        </ModalField>
        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Amount Due" required htmlFor="pay-due">
            <Input
              id="pay-due"
              type="number"
              step="0.01"
              value={paymentForm.amount_due}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount_due: e.target.value }))}
            />
          </ModalField>
          <ModalField label="Amount Paid" required htmlFor="pay-paid">
            <Input
              id="pay-paid"
              type="number"
              step="0.01"
              value={paymentForm.amount_paid}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount_paid: e.target.value }))}
            />
          </ModalField>
        </div>
        <ModalField label="Paid To" required htmlFor="pay-to">
          <Input
            id="pay-to"
            type="text"
            placeholder="e.g., MR, Amy"
            value={paymentForm.paid_to}
            onChange={(e) => setPaymentForm((f) => ({ ...f, paid_to: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Delete Confirm ── */}
      <AppConfirmModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Renewal?"
        description="Are you sure you want to delete this renewal period? This cannot be undone."
        onConfirm={() => { onDelete(period.period_id); setDeleteConfirmOpen(false); }}
        confirmLabel="Delete"
      />
    </div>
  );
};
