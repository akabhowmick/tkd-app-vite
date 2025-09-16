import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ExpiringRenewal, Renewal } from "../types/student_renewal";
import {
  getStudentRenewals,
  getStudentRenewalById,
  getExpiringRenewals,
  createStudentRenewal,
  updateStudentRenewal,
  deleteStudentRenewal,
} from "../api/StudentRenewalsRequests/studentRenewalsRequests";

export interface RenewalResolution {
  renewal_id: string;
  action: "quit" | "renew";
  resolved_at: string;
  notes?: string;
}

interface StudentRenewalsContextType {
  renewals: Renewal[];
  selectedRenewal: Renewal | null;
  expiringRenewals: Renewal[];
  processedExpiringRenewals: ExpiringRenewal[];
  loading: boolean;
  error: string | null;

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
  loadAllRenewals: () => Promise<void>;

  resolveRenewalAsQuit: (renewalId: string, notes?: string) => Promise<RenewalResolution>;
  resolveRenewalWithNext: (
    currentRenewal: Renewal,
    newRenewalData: Partial<Renewal>
  ) => Promise<{ resolution: RenewalResolution; newRenewal: Partial<Renewal> }>;
  getGroupedExpiringRenewals: () => {
    expired: ExpiringRenewal[];
    gracePeriod: ExpiringRenewal[];
    expiringSoon: ExpiringRenewal[];
  };
}

const StudentRenewalsContext = createContext<StudentRenewalsContextType | undefined>(undefined);

interface StudentRenewalsProviderProps {
  children: ReactNode;
  autoLoadStudentId?: string;
}

