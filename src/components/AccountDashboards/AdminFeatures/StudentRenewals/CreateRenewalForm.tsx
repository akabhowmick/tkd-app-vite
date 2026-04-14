import React, { useState, useEffect, useCallback } from "react";
import { CreateRenewalFormProps, InstallmentInput } from "../../../../types/student_renewal";
import { useSchool } from "../../../../context/SchoolContext";
import { usePrograms } from "../../../../context/ProgramContext";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function splitEvenly(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor((total * 100) / count) / 100;
  const remainder = Math.round((total - base * count) * 100) / 100;
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? Math.round((base + remainder) * 100) / 100 : base,
  );
}

function generateInstallments(
  startDate: string,
  numberOfPayments: number,
  totalAmount: number,
): InstallmentInput[] {
  const amounts = splitEvenly(totalAmount, numberOfPayments);
  return Array.from({ length: numberOfPayments }, (_, i) => ({
    installment_number: i + 1,
    due_date: addMonths(startDate, i),
    amount_due: amounts[i] ?? 0,
    amount_paid: 0,
    paid_to: "",
  }));
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const CreateRenewalForm: React.FC<CreateRenewalFormProps> = ({ onSubmit, onCancel }) => {
  const { students, schoolId } = useSchool();
  const { programs } = usePrograms();

  // ── Period-level fields
  const [studentId, setStudentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expirationDate, setExpirationDate] = useState("");
  const [numberOfPayments, setNumberOfPayments] = useState("1");
  const [totalAmount, setTotalAmount] = useState("");
  const [numberOfClasses, setNumberOfClasses] = useState("");

  // ── Installment rows
  const [installments, setInstallments] = useState<InstallmentInput[]>([]);

  // ── UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Derive whether the selected program is milestone-based
  const selectedProgram = programs.find((p) => p.program_id === programId);
  const isMilestone = selectedProgram?.program_type === "milestone_based";

  // Auto-select first program on load
  useEffect(() => {
    if (programs.length > 0 && !programId) {
      const regular = programs.find((p) => p.name === "Regular") ?? programs[0];
      setProgramId(regular.program_id);
    }
  }, [programs, programId]);

  // Auto-compute expiration when duration/start changes (time_based only)
  useEffect(() => {
    if (!isMilestone && durationMonths && startDate) {
      setExpirationDate(addMonths(startDate, parseInt(durationMonths)));
    }
    if (isMilestone) {
      setExpirationDate("");
      setDurationMonths("");
    }
  }, [durationMonths, startDate, isMilestone]);

  // Regenerate installments when key fields change
  const regenerateInstallments = useCallback(() => {
    const count = parseInt(numberOfPayments) || 1;
    const total = parseFloat(totalAmount) || 0;
    if (!startDate) return;
    setInstallments(generateInstallments(startDate, count, total));
  }, [startDate, numberOfPayments, totalAmount]);

  useEffect(() => {
    regenerateInstallments();
  }, [regenerateInstallments]);

  const updateInstallment = (
    index: number,
    field: keyof InstallmentInput,
    value: string | number,
  ) => {
    setInstallments((prev) =>
      prev.map((inst, i) => (i === index ? { ...inst, [field]: value } : inst)),
    );
  };

  const installmentTotal = installments.reduce((sum, i) => sum + (i.amount_due || 0), 0);
  const totalMismatch = totalAmount && Math.abs(installmentTotal - parseFloat(totalAmount)) > 0.01;

  const handleSubmit = async () => {
    setError("");

    if (!studentId) return setError("Please select a student.");
    if (!programId) return setError("Please select a program.");
    if (!isMilestone && !durationMonths) return setError("Duration is required.");
    if (!isMilestone && !expirationDate) return setError("Expiration date is required.");
    if (!numberOfClasses) return setError("Number of classes is required.");
    if (!totalAmount || parseFloat(totalAmount) <= 0) return setError("Total amount is required.");
    if (installments.length === 0) return setError("At least one installment is required.");

    for (let i = 0; i < installments.length; i++) {
      const inst = installments[i];
      if (!inst.due_date) return setError(`Installment ${i + 1}: due date is required.`);
      if (inst.amount_due <= 0) return setError(`Installment ${i + 1}: amount must be positive.`);
    }

    setLoading(true);
    try {
      await onSubmit({
        period: {
          student_id: studentId,
          school_id: schoolId,
          duration_months: isMilestone ? null : parseInt(durationMonths),
          expiration_date: isMilestone ? null : expirationDate,
          number_of_classes: parseInt(numberOfClasses),
          program_id: programId,
        },
        installments: installments.map((inst) => ({
          installment_number: inst.installment_number,
          due_date: inst.due_date,
          payment_date: inst.amount_paid > 0 ? new Date().toISOString().split("T")[0] : null,
          amount_due: inst.amount_due,
          amount_paid: inst.amount_paid,
          paid_to: inst.paid_to,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-black rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Register Renewal</h2>

        <div className="space-y-5">
          {/* Student */}
          <div>
            <label className={labelClass}>Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Select a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id!}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Program */}
          <div>
            <label className={labelClass}>Program</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {programs.map((prog) => (
                <button
                  key={prog.program_id}
                  type="button"
                  onClick={() => setProgramId(prog.program_id)}
                  className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border-2 text-left transition-colors text-sm ${
                    programId === prog.program_id
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <span>{prog.name}</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {prog.program_type === "milestone_based" ? "Milestone" : "Time-based"}
                  </span>
                </button>
              ))}
            </div>
            {isMilestone && (
              <p className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-md px-3 py-2 mt-2">
                🏆 Milestone program — no expiration date. This renewal stays active until manually
                resolved when the student reaches their goal.
              </p>
            )}
          </div>

          {/* Duration + Classes — duration hidden for milestone */}
          <div className={`grid gap-4 ${isMilestone ? "grid-cols-1" : "grid-cols-2"}`}>
            {!isMilestone && (
              <div>
                <label className={labelClass}>Duration (months)</label>
                <input
                  type="number"
                  min="1"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className={fieldClass}
                  placeholder="3"
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Classes / week</label>
              <input
                type="number"
                min="1"
                value={numberOfClasses}
                onChange={(e) => setNumberOfClasses(e.target.value)}
                className={fieldClass}
                placeholder="2"
              />
            </div>
          </div>

          {/* Start Date + Expiration — expiration hidden for milestone */}
          <div className={`grid gap-4 ${isMilestone ? "grid-cols-1" : "grid-cols-2"}`}>
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            {!isMilestone && (
              <div>
                <label className={labelClass}>Expiration Date</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className={fieldClass}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Auto-filled from duration, override if needed
                </p>
              </div>
            )}
          </div>

          {/* Total Amount + Number of Payments */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Total Amount Due</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className={`${fieldClass} pl-7`}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Number of Payments</label>
              <select
                value={numberOfPayments}
                onChange={(e) => setNumberOfPayments(e.target.value)}
                className={fieldClass}
              >
                {[1, 2, 3, 4, 6, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "payment" : "payments"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Installment Rows */}
          {installments.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Payment Schedule</h3>
                {totalMismatch && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                    ⚠ Sum ${installmentTotal.toFixed(2)} ≠ total $
                    {parseFloat(totalAmount).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400">#</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Due Date
                </span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount Due
                </span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount Paid
                </span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Paid To
                </span>
              </div>

              {installments.map((inst, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[2rem_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-b border-gray-50 last:border-0 items-center"
                >
                  <span className="text-sm font-semibold text-gray-400">
                    {inst.installment_number}
                  </span>

                  <input
                    type="date"
                    value={inst.due_date}
                    onChange={(e) => updateInstallment(idx, "due_date", e.target.value)}
                    className="px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />

                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inst.amount_due}
                      onChange={(e) =>
                        updateInstallment(idx, "amount_due", parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={inst.amount_paid}
                      onChange={(e) =>
                        updateInstallment(idx, "amount_paid", parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>

                  <input
                    type="text"
                    value={inst.paid_to}
                    onChange={(e) => updateInstallment(idx, "paid_to", e.target.value)}
                    placeholder="MR, Amy..."
                    className="px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors"
            >
              {loading ? "Saving..." : "Register Renewal"}
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
