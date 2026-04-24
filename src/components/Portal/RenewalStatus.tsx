import { useEffect, useState } from "react";
import { getStudentRenewal } from "../../api/PortalRequests/portalRequests";
import { RenewalPeriod } from "../../types/student_renewal";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Props {
  studentId: string;
  studentName?: string;
}

export const RenewalStatus = ({ studentId, studentName }: Props) => {
  const [renewal, setRenewal] = useState<RenewalPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudentRenewal(studentId)
      .then(setRenewal)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  }

  if (!renewal) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle size={28} className="text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No active membership found.</p>
        {studentName && (
          <p className="text-xs text-gray-400 mt-0.5">Contact your school for details.</p>
        )}
      </div>
    );
  }

  const daysLeft = renewal.expiration_date
    ? Math.ceil(
        (new Date(renewal.expiration_date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
          86_400_000,
      )
    : null;

  const isPaid = renewal.balance <= 0 && renewal.total_due > 0;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 15 && daysLeft >= 0;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  return (
    <div className="flex flex-col gap-4">
      {studentName && (
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {studentName}
        </p>
      )}

      {/* Expiration */}
      <div
        className={`rounded-xl border p-4 flex items-center gap-3 ${
          isOverdue
            ? "bg-red-50 border-red-200"
            : isExpiringSoon
            ? "bg-yellow-50 border-yellow-200"
            : "bg-green-50 border-green-200"
        }`}
      >
        <Clock
          size={20}
          className={
            isOverdue ? "text-red-500" : isExpiringSoon ? "text-yellow-600" : "text-green-600"
          }
        />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {renewal.expiration_date
              ? new Date(renewal.expiration_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "No expiration (milestone program)"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOverdue
              ? `Expired ${Math.abs(daysLeft!)} day${Math.abs(daysLeft!) !== 1 ? "s" : ""} ago`
              : isExpiringSoon
              ? `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
              : daysLeft !== null
              ? `${daysLeft} days remaining`
              : "Active membership"}
          </p>
        </div>
      </div>

      {/* Payment summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Due</span>
          <span className="text-sm font-semibold text-gray-900">
            ${renewal.total_due.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Paid</span>
          <span className="text-sm font-semibold text-green-700">
            ${renewal.total_paid.toFixed(2)}
          </span>
        </div>
        {renewal.balance > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-medium text-red-600">Balance Owed</span>
            <span className="text-sm font-bold text-red-600">
              ${renewal.balance.toFixed(2)}
            </span>
          </div>
        )}
        {isPaid && (
          <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
            <CheckCircle2 size={15} /> Fully paid
          </div>
        )}
      </div>

      {/* Classes per week */}
      <p className="text-xs text-gray-400 text-center">
        {renewal.number_of_classes} class{renewal.number_of_classes !== 1 ? "es" : ""} per week ·{" "}
        {renewal.duration_months ? `${renewal.duration_months}-month program` : "Milestone program"}
      </p>
    </div>
  );
};
