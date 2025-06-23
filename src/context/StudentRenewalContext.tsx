import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StudentRenewal } from '../types/student_renewal';
import { getStudentRenewals, getStudentRenewalById, getExpiringRenewals, createStudentRenewal, updateStudentRenewal, deleteStudentRenewal } from '../api/StudentRenewalsRequests/studentRenewalsRequests';

interface StudentRenewalsContextType {
  renewals: StudentRenewal[];
  selectedRenewal: StudentRenewal | null;
  expiringRenewals: StudentRenewal[];
  loading: boolean;
  error: string | null;

  loadRenewals: (studentId?: number) => Promise<void>;
  loadRenewalById: (renewalId: number) => Promise<void>;
  loadExpiringRenewals: (daysFromNow?: number) => Promise<void>;
  createRenewal: (renewal: Omit<StudentRenewal, "renewal_id" | "created_at" | "updated_at">) => Promise<void>;
  updateRenewal: (renewalId: number, renewal: Partial<StudentRenewal>) => Promise<void>;
  removeRenewal: (renewalId: number) => Promise<void>;
  clearSelectedRenewal: () => void;
  clearError: () => void;
  refreshRenewals: () => Promise<void>;
}

const StudentRenewalsContext = createContext<StudentRenewalsContextType | undefined>(undefined);

interface StudentRenewalsProviderProps {
  children: ReactNode;
  autoLoadStudentId?: number; 
}

export const StudentRenewalsProvider: React.FC<StudentRenewalsProviderProps> = ({ 
  children, 
  autoLoadStudentId 
}) => {
  // State
  const [renewals, setRenewals] = useState<StudentRenewal[]>([]);
  const [selectedRenewal, setSelectedRenewal] = useState<StudentRenewal | null>(null);
  const [expiringRenewals, setExpiringRenewals] = useState<StudentRenewal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<number | undefined>(autoLoadStudentId);

  // Auto-load renewals on mount if studentId is provided
  useEffect(() => {
    if (autoLoadStudentId) {
      loadRenewals(autoLoadStudentId);
    }
  }, [autoLoadStudentId]);

  // Helper function to handle errors
  const handleError = (error: unknown, action: string) => {
    const errorMessage = `Failed to ${action}`;
    setError(errorMessage);
    console.error(`Error ${action}:`, error);
  };

  // Load renewals (optionally filtered by student)
  const loadRenewals = async (studentId?: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getStudentRenewals(studentId);
      setRenewals(data);
      setCurrentStudentId(studentId);
    } catch (error) {
      handleError(error, 'load renewals');
    } finally {
      setLoading(false);
    }
  };

  // Load a specific renewal by ID
  const loadRenewalById = async (renewalId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getStudentRenewalById(renewalId);
      setSelectedRenewal(data);
    } catch (error) {
      handleError(error, 'load renewal');
    } finally {
      setLoading(false);
    }
  };

  // Load expiring renewals
  const loadExpiringRenewals = async (daysFromNow: number = 30): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getExpiringRenewals(daysFromNow);
      setExpiringRenewals(data);
    } catch (error) {
      handleError(error, 'load expiring renewals');
    } finally {
      setLoading(false);
    }
  };

  // Create a new renewal
  const createRenewal = async (renewal: Omit<StudentRenewal, "renewal_id" | "created_at" | "updated_at">): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await createStudentRenewal(renewal);
      
      // Refresh the renewals list
      if (currentStudentId === renewal.student_id || currentStudentId === undefined) {
        await loadRenewals(currentStudentId);
      }
    } catch (error) {
      handleError(error, 'create renewal');
      throw error; // Re-throw so calling component can handle it
    } finally {
      setLoading(false);
    }
  };

  // Update an existing renewal
  const updateRenewal = async (renewalId: number, renewalUpdate: Partial<StudentRenewal>): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await updateStudentRenewal(renewalId, renewalUpdate);
      
      // Update local state
      setRenewals(prev => 
        prev.map(renewal => 
          renewal.renewal_id === renewalId 
            ? { ...renewal, ...renewalUpdate } 
            : renewal
        )
      );

      // Update selected renewal if it's the one being updated
      if (selectedRenewal?.renewal_id === renewalId) {
        setSelectedRenewal(prev => prev ? { ...prev, ...renewalUpdate } : null);
      }

      // Update expiring renewals list
      setExpiringRenewals(prev => 
        prev.map(renewal => 
          renewal.renewal_id === renewalId 
            ? { ...renewal, ...renewalUpdate } 
            : renewal
        )
      );
    } catch (error) {
      handleError(error, 'update renewal');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete a renewal
  const removeRenewal = async (renewalId: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteStudentRenewal(renewalId);
      
      // Remove from local state
      setRenewals(prev => prev.filter(renewal => renewal.renewal_id !== renewalId));
      setExpiringRenewals(prev => prev.filter(renewal => renewal.renewal_id !== renewalId));
      
      // Clear selected renewal if it's the one being deleted
      if (selectedRenewal?.renewal_id === renewalId) {
        setSelectedRenewal(null);
      }
    } catch (error) {
      handleError(error, 'delete renewal');
      throw error;
    } finally {
      setLoading(false);
    }
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
    await loadRenewals(currentStudentId);
  };

  // Context value
  const contextValue: StudentRenewalsContextType = {
    // State
    renewals,
    selectedRenewal,
    expiringRenewals,
    loading,
    error,

    // Actions
    loadRenewals,
    loadRenewalById,
    loadExpiringRenewals,
    createRenewal,
    updateRenewal,
    removeRenewal,
    clearSelectedRenewal,
    clearError,
    refreshRenewals,
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
    throw new Error('useStudentRenewals must be used within a StudentRenewalsProvider');
  }
  
  return context;
};



/*
const StudentDashboard = ({ studentId }: { studentId: number }) => (
  <StudentRenewalsProvider autoLoadStudentId={studentId}>
    <RenewalsComponent />
  </StudentRenewalsProvider>
);
*/