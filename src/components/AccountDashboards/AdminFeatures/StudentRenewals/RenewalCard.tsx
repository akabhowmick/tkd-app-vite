import { RenewalCardProps, StatusConfig } from "../../../../types/student_renewal";

// Renewal Card Component
export const RenewalCard: React.FC<RenewalCardProps> = ({ renewal, onMarkPaid, onDelete }) => {
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