/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from "react";
import { track } from "../analytics/posthog";
import {
  RenewalPeriod,
  RenewalPeriodWithUiStatus,
  UiRenewalStatus,
  GroupedRenewals,
  CreateRenewalRequest,
  UpdateRenewalPeriodRequest,
  CreateRenewalPaymentRequest,
} from "../types/student_renewal";
import {
  getRenewalPeriods,
  createRenewalPeriod,
  createRenewalPayment,
  updateRenewalPeriod,
  updateRenewalPayment,
  deleteRenewalPeriod,
  deleteRenewalPayment,
  resolveAsQuit,
  resolveWithRenewal,
  getRenewalPeriodById,
} from "../api/StudentRenewalsRequests/studentRenewalsRequests";
import { useSchool } from "./SchoolContext";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const GRACE_PERIOD_DAYS = 7;
const WARNING_PERIOD_DAYS = 15;

// ─────────────────────────────────────────────
// Categorization — single source of truth
// ─────────────────────────────────────────────
function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / 86_400_000);
}

function getStatusMessage(uiStatus: UiRenewalStatus, days: number): string {
  switch (uiStatus) {
    case "paid":
      return "Fully paid";
    case "expiring_soon":
      return `Expires in ${days} day${days === 1 ? "" : "s"}`;
    case "grace_period":
      return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue — grace period`;
    case "expired":
      return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
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

export function deriveUiStatus(period: RenewalPeriod): UiRenewalStatus {
  // Paid overrides everything — check balance first
  if (period.balance <= 0 && period.total_due > 0) return "paid";

  // Resolved states come straight from DB
  if (period.status === "renewed") return "renewed";
  if (period.status === "quit") return "quit";
  if (period.status === "expired") return "expired";

  // For active periods, compute from expiration date
  const days = getDaysUntilExpiration(period.expiration_date);

  if (days < -GRACE_PERIOD_DAYS) return "expired";
  if (days < 0) return "grace_period";
  if (days <= WARNING_PERIOD_DAYS) return "expiring_soon";
  return "active";
}

function enrichPeriod(period: RenewalPeriod): RenewalPeriodWithUiStatus {
  const days = getDaysUntilExpiration(period.expiration_date);
  const ui_status = deriveUiStatus(period);
  return {
    ...period,
    ui_status,
    days_until_expiration: days,
    status_message: getStatusMessage(ui_status, days),
  };
}

export function groupPeriods(periods: RenewalPeriod[]): GroupedRenewals {
  const result: GroupedRenewals = {
    expiring_soon: [],
    grace_period: [],
    expired: [],
    active: [],
    paid: [],
  };

  for (const period of periods) {
    // Resolved periods don't appear in the dashboard
    if (period.status === "renewed" || period.status === "quit") continue;

    const enriched = enrichPeriod(period);

    // Route to bucket based on the single derived ui_status —
    // no duplicate balance checks here, deriveUiStatus handles it
    switch (enriched.ui_status) {
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

  // Sort each bucket by expiration date ascending
  const byExpiry = (a: RenewalPeriodWithUiStatus, b: RenewalPeriodWithUiStatus) =>
    new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();

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
  markPaymentPaid: (periodId: string, paymentId: string) => Promise<void>;
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

  // ── Async wrapper
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

  // ── Load
  const loadPeriods = useCallback(
    (): Promise<void> =>
      withAsync(async () => {
        if (!schoolId) return;
        const data = await getRenewalPeriods(schoolId);
        dispatch({ type: "SET_PERIODS", payload: data });
      }),
    [withAsync, schoolId],
  );

  // ── Create period + first payment in one flow
  const createRenewal = useCallback(
    (req: CreateRenewalRequest): Promise<void> =>
      withAsync(async () => {
        // Guard: check no active period already exists for this student
        const existingActive = state.periods.find(
          (p) => p.student_id === req.period.student_id && p.status === "active",
        );
        if (existingActive) {
          throw new Error(
            "This student already has an active renewal. Resolve it before creating a new one.",
          );
        }

        const newPeriod = await createRenewalPeriod(req.period);
        await createRenewalPayment({
          ...req.payment,
          period_id: newPeriod.period_id,
          student_id: newPeriod.student_id,
          installment_number: 1,
        });

        const fresh = await getRenewalPeriodById(newPeriod.period_id);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
        track("renewal_created", { durationMonths: req.period.duration_months });
      }),
    [withAsync, state.periods],
  );

  // ── Add a payment installment to an existing period
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

  // ── Mark a single payment installment as fully paid
  const markPaymentPaid = useCallback(
    (periodId: string, paymentId: string): Promise<void> =>
      withAsync(async () => {
        const period = state.periods.find((p) => p.period_id === periodId);
        const payment = period?.payments.find((p) => p.payment_id === paymentId);
        if (!payment) throw new Error("Payment not found");

        await updateRenewalPayment(paymentId, { amount_paid: payment.amount_due });

        const fresh = await getRenewalPeriodById(periodId);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
        track("renewal_payment_marked_paid");
      }),
    [withAsync, state.periods],
  );

  // ── Generic period update
  const updatePeriod = useCallback(
    (periodId: string, updates: UpdateRenewalPeriodRequest): Promise<void> =>
      withAsync(async () => {
        await updateRenewalPeriod(periodId, updates);
        const fresh = await getRenewalPeriodById(periodId);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
      }),
    [withAsync],
  );

  // ── Delete entire period (cascade removes payments)
  const deletePeriod = useCallback(
    (periodId: string): Promise<void> =>
      withAsync(async () => {
        await deleteRenewalPeriod(periodId);
        dispatch({ type: "REMOVE_PERIOD", payload: periodId });
        track("renewal_deleted");
      }),
    [withAsync],
  );

  // ── Delete a single payment installment
  const deletePayment = useCallback(
    (periodId: string, paymentId: string): Promise<void> =>
      withAsync(async () => {
        await deleteRenewalPayment(paymentId);
        const fresh = await getRenewalPeriodById(periodId);
        dispatch({ type: "UPSERT_PERIOD", payload: fresh });
      }),
    [withAsync],
  );

  // ── Resolve as quit
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

  // ── Renew — marks old period done, creates new period + first payment
  const renewPeriod = useCallback(
    (period: RenewalPeriod, durationMonths: number): Promise<void> =>
      withAsync(async () => {
        const newExpiration = calculateNewExpirationDate(period.expiration_date, durationMonths);

        await resolveWithRenewal(
          period,
          {
            student_id: period.student_id,
            school_id: period.school_id,
            duration_months: durationMonths,
            expiration_date: newExpiration,
            number_of_classes: period.number_of_classes,
          },
          {
            payment_date: new Date().toISOString().split("T")[0],
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

  // ── Derived grouped data — memoized
  const grouped = useMemo(() => groupPeriods(state.periods), [state.periods]);

  const recentActivity = useMemo(() => {
    return [...state.periods]
      .sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at).getTime() -
          new Date(a.updated_at ?? a.created_at).getTime(),
      )
      .slice(0, 5)
      .map((p) => {
        const uiStatus = deriveUiStatus(p);
        const student = students.find((s) => s.id === p.student_id);
        const displayName = student?.name ?? p.student_id;
        const dot =
          uiStatus === "paid"
            ? "bg-green-500"
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
  }, [state.periods, students]);

  const value: StudentRenewalsContextType = {
    periods: state.periods,
    grouped,
    loading: state.loading,
    error: state.error,
    loadPeriods,
    createRenewal,
    addPayment,
    markPaymentPaid,
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
