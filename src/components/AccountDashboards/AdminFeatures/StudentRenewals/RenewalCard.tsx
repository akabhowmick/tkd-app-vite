// File: RenewalCard.tsx
import React from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaCog } from "react-icons/fa";
import { RenewalCardProps, StatusConfig, ExpiringRenewal } from "../../../../types/student_renewal";
import { useSchool } from "../../../../context/SchoolContext";

const MySwal = withReactContent(Swal);

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
  const { students } = useSchool();
  const isExpired = new Date(renewal.expiration_date) < new Date();
  const isPaid = renewal.amount_paid >= renewal.amount_due;
  const statusKey = isPaid ? "paid" : isExpired ? "expired" : "active";
  const statusConfig = statusConfigs[statusKey];

  const student = students.find(
    (student) => student.id === (renewal.student_id as unknown as string)
  );

  const resolvedStatusMessage = statusMessage ?? (renewal as ExpiringRenewal)?.statusMessage;

  const modalBtnStyle = "w-1/2 text-white py-2 rounded-md text-sm font-semibold";

  const handleManageClick = () => {
    MySwal.fire({
      title: "Manage Renewal",
      html: (
        <div className="flex flex-col gap-2 items-center">
          {!isPaid && (
            <button
              onClick={() => {
                onMarkPaid(renewal.renewal_id);
                Swal.close();
              }}
              className={`${modalBtnStyle} bg-green-600`}
            >
              ✓ Mark Paid
            </button>
          )}
          {onResolveAsQuit && (
            <button
              onClick={() => {
                onResolveAsQuit(renewal.renewal_id);
                Swal.close();
              }}
              className={`${modalBtnStyle} bg-yellow-400`}
            >
              Quit
            </button>
          )}
          {onResolveWithNext && (
            <button
              onClick={() => {
                onResolveWithNext(renewal);
                Swal.close();
              }}
              className={`${modalBtnStyle} bg-blue-600`}
            >
              Renew
            </button>
          )}
          <button
            onClick={() => {
              onDelete(renewal.renewal_id);
              Swal.close();
            }}
            className={`${modalBtnStyle} bg-red-600`}
          >
            Delete
          </button>
        </div>
      ),
      showConfirmButton: false,
    });
  };

  const renderDetail = (label: string, value: string | number | undefined) =>
    value ? (
      <p className="text-sm text-gray-600">
        {label}: {value}
      </p>
    ) : null;

  return (
    <div
      className={`${statusConfig.bgColor} border rounded-lg p-4 flex flex-col justify-between min-h-[240px] w-full max-w-[320px]`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{renewal.duration_months} Month Renewal</h3>
          {renderDetail("Student Name", student?.name)}
          {renderDetail("Expires", new Date(renewal.expiration_date).toLocaleDateString())}
          {resolvedStatusMessage && (
            <p className="text-sm text-yellow-700 font-medium mt-1">{resolvedStatusMessage}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color} flex items-center gap-1`}
        >
          <span>{statusConfig.icon}</span>
          {statusConfig.text}
        </span>
      </div>

      <div className="mt-auto">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-2xl font-bold text-gray-900">${renewal.amount_due}</span>
            <span className="text-sm text-gray-600 ml-2">(Paid: ${renewal.amount_paid})</span>
          </div>
          <button
            onClick={handleManageClick}
            className="text-gray-700 hover:text-black text-lg"
            title="Manage Renewal"
          >
            <FaCog />
          </button>
        </div>
      </div>
    </div>
  );
};
