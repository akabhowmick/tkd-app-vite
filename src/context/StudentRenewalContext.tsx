/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from "react";
import { track } from "../analytics/posthog";
import {
  RenewalPeriod,
  RenewalPayment,
  RenewalPeriodWithUiStatus,
  UiRenewalStatus,
  GroupedRenewals,
  CreateRenewalRequest,
  CreateRenewalPaymentRequest,
  UpdateRenewalPeriodRequest,
} from "../types/student_renewal";
import { SchoolProgram } from "../types/programs";
import {
  getRenewalPeriods,
  createRenewalPeriod,
  createRenewalPayment,
  updateRenewalPeriod,
  markInstallmentPaid,
  deleteRenewalPeriod,
  deleteRenewalPayment,
  resolveAsQuit,
  resolveWithRenewal,
  getRenewalPeriodById,
} from "../api/StudentRenewalsRequests/studentRenewalsRequests";
import { useSchool } from "./SchoolContext";
import { usePrograms } from "./ProgramContext";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const GRACE_PERIOD_DAYS = 7;
const WARNING_PERIOD_DAYS = 15;

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────

function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
}

function isInstallmentOverdue(payment: RenewalPayment): boolean {
  if (payment.payment_date !== null) return false;
  if (!payment.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(payment.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function getNextUnpaidInstallment(payments: RenewalPayment[]): RenewalPayment | null {
  return payments.find((p) => p.payment_date === null && p.amount_paid < p.amount_due) ?? null;
}

// ─────────────────────────────────────────────
// Status derivation
// milestone_based: payment_overdue → paid → active (never time-based statuses)
// time_based: payment_overdue → expired → grace_period → expiring_soon → paid → active
// ─────────────────────────────────────────────

export function deriveUiStatus(period: RenewalPeriod, program?: SchoolProgram): UiRenewalStatus {
  const isMilestone = program?.program_type === "milestone_based";

  // Resolved states always come from DB
  if (period.status === "renewed") return "renewed";
  if (period.status === "quit") return "quit";
  if (period.status === "expired") return "expired";

  // Overdue installment — applies to both program types
  const hasOverdueInstallment = period.payments.some(isInstallmentOverdue);
  if (hasOverdueInstallment) return "payment_overdue";

  // Fully paid
  if (period.balance <= 0 && period.total_due > 0) return "paid";

  // Milestone-based: no expiration logic — just active
  if (isMilestone) return "active";

  // Time-based: expiration-driven
  if (!period.expiration_date) return "active";
  const days = getDaysUntilExpiration(period.expiration_date);
  if (days < -GRACE_PERIOD_DAYS) return "expired";
  if (days < 0) return "grace_period";
  if (days <= WARNING_PERIOD_DAYS) return "expiring_soon";

  return "active";
}

function getStatusMessage(
  uiStatus: UiRenewalStatus,
  days: number | null,
  isMilestone: boolean,
): string {
  if (isMilestone && uiStatus === "active") return "Active — milestone program";
  switch (uiStatus) {
    case "paid":
      return "Fully paid";
    case "payment_overdue":
      return "Installment overdue — payment required";
    case "expiring_soon":
      return `Expires in ${days} day${days === 1 ? "" : "s"}`;
    case "grace_period":
      return `${Math.abs(days ?? 0)} day${Math.abs(days ?? 0) === 1 ? "" : "s"} overdue — grace period`;
    case "expired":
      return `Expired ${Math.abs(days ?? 0)} day${Math.abs(days ?? 0) === 1 ? "" : "s"} ago`;
    case "active":
      return "Active";
    case "renewed":
      return "Renewed";
    case "quit":
      return "Quit";
    default:
      return "";
  }
}

function enrichPeriod(period: RenewalPeriod, program?: SchoolProgram): RenewalPeriodWithUiStatus {
  const isMilestone = program?.program_type === "milestone_based";
  const days = period.expiration_date ? getDaysUntilExpiration(period.expiration_date) : null;
  const ui_status = deriveUiStatus(period, program);
  const next_unpaid_installment = getNextUnpaidInstallment(period.payments);

  return {
    ...period,
    ui_status,
    days_until_expiration: days,
    status_message: getStatusMessage(ui_status, days, isMilestone),
    next_unpaid_installment,
    is_milestone: isMilestone,
  };
}

export function groupPeriods(
  periods: RenewalPeriod[],
  programMap: Map<string, SchoolProgram>,
): GroupedRenewals {
  const result: GroupedRenewals = {
    payment_overdue: [],
    expiring_soon: [],
    grace_period: [],
    expired: [],
    active: [],
    paid: [],
  };

  for (const period of periods) {
    if (period.status === "renewed" || period.status === "quit") continue;

    const program = period.program_id ? programMap.get(period.program_id) : undefined;
    const enriched = enrichPeriod(period, program);

    switch (enriched.ui_status) {
      case "payment_overdue":
        result.payment_overdue.push(enriched);
        break;
      case "paid":
        result.paid.push(enriched);
        break;
      case "expiring_soon":
        result.expiring_soon.push(enriched);
        break;
      case "grace_period":
        result.grace_period.push(enriched);
        break;
      case "expired":
        result.expired.push(enriched);
        break;
      default:
        result.active.push(enriched);
        break;
    }
  }

  const byExpiry = (a: RenewalPeriodWithUiStatus, b: RenewalPeriodWithUiStatus) => {
    if (!a.expiration_date) return 1;
    if (!b.expiration_date) return -1;
    return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
  };

  result.payment_overdue.sort(byExpiry);
  result.expiring_soon.sort(byExpiry);
  result.grace_period.sort(byExpiry);
  result.expired.sort(byExpiry);
  result.active.sort(byExpiry);
  result.paid.sort(byExpiry);

  return result;
}

// ─────────────────────────────────────────────
// New expiration date when renewing
// ─────────────────────────────────────────────

function calculateNewExpirationDate(oldExpirationDate: string, durationMonths: number): string {
  const expiry = new Date(oldExpirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = expiry < today ? today : new Date(expiry);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setMonth(startDate.getMonth() + durationMonths);
  return startDate.toISOString().split("T")[0];
}

// ─────────────────────────────────────────────
// State & reducer
// ─────────────────────────────────────────────

interface State {
  periods: RenewalPeriod[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PERIODS"; payload: RenewalPeriod[] }
  | { type: "UPSERT_PERIOD"; payload: RenewalPeriod }
  | { type: "REMOVE_PERIOD"; payload: string };

const initialState: State = { periods: [], loading: false, error: null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_PERIODS":
      return { ...state, periods: action.payload };
    case "UPSERT_PERIOD":
      return {
        ...state,
        periods: state.periods.some((p) => p.period_id === action.payload.period_id)
          ? state.periods.map((p) =>
              p.period_id === action.payload.period_id ? action.payload : p,
            )
          : [action.payload, ...state.periods],
      };
    case "REMOVE_PERIOD":
      return {
        ...state,
        periods: state.periods.filter((p) => p.period_id !== action.payload),
      };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface StudentRenewalsContextType {
  periods: RenewalPeriod[];
  grouped: GroupedRenewals;
  loading: boolean;
  error: string | null;
  recentActivity: { text: string; time: string; dot: string }[];
  loadPeriods: () => Promise<void>;
  createRenewal: (req: CreateRenewalRequest) => Promise<void>;
  addPayment: (
    periodId: string,
    req: Omit<CreateRenewalPaymentRequest, "period_id" | "student_id">,
  ) => Promise<void>;
  markInstallmentPaid: (
    periodId: string,
    paymentId: string,
    actualPaymentDate: string,
    amountPaid: number,
    paidTo: string,
  ) => Promise<void>;
  updatePeriod: (periodId: string, updates: UpdateRenewalPeriodRequest) => Promise<void>;
  deletePeriod: (periodId: string) => Promise<void>;
  deletePayment: (periodId: string, paymentId: string) => Promise<void>;
  quitRenewal: (periodId: string, notes?: string) => Promise<void>;
  renewPeriod: (period: RenewalPeriod, durationMonths: number) => Promise<void>;
}

const StudentRenewalsContext = createContext<StudentRenewalsContextType | undefined>(undefined);

export const StudentRenewalsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { schoolId, students } = useSchool();
  const { programs } = usePrograms();

  // Build a fast lookup map from program_id → SchoolProgram
  const programMap = useMemo(() => new Map(programs.map((p) => [p.program_id, p])), [programs]);

  const withAsync = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      return await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      dispatch({ type: "SET_ERROR", payload: message });
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const loadPeriods = useCallback(
    (): Promise<void> =>
      withAsync(async () => {
        if (!schoolId) return;
        const data = await getRenewalPeriods(schoolId);
        dispatch({ type: "SET_PERIODS", payload: data });
      }),
    [withAsync, schoolId],
  );

  const createRenewal = useCallback(
    (req: CreateRenewalRequest): Promise<void> =>
      withAsync(async () => {
        const existingActive = state.periods.find(
          (p) => p.student_id === req.period.student_id && p.status === "active",
        );
        if (existingActive) {
          throw new Error(
            "This student already has an active renewal. Resolve it before creating a new one.",
          );
        }

        const newPeriod = await createRenewalPeriod(req.period);

        for (const installment of req.installments) {
          await createRenewalPayment({
            ...installment,
            period_id: newPeriod.period_id,
            student_id: newPeriod.student_id,
          });
        }

        const fresh = await getRenewalPeriodById(newPeriod.period_id);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
        track("renewal_created", { durationMonths: req.period.duration_months ?? 0 });
      }),
    [withAsync, state.periods],
  );

  const addPayment = useCallback(
    (
      periodId: string,
      req: Omit<CreateRenewalPaymentRequest, "period_id" | "student_id">,
    ): Promise<void> =>
      withAsync(async () => {
        const period = state.periods.find((p) => p.period_id === periodId);
        if (!period) throw new Error("Period not found");

        await createRenewalPayment({
          ...req,
          period_id: periodId,
          student_id: period.student_id,
        });

        const fresh = await getRenewalPeriodById(periodId);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
        track("renewal_payment_added");
      }),
    [withAsync, state.periods],
  );

  const markInstallmentPaidFn = useCallback(
    (
      periodId: string,
      paymentId: string,
      actualPaymentDate: string,
      amountPaid: number,
      paidTo: string,
    ): Promise<void> =>
      withAsync(async () => {
        await markInstallmentPaid(paymentId, {
          payment_date: actualPaymentDate,
          amount_paid: amountPaid,
          paid_to: paidTo,
        });

        const fresh = await getRenewalPeriodById(periodId);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
        track("renewal_payment_marked_paid");
      }),
    [withAsync],
  );

  const updatePeriod = useCallback(
    (periodId: string, updates: UpdateRenewalPeriodRequest): Promise<void> =>
      withAsync(async () => {
        await updateRenewalPeriod(periodId, updates);
        const fresh = await getRenewalPeriodById(periodId);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
      }),
    [withAsync],
  );

  const deletePeriod = useCallback(
    (periodId: string): Promise<void> =>
      withAsync(async () => {
        await deleteRenewalPeriod(periodId);
        dispatch({ type: "REMOVE_PERIOD", payload: periodId });
        track("renewal_deleted");
      }),
    [withAsync],
  );

  const deletePayment = useCallback(
    (periodId: string, paymentId: string): Promise<void> =>
      withAsync(async () => {
        await deleteRenewalPayment(paymentId);
        const fresh = await getRenewalPeriodById(periodId);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
      }),
    [withAsync],
  );

  const quitRenewal = useCallback(
    (periodId: string, notes?: string): Promise<void> =>
      withAsync(async () => {
        await resolveAsQuit(periodId, notes);
        const fresh = await getRenewalPeriodById(periodId);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
        track("renewal_student_quit");
      }),
    [withAsync],
  );

  const renewPeriod = useCallback(
    (period: RenewalPeriod, durationMonths: number): Promise<void> =>
      withAsync(async () => {
        const newExpiration = period.expiration_date
          ? calculateNewExpirationDate(period.expiration_date, durationMonths)
          : null;

        await resolveWithRenewal(
          period,
          {
            student_id: period.student_id,
            school_id: period.school_id,
            duration_months: durationMonths,
            expiration_date: newExpiration,
            number_of_classes: period.number_of_classes,
            program_id: period.program_id,
          },
          {
            due_date: new Date().toISOString().split("T")[0],
            payment_date: null,
            amount_due: period.total_due,
            amount_paid: 0,
            installment_number: 1,
            paid_to: "",
          },
        );

        const all = await getRenewalPeriods(schoolId);
        dispatch({ type: "SET_PERIODS", payload: all });
        track("renewal_renewed", { durationMonths });
      }),
    [withAsync, schoolId],
  );

  // Exclude milestone-based from expiring count (used by StatCards)
  const grouped = useMemo(
    () => groupPeriods(state.periods, programMap),
    [state.periods, programMap],
  );

  const recentActivity = useMemo(() => {
    return [...state.periods]
      .sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at).getTime() -
          new Date(a.updated_at ?? a.created_at).getTime(),
      )
      .slice(0, 5)
      .map((p) => {
        const program = p.program_id ? programMap.get(p.program_id) : undefined;
        const uiStatus = deriveUiStatus(p, program);
        const student = students.find((s) => s.id === p.student_id);
        const displayName = student?.name ?? p.student_id;
        const dot =
          uiStatus === "paid"
            ? "bg-green-500"
            : uiStatus === "payment_overdue"
              ? "bg-orange-500"
              : uiStatus === "expiring_soon"
                ? "bg-yellow-500"
                : uiStatus === "grace_period" || uiStatus === "expired"
                  ? "bg-red-500"
                  : "bg-blue-500";

        return {
          text: `Renewal ${uiStatus.replace("_", " ")}: ${displayName}`,
          time: new Date(p.updated_at ?? p.created_at).toLocaleDateString(),
          dot,
        };
      });
  }, [state.periods, students, programMap]);

  const value: StudentRenewalsContextType = {
    periods: state.periods,
    grouped,
    loading: state.loading,
    error: state.error,
    loadPeriods,
    createRenewal,
    addPayment,
    markInstallmentPaid: markInstallmentPaidFn,
    updatePeriod,
    deletePeriod,
    deletePayment,
    quitRenewal,
    renewPeriod,
    recentActivity,
  };

  return (
    <StudentRenewalsContext.Provider value={value}>{children}</StudentRenewalsContext.Provider>
  );
};

export const useStudentRenewals = (): StudentRenewalsContextType => {
  const ctx = useContext(StudentRenewalsContext);
  if (!ctx) throw new Error("useStudentRenewals must be used within StudentRenewalsProvider");
  return ctx;
};