export const StudentRenewalsProvider: React.FC<StudentRenewalsProviderProps> = ({
  children,
  autoLoadStudentId,
}) => {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [selectedRenewal, setSelectedRenewal] = useState<Renewal | null>(null);
  const [expiringRenewals, setExpiringRenewals] = useState<Renewal[]>([]);
  const [processedExpiringRenewals, setProcessedExpiringRenewals] = useState<ExpiringRenewal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string| undefined>(autoLoadStudentId);

  // NEW: Renewal management constants
  const GRACE_PERIOD_DAYS = 7;
  const WARNING_PERIOD_DAYS = 15;

  useEffect(() => {
    if (autoLoadStudentId) {
      loadRenewals(autoLoadStudentId);
    }
    loadExpiringRenewals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoadStudentId]);

  // NEW: Process renewals whenever expiringRenewals changes
  useEffect(() => {
    processExpiringRenewals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiringRenewals]);

  const handleError = (error: unknown, action: string) => {
    const errorMessage = `Failed to ${action}`;
    setError(errorMessage);
    console.error(`Error ${action}:`, error);
  };

  // NEW: Process expiring renewals with status information
  const processExpiringRenewals = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processed = expiringRenewals
      .map((renewal) => processRenewal(renewal, today))
      .filter((renewal) => renewal !== null) as ExpiringRenewal[];

    // Sort by priority (most urgent first)
    processed.sort((a, b) => b.priority - a.priority);

    // TODO check if this working
    setProcessedExpiringRenewals(processed);
  };

  const processRenewal = (renewal: Renewal, today: Date): ExpiringRenewal | null => {
    const expirationDate = new Date(renewal.expiration_date);
    expirationDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - expirationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if renewal needs attention
    if (daysDiff >= -WARNING_PERIOD_DAYS && daysDiff <= GRACE_PERIOD_DAYS) {
      let status: "expired" | "expiring_soon" | "grace_period";
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

    return null;
  };

  const loadAllRenewals = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await getStudentRenewals();
      setRenewals(data);
    } catch (error) {
      handleError(error, "load renewals");
    } finally {
      setLoading(false);
    }
  };

  const loadRenewals = async (studentId?: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await getStudentRenewals(studentId);
      setRenewals(data);
      setCurrentStudentId(studentId);
    } catch (error) {
      handleError(error, "load renewals");
    } finally {
      setLoading(false);
    }
  };

  const loadRenewalById = async (renewalId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await getStudentRenewalById(renewalId);
      setSelectedRenewal(data);
    } catch (error) {
      handleError(error, "load renewal");
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringRenewals = async (daysFromNow: number = 30): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await getExpiringRenewals(daysFromNow);
      setExpiringRenewals(data);
    } catch (error) {
      handleError(error, "load expiring renewals");
    } finally {
      setLoading(false);
    }
  };

  const createRenewal = async (
    renewal: Omit<Renewal, "renewal_id" | "created_at" | "updated_at">
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await createStudentRenewal(renewal);
      if (currentStudentId === renewal.student_id || currentStudentId === undefined) {
        await loadRenewals(currentStudentId);
      }
      // Refresh expiring renewals after creating new one
      await loadExpiringRenewals();
    } catch (error) {
      handleError(error, "create renewal");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRenewal = async (
    renewalId: string,
    renewalUpdate: Partial<Renewal>
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await updateStudentRenewal(renewalId, renewalUpdate);

      setRenewals((prev) =>
        prev.map((renewal) =>
          renewal.renewal_id === renewalId ? { ...renewal, ...renewalUpdate } : renewal
        )
      );

      if (selectedRenewal?.renewal_id === renewalId) {
        setSelectedRenewal((prev) => (prev ? { ...prev, ...renewalUpdate } : null));
      }

      setExpiringRenewals((prev) =>
        prev.map((renewal) =>
          renewal.renewal_id === renewalId ? { ...renewal, ...renewalUpdate } : renewal
        )
      );
    } catch (error) {
      handleError(error, "update renewal");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeRenewal = async (renewalId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await deleteStudentRenewal(renewalId);
      setRenewals((prev) => prev.filter((renewal) => renewal.renewal_id !== renewalId));
      setExpiringRenewals((prev) => prev.filter((renewal) => renewal.renewal_id !== renewalId));
      if (selectedRenewal?.renewal_id === renewalId) {
        setSelectedRenewal(null);
      }
    } catch (error) {
      handleError(error, "delete renewal");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // NEW: Resolve renewal as quit
  const resolveRenewalAsQuit = async (
    renewalId: string,
    notes?: string
  ): Promise<RenewalResolution> => {
    setLoading(true);
    setError(null);

    try {
      const resolution: RenewalResolution = {
        renewal_id: renewalId,
        action: "quit",
        resolved_at: new Date().toISOString(),
        notes: notes || "Student quit",
      };

      setExpiringRenewals((prev) => prev.filter((r) => r.renewal_id !== renewalId));

      return resolution;
    } catch (error) {
      handleError(error, "resolve renewal as quit");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // NEW: Resolve renewal by creating next renewal
  const resolveRenewalWithNext = async (
    currentRenewal: Renewal,
    newRenewalData: Partial<Renewal>
  ): Promise<{ resolution: RenewalResolution; newRenewal: Partial<Renewal> }> => {
    setLoading(true);
    setError(null);

    try {
      // Calculate new renewal dates
      const currentExpiration = new Date(currentRenewal.expiration_date);
      const newStartDate = new Date(currentExpiration);
      newStartDate.setDate(newStartDate.getDate() + 1);

      const newExpirationDate = new Date(newStartDate);
      newExpirationDate.setMonth(
        newExpirationDate.getMonth() + (newRenewalData.duration_months || 1)
      );

      const newRenewal: Omit<Renewal, "renewal_id" | "created_at" | "updated_at"> = {
        student_id: currentRenewal.student_id,
        duration_months: newRenewalData.duration_months || 1,
        payment_date: new Date().toISOString(),
        expiration_date: newExpirationDate.toISOString(),
        amount_due: newRenewalData.amount_due || currentRenewal.amount_due,
        amount_paid: newRenewalData.amount_paid || 0,
        number_of_payments: newRenewalData.number_of_payments || 1,
        number_of_classes: newRenewalData.number_of_classes || currentRenewal.number_of_classes,
        paid_to: newRenewalData.paid_to || currentRenewal.paid_to,
      };

      // Create the new renewal
      await createRenewal(newRenewal);

      // Remove old renewal from expiring renewals
      setExpiringRenewals((prev) => prev.filter((r) => r.renewal_id !== currentRenewal.renewal_id));

      const resolution: RenewalResolution = {
        renewal_id: currentRenewal.renewal_id,
        action: "renew",
        resolved_at: new Date().toISOString(),
        notes: `Renewed for ${newRenewal.duration_months} months`,
      };

      return { resolution, newRenewal };
    } catch (error) {
      handleError(error, "resolve renewal with next renewal");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getGroupedExpiringRenewals = () => {
    return {
      expired: processedExpiringRenewals.filter((r) => r.status === "expired"),
      gracePeriod: processedExpiringRenewals.filter((r) => r.status === "grace_period"),
      expiringSoon: processedExpiringRenewals.filter((r) => r.status === "expiring_soon"),
    };
  };

  // Clear selected renewal
  const clearSelectedRenewal = (): void => {
    setSelectedRenewal(null);
  };

  // Clear error
  const clearError = (): void => {
    setError(null);
  };

  // Refresh renewals (reload current data)
  const refreshRenewals = async (): Promise<void> => {
    await loadAllRenewals();
    await loadExpiringRenewals();
  };

  // Context value
  const contextValue: StudentRenewalsContextType = {
    renewals,
    selectedRenewal,
    expiringRenewals,
    processedExpiringRenewals,
    loading,
    error,

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
  const context = useContext(StudentRenewalsContext);

  if (context === undefined) {
    throw new Error("useStudentRenewals must be used within a StudentRenewalsProvider");
  }

  return context;
};
