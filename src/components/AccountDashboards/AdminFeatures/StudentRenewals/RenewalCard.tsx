import React from "react";
import { RenewalCardProps, StatusConfig } from "../../../../types/student_renewal";

const statusConfigs: Record<string, StatusConfig> = {
  paid: {
    color: "bg-green-100 text-green-800 border-green-200",
    bgColor: "bg-green-50 border-green-200",
    icon: "✓",
    text: "Paid",
  },
  expired: {
    color: "bg-red-100 text-red-800 border-red-200",
    bgColor: "bg-red-50 border-red-200",
    icon: "❌",
    text: "Expired",
  },
  active: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "bg-blue-50 border-blue-200",
    icon: "⏰",
    text: "Active",
  },
};

export const RenewalCard: React.FC<RenewalCardProps> = ({
  renewal,
  onMarkPaid,
  onDelete,
  onResolveAsQuit,
  onResolveWithNext,
  statusMessage,
}) => {
  const isExpired = new Date(renewal.expiration_date) < new Date();
  const isPaid = renewal.amount_paid >= renewal.amount_due;
  const statusKey = isPaid ? "paid" : isExpired ? "expired" : "active";
  const statusConfig = statusConfigs[statusKey];

  const renderDetail = (label: string, value: string | number | undefined) =>
    value ? (
      <p className="text-sm text-gray-600">
        {label}: {value}
      </p>
    ) : null;

  const renderActionButton = (label: string, onClick: () => void, color: string) => (
    <button
      onClick={onClick}
      className={`${color} hover:opacity-90 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm`}
    >
      {label}
    </button>
  );

  return (
    <div className={`${statusConfig.bgColor} border rounded-lg p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{renewal.duration_months} Month Renewal</h3>
          {renderDetail("Student ID", renewal.student_id)}
          {renderDetail("Expires", new Date(renewal.expiration_date).toLocaleDateString())}
          {renderDetail("Classes", renewal.number_of_classes)}
          {isPaid && renderDetail("Paid to", renewal.paid_to)}
          {statusMessage && (
            <p className="text-sm text-yellow-700 font-medium mt-1">{statusMessage}</p>
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
          <span className="text-2xl font-bold text-gray-900">${renewal.amount_due}</span>
          <span className="text-sm text-gray-600 ml-2">(Paid: ${renewal.amount_paid})</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 py-2">
        {!isPaid &&
          renderActionButton("Mark Paid", () => onMarkPaid(renewal.renewal_id), "bg-green-600")}
        {onResolveAsQuit &&
          renderActionButton("Quit", () => onResolveAsQuit(renewal.renewal_id), "bg-yellow-500")}
        {onResolveWithNext &&
          renderActionButton("Renew", () => onResolveWithNext(renewal), "bg-blue-600")}
        {renderActionButton("Delete", () => onDelete(renewal.renewal_id), "bg-red-600")}
      </div>
    </div>
  );
};
