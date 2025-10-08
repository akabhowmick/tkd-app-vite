import { createContext, useContext, useMemo, useReducer, useCallback, ReactNode } from "react";
import { ExpiringRenewal, Renewal } from "../types/student_renewal";
import {
  getStudentRenewals,
  getStudentRenewalById,
  getExpiringRenewals,
  createStudentRenewal,
  updateStudentRenewal,
  deleteStudentRenewal,
} from "../api/StudentRenewalsRequests/studentRenewalsRequests";

// ── Config/constants
const GRACE_PERIOD_DAYS = 7 as const;
const WARNING_PERIOD_DAYS = 15 as const;

// ── Public types
export interface RenewalResolution {
  renewal_id: string;
  action: "quit" | "renew";
  resolved_at: string;
  notes?: string;
}

export interface StudentRenewalsContextType {
  renewals: Renewal[];
  selectedRenewal: Renewal | null;
  expiringRenewals: Renewal[];
  processedExpiringRenewals: ExpiringRenewal[];
  loading: boolean;
  error: string | null;

  loadAllRenewals: () => Promise<void>;
  loadRenewals: (studentId?: string) => Promise<void>;
  loadRenewalById: (renewalId: string) => Promise<void>;
  loadExpiringRenewals: (daysFromNow?: number) => Promise<void>;
  createRenewal: (
    renewal: Omit<Renewal, "renewal_id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateRenewal: (renewalId: string, renewal: Partial<Renewal>) => Promise<void>;
  removeRenewal: (renewalId: string) => Promise<void>;
  clearSelectedRenewal: () => void;
  clearError: () => void;
  refreshRenewals: () => Promise<void>;

  resolveRenewalAsQuit: (renewalId: string, notes?: string) => Promise<RenewalResolution>;
  resolveRenewalWithNext: (
    currentRenewal: Renewal,
    newRenewalData: Partial<Renewal>
  ) => Promise<{
    resolution: RenewalResolution;
    newRenewal: Omit<Renewal, "renewal_id" | "created_at" | "updated_at">;
  }>;
  getGroupedExpiringRenewals: () => {
    expired: ExpiringRenewal[];
    gracePeriod: ExpiringRenewal[];
    expiringSoon: ExpiringRenewal[];
  };
}

// ── Internal state & reducer
type State = Readonly<{
  renewals: Renewal[];
  selectedRenewal: Renewal | null;
  expiringRenewals: Renewal[];
  loading: boolean;
  error: string | null;
  currentStudentId?: string;
}>;

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_RENEWALS"; payload: { renewals: Renewal[]; studentId?: string } }
  | { type: "SET_SELECTED"; payload: Renewal | null }
  | { type: "SET_EXPIRING"; payload: Renewal[] }
  | { type: "CLEAR_SELECTED" }
  | { type: "CLEAR_ERROR" };

const initialState: State = {
  renewals: [],
  selectedRenewal: null,
  expiringRenewals: [],
  loading: false,
  error: null,
  currentStudentId: undefined,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_RENEWALS":
      return {
        ...state,
        renewals: action.payload.renewals,
        currentStudentId: action.payload.studentId ?? state.currentStudentId,
      };
    case "SET_SELECTED":
      return { ...state, selectedRenewal: action.payload };
    case "SET_EXPIRING":
      return { ...state, expiringRenewals: action.payload };
    case "CLEAR_SELECTED":
      return { ...state, selectedRenewal: null };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default: {
      // Exhaustiveness check
      return state;
    }
  }
}

// ── Derived helpers (pure)
function processRenewal(renewal: Renewal, today: Date): ExpiringRenewal | null {
  const expirationDate = new Date(renewal.expiration_date);
  expirationDate.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - expirationDate.getTime()) / 86_400_000);

  if (daysDiff < -WARNING_PERIOD_DAYS || daysDiff > GRACE_PERIOD_DAYS) return null;

  let status: ExpiringRenewal["status"];
  let statusMessage: string;
  let priority: number;

  if (daysDiff > 0) {
    if (daysDiff <= GRACE_PERIOD_DAYS) {
      status = "grace_period";
      statusMessage = `In grace period (${daysDiff} days overdue)`;
      priority = 2;
    } else {
      status = "expired";
      statusMessage = `Expired ${Math.abs(daysDiff)} days ago`;
      priority = 3;
    }
  } else {
    status = "expiring_soon";
    statusMessage = `Expires in ${Math.abs(daysDiff)} days`;
    priority = 1;
  }

  return {
    ...renewal,
    daysOverdue: daysDiff,
    status,
    statusMessage,
    priority,
  };
}

