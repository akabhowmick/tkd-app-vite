import React, { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaCog, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { RenewalCardProps, RenewalPayment } from "../../../../types/student_renewal";
import { useSchool } from "../../../../context/SchoolContext";

const MySwal = withReactContent(Swal);

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

  const student = students.find((s) => s.id === period.student_id);
  const style = STATUS_STYLES[period.ui_status] ?? STATUS_STYLES.active;
  const isPaid = period.balance <= 0 && period.total_due > 0;

  const modalBtnStyle = "w-full text-white py-2 rounded-md text-sm font-semibold mb-2";

  const handleManage = () => {
    MySwal.fire({
      title: "Manage Renewal",
      html: (
        <div className="flex flex-col gap-2 items-center">
          {!isPaid && (
            <button
              onClick={() => {
                const firstUnpaid = period.payments.find((p) => p.amount_paid < p.amount_due);
                if (firstUnpaid) {
                  onMarkPaid(period.period_id, firstUnpaid.payment_id);
                }
                Swal.close();
              }}
              className={`${modalBtnStyle} bg-green-600`}
            >
              ✓ Mark Next Payment Paid
            </button>
          )}
          {onAddPayment && (
            <button
              onClick={() => {
                handleAddPayment();
                Swal.close();
              }}
              className={`${modalBtnStyle} bg-blue-600`}
            >
              ＋ Add Payment Installment
            </button>
          )}
          {onRenew && (
            <button
              onClick={() => {
                onRenew(period);
                Swal.close();
              }}
              className={`${modalBtnStyle} bg-purple-600`}
            >
              🔄 Renew
            </button>
          )}
          {onResolveAsQuit && (
            <button
              onClick={() => {
                onResolveAsQuit(period.period_id);
                Swal.close();
              }}
              className={`${modalBtnStyle} bg-yellow-500`}
            >
              🚪 Mark as Quit
            </button>
          )}
          <button
            onClick={() => {
              onDelete(period.period_id);
              Swal.close();
            }}
            className={`${modalBtnStyle} bg-red-600`}
          >
            🗑 Delete
          </button>
        </div>
      ),
      showConfirmButton: false,
    });
  };

  const handleAddPayment = async () => {
    if (!onAddPayment) return;

    const nextInstallment = period.payments.length + 1;
    const remaining = period.balance;

    const { value } = await Swal.fire({
      title: `Add Installment #${nextInstallment}`,
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Payment Date</label>
            <input id="pay-date" type="date" value="${new Date().toISOString().split("T")[0]}"
              style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;margin-top:4px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Amount Due (Balance: $${remaining.toFixed(2)})</label>
            <input id="pay-due" type="number" step="0.01" value="${remaining.toFixed(2)}"
              style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;margin-top:4px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Amount Paid</label>
            <input id="pay-paid" type="number" step="0.01" value="0"
              style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;margin-top:4px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Paid To</label>
            <input id="pay-to" type="text" placeholder="e.g. MR, Amy"
              style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;margin-top:4px"/>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Add Payment",
      confirmButtonColor: "#2563eb",
      preConfirm: () => ({
        payment_date: (document.getElementById("pay-date") as HTMLInputElement).value,
        amount_due: parseFloat((document.getElementById("pay-due") as HTMLInputElement).value),
        amount_paid: parseFloat((document.getElementById("pay-paid") as HTMLInputElement).value),
        paid_to: (document.getElementById("pay-to") as HTMLInputElement).value,
        installment_number: nextInstallment,
      }),
    });

    if (value) {
      onAddPayment(period.period_id, value);
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
            onClick={handleManage}
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
    </div>
  );
};
