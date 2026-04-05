import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import {
  Class,
  ClassSession,
  ClassWithSessions,
  CreateClassRequest,
  CreateSessionRequest,
  UpdateClassRequest,
  UpdateSessionRequest,
} from "../types/classes";
import {
  getClassesWithSessions,
  createClass as apiCreateClass,
  updateClass as apiUpdateClass,
  deleteClass as apiDeleteClass,
  createSession as apiCreateSession,
  updateSession as apiUpdateSession,
  deleteSession as apiDeleteSession,
} from "../api/ClassRequests/classRequests";
import { useSchool } from "./SchoolContext";

interface ClassContextType {
  classes: ClassWithSessions[];
  loading: boolean;
  error: string | null;
  loadClasses: () => Promise<void>;
  createClass: (data: Omit<CreateClassRequest, "school_id">) => Promise<Class>;
  updateClass: (classId: string, updates: UpdateClassRequest) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  createSession: (data: Omit<CreateSessionRequest, "school_id">) => Promise<ClassSession>;
  updateSession: (sessionId: string, updates: UpdateSessionRequest) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [classes, setClasses] = useState<ClassWithSessions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getClassesWithSessions(schoolId);
      setClasses(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load classes";
      setError(message);
      console.error("Error loading classes:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const createClass = useCallback(
    async (data: Omit<CreateClassRequest, "school_id">): Promise<Class> => {
      if (!schoolId) throw new Error("School ID required");

      try {
        setLoading(true);
        setError(null);
        const newClass = await apiCreateClass({ ...data, school_id: schoolId });
        await loadClasses();
        return newClass;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create class";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [schoolId, loadClasses],
  );

  const updateClass = useCallback(
    async (classId: string, updates: UpdateClassRequest): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiUpdateClass(classId, updates);
        await loadClasses();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update class";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadClasses],
  );

  const deleteClass = useCallback(
    async (classId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiDeleteClass(classId);
        await loadClasses();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete class";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadClasses],
  );

  const createSession = useCallback(
    async (data: Omit<CreateSessionRequest, "school_id">): Promise<ClassSession> => {
      if (!schoolId) throw new Error("School ID required");

      try {
        setLoading(true);
        setError(null);
        const newSession = await apiCreateSession({ ...data, school_id: schoolId });
        await loadClasses();
        return newSession;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create session";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [schoolId, loadClasses],
  );

  const updateSession = useCallback(
    async (sessionId: string, updates: UpdateSessionRequest): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiUpdateSession(sessionId, updates);
        await loadClasses();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update session";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadClasses],
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiDeleteSession(sessionId);
        await loadClasses();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete session";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadClasses],
  );

  useEffect(() => {
    if (schoolId) {
      loadClasses();
    }
  }, [schoolId, loadClasses]);

  return (
    <ClassContext.Provider
      value={{
        classes,
        loading,
        error,
        loadClasses,
        createClass,
        updateClass,
        deleteClass,
        createSession,
        updateSession,
        deleteSession,
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};

export const useClasses = (): ClassContextType => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error("useClasses must be used within ClassProvider");
  }
  return context;
};