// ── Context
const StudentRenewalsContext = createContext<StudentRenewalsContextType | undefined>(undefined);

export interface StudentRenewalsProviderProps {
  children: ReactNode;
  autoLoadStudentId?: string;
}

export const StudentRenewalsProvider = ({
  children,
  autoLoadStudentId,
}: StudentRenewalsProviderProps): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    currentStudentId: autoLoadStudentId,
  });

  // Centralized async wrapper to keep types
  const withAsync = useCallback(async <T,>(label: string, fn: () => Promise<T>): Promise<T> => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const result = await fn();
      return result;
    } catch (err) {
      // optionally narrow error type here if your API throws known shapes
      console.error(`Error ${label}:`, err);
      dispatch({ type: "SET_ERROR", payload: `Failed to ${label}` });
      throw err;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // ── Loads
  const loadAllRenewals = useCallback(
    (): Promise<void> =>
      withAsync("load renewals", async () => {
        const data = await getStudentRenewals();
        dispatch({ type: "SET_RENEWALS", payload: { renewals: data } });
      }),
    [withAsync]
  );

  const loadRenewals = useCallback(
    (studentId?: string): Promise<void> =>
      withAsync("load renewals", async () => {
        const data = await getStudentRenewals(studentId);
        dispatch({ type: "SET_RENEWALS", payload: { renewals: data, studentId } });
      }),
    [withAsync]
  );

  const loadRenewalById = useCallback(
    (renewalId: string): Promise<void> =>
      withAsync("load renewal", async () => {
        const data = await getStudentRenewalById(renewalId);
        dispatch({ type: "SET_SELECTED", payload: data });
      }),
    [withAsync]
  );

  const loadExpiringRenewals = useCallback(
    (daysFromNow: number = 30): Promise<void> =>
      withAsync("load expiring renewals", async () => {
        const data = await getExpiringRenewals(daysFromNow);
        dispatch({ type: "SET_EXPIRING", payload: data });
      }),
    [withAsync]
  );

  // ── Mutations
  const createRenewal = useCallback(
    (renewal: Omit<Renewal, "renewal_id" | "created_at" | "updated_at">): Promise<void> =>
      withAsync("create renewal", async () => {
        await createStudentRenewal(renewal);
        const id = state.currentStudentId;
        await Promise.all([loadRenewals(id), loadExpiringRenewals()]);
      }),
    [withAsync, loadRenewals, loadExpiringRenewals, state.currentStudentId]
  );

  const updateRenewal = useCallback(
    (renewalId: string, renewalUpdate: Partial<Renewal>): Promise<void> =>
      withAsync("update renewal", async () => {
        await updateStudentRenewal(renewalId, renewalUpdate);
        const id = state.currentStudentId;
        await Promise.all([loadRenewals(id), loadExpiringRenewals()]);

        if (state.selectedRenewal?.renewal_id === renewalId) {
          await loadRenewalById(renewalId);
        }
      }),
    [
      withAsync,
      loadRenewals,
      loadExpiringRenewals,
      loadRenewalById,
      state.currentStudentId,
      state.selectedRenewal,
    ]
  );

  const removeRenewal = useCallback(
    (renewalId: string): Promise<void> =>
      withAsync("delete renewal", async () => {
        await deleteStudentRenewal(renewalId);
        const id = state.currentStudentId;
        await Promise.all([loadRenewals(id), loadExpiringRenewals()]);
        if (state.selectedRenewal?.renewal_id === renewalId) {
          dispatch({ type: "CLEAR_SELECTED" });
        }
      }),
    [withAsync, loadRenewals, loadExpiringRenewals, state.currentStudentId, state.selectedRenewal]
  );

  // ── Resolution helpers
  const resolveRenewalAsQuit = useCallback(
    (renewalId: string, notes?: string): Promise<RenewalResolution> =>
      withAsync("resolve renewal as quit", async () => {
        const resolution: RenewalResolution = {
          renewal_id: renewalId,
          action: "quit",
          resolved_at: new Date().toISOString(),
          notes: notes ?? "Student quit",
        };
        await loadExpiringRenewals();
        return resolution;
      }),
    [withAsync, loadExpiringRenewals]
  );

  const resolveRenewalWithNext = useCallback(
    (
      currentRenewal: Renewal,
      newRenewalData: Partial<Renewal>
    ): Promise<{
      resolution: RenewalResolution;
      newRenewal: Omit<Renewal, "renewal_id" | "created_at" | "updated_at">;
    }> =>
      withAsync("resolve renewal with next renewal", async () => {
        const currentExpiration = new Date(currentRenewal.expiration_date);
        const newStartDate = new Date(currentExpiration);
        newStartDate.setDate(newStartDate.getDate() + 1);

        const months = newRenewalData.duration_months ?? 1;
        const newExpirationDate = new Date(newStartDate);
        newExpirationDate.setMonth(newExpirationDate.getMonth() + months);

        const newRenewal: Omit<Renewal, "renewal_id" | "created_at" | "updated_at"> = {
          student_id: currentRenewal.student_id,
          duration_months: months,
          payment_date: new Date().toISOString(),
          expiration_date: newExpirationDate.toISOString(),
          amount_due: newRenewalData.amount_due ?? currentRenewal.amount_due,
          amount_paid: newRenewalData.amount_paid ?? 0,
          number_of_payments: newRenewalData.number_of_payments ?? 1,
          number_of_classes: newRenewalData.number_of_classes ?? currentRenewal.number_of_classes,
          paid_to: newRenewalData.paid_to ?? currentRenewal.paid_to,
        };

        await createStudentRenewal(newRenewal);
        await Promise.all([loadRenewals(state.currentStudentId), loadExpiringRenewals()]);

        const resolution: RenewalResolution = {
          renewal_id: currentRenewal.renewal_id,
          action: "renew",
          resolved_at: new Date().toISOString(),
          notes: `Renewed for ${months} months`,
        };

        return { resolution, newRenewal };
      }),
    [withAsync, loadRenewals, loadExpiringRenewals, state.currentStudentId]
  );

  // ── Derived data (memoized, no extra state)
  const processedExpiringRenewals: ExpiringRenewal[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return state.expiringRenewals
      .map((r) => processRenewal(r, today))
      .filter((r): r is ExpiringRenewal => r !== null)
      .sort((a, b) => b.priority - a.priority);
  }, [state.expiringRenewals]);

  const getGroupedExpiringRenewals = useCallback(() => {
    const expired = processedExpiringRenewals.filter((r) => r.status === "expired");
    const gracePeriod = processedExpiringRenewals.filter((r) => r.status === "grace_period");
    const expiringSoon = processedExpiringRenewals.filter((r) => r.status === "expiring_soon");
    return { expired, gracePeriod, expiringSoon };
  }, [processedExpiringRenewals]);

  const clearSelectedRenewal = useCallback((): void => {
    dispatch({ type: "CLEAR_SELECTED" });
  }, []);

  const clearError = useCallback((): void => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const refreshRenewals = useCallback(async (): Promise<void> => {
    await Promise.all([loadAllRenewals(), loadExpiringRenewals()]);
  }, [loadAllRenewals, loadExpiringRenewals]);

  const contextValue: StudentRenewalsContextType = {
    renewals: state.renewals,
    selectedRenewal: state.selectedRenewal,
    expiringRenewals: state.expiringRenewals,
    processedExpiringRenewals,
    loading: state.loading,
    error: state.error,

    loadAllRenewals,
    loadRenewals,
    loadRenewalById,
    loadExpiringRenewals,
    createRenewal,
    updateRenewal,
    removeRenewal,
    clearSelectedRenewal,
    clearError,
    refreshRenewals,

    resolveRenewalAsQuit,
    resolveRenewalWithNext,
    getGroupedExpiringRenewals,
  };

  return (
    <StudentRenewalsContext.Provider value={contextValue}>
      {children}
    </StudentRenewalsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStudentRenewals = (): StudentRenewalsContextType => {
  const ctx = useContext(StudentRenewalsContext);
  if (!ctx) {
    throw new Error("useStudentRenewals must be used within a StudentRenewalsProvider");
  }
  return ctx;
};
