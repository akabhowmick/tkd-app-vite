import { useEffect, useMemo } from "react";
import { Student } from "../../../../types/user";
import { useStudentRenewals, deriveUiStatus } from "../../../../context/StudentRenewalContext";
import { useBelts } from "../../../../context/BeltContext";
import { usePrograms } from "../../../../context/ProgramContext";

interface StudentProfilePageProps {
  student: Student;
  onBack: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  payment_overdue: "bg-orange-100 text-orange-700",
  expiring_soon: "bg-yellow-100 text-yellow-800",
  grace_period: "bg-orange-100 text-orange-700",
  expired: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
  milestone: "bg-purple-100 text-purple-700",
  renewed: "bg-gray-100 text-gray-600",
  quit: "bg-gray-100 text-gray-600",
};

const fmt = (date: string | null) =>
  date ? new Date(date).toLocaleDateString() : "—";

const fmtMoney = (amount: number) =>
  `$${amount.toFixed(2)}`;

export const StudentProfilePage = ({ student, onBack }: StudentProfilePageProps) => {
  const { periods, loadPeriods } = useStudentRenewals();
  const { ranks } = useBelts();
  const { programs } = usePrograms();

  useEffect(() => {
    if (periods.length === 0) loadPeriods();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const programMap = useMemo(
    () => new Map(programs.map((p) => [p.program_id, p])),
    [programs],
  );

  const studentPeriods = useMemo(
    () =>
      [...periods.filter((p) => p.student_id === student.id)].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [periods, student.id],
  );

  const currentRank = ranks.find((r) => r.rank_id === student.current_rank_id);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Back to Students
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-black">{student.name}</h1>
            {currentRank ? (
              <span
                className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: currentRank.color_code || "#6b7280" }}
              >
                {currentRank.rank_name}
              </span>
            ) : (
              <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                No belt assigned
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Email</p>
            <p className="text-sm text-black">{student.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Phone</p>
            <p className="text-sm text-black">{student.phone || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <h2 className="text-xl font-bold text-black mb-4">Payment History</h2>

      {studentPeriods.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-400 text-sm">
          No payment history found.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {studentPeriods.map((period) => {
            const program = period.program_id ? programMap.get(period.program_id) : undefined;
            const uiStatus = deriveUiStatus(period, program);
            const statusClass = STATUS_COLORS[uiStatus] ?? "bg-gray-100 text-gray-600";

            return (
              <div key={period.period_id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusClass}`}
                      >
                        {uiStatus.replace(/_/g, " ")}
                      </span>
                      {program && (
                        <span className="text-xs text-gray-500">{program.name}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      Started {fmt(period.created_at)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Expires: </span>
                      <span className="text-black">{fmt(period.expiration_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Due: </span>
                      <span className="text-black font-medium">{fmtMoney(period.total_due)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Paid: </span>
                      <span className="text-black font-medium">{fmtMoney(period.total_paid)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Balance: </span>
                      <span
                        className={`font-medium ${period.balance > 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        {fmtMoney(period.balance)}
                      </span>
                    </div>
                  </div>
                </div>

                {period.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
                        <tr>
                          <th className="px-4 py-2 text-left">#</th>
                          <th className="px-4 py-2 text-left">Due</th>
                          <th className="px-4 py-2 text-left">Paid Date</th>
                          <th className="px-4 py-2 text-right">Due</th>
                          <th className="px-4 py-2 text-right">Paid</th>
                          <th className="px-4 py-2 text-left">Paid To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {period.payments.map((payment) => (
                          <tr key={payment.payment_id} className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-500">
                              {payment.installment_number}
                            </td>
                            <td className="px-4 py-2 text-gray-700">{fmt(payment.due_date)}</td>
                            <td className="px-4 py-2">
                              {payment.payment_date ? (
                                <span className="text-green-700">{fmt(payment.payment_date)}</span>
                              ) : (
                                <span className="text-orange-500">Unpaid</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              {fmtMoney(payment.amount_due)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span
                                className={
                                  payment.amount_paid >= payment.amount_due
                                    ? "text-green-700"
                                    : "text-orange-600"
                                }
                              >
                                {fmtMoney(payment.amount_paid)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-500">{payment.paid_to || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400">No payments recorded.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
