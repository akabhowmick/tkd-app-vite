import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { track } from "../analytics/posthog";
import { captureException } from "../analytics/sentry";
import { useAsyncState } from "../hooks/useAsyncState";
import {
  ClassRow,
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
  createClass: (data: Omit<CreateClassRequest, "school_id">) => Promise<ClassRow>;
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
  const { loading, error, run, load } = useAsyncState();

  const loadClasses = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const data = await getClassesWithSessions(schoolId);
      setClasses(data);
    }, "Failed to load classes");
  }, [schoolId, load]);

  const createClass = useCallback(
    async (data: Omit<CreateClassRequest, "school_id">): Promise<ClassRow> => {
      if (!schoolId) throw new Error("School ID required");
      try {
        return await run(async () => {
          const newClass = await apiCreateClass({ ...data, school_id: schoolId });
          await loadClasses();
          track("class_created", { ageGroup: data.age_group });
          return newClass;
        }, "Failed to create class");
      } catch (err) {
        captureException(err, { feature: "classes", action: "createClass" });
        throw err;
      }
    },
    [schoolId, loadClasses, run],
  );

  const updateClass = useCallback(
    async (classId: string, updates: UpdateClassRequest): Promise<void> => {
      await run(async () => {
        await apiUpdateClass(classId, updates);
        await loadClasses();
      }, "Failed to update class");
    },
    [loadClasses, run],
  );

  const deleteClass = useCallback(
    async (classId: string): Promise<void> => {
      try {
        await run(async () => {
          await apiDeleteClass(classId);
          await loadClasses();
          track("class_deleted");
        }, "Failed to delete class");
      } catch (err) {
        captureException(err, { feature: "classes", action: "deleteClass" });
        throw err;
      }
    },
    [loadClasses, run],
  );

  const createSession = useCallback(
    async (data: Omit<CreateSessionRequest, "school_id">): Promise<ClassSession> => {
      if (!schoolId) throw new Error("School ID required");
      try {
        return await run(async () => {
          const newSession = await apiCreateSession({ ...data, school_id: schoolId });
          await loadClasses();
          track("class_session_added", { sessionType: data.session_type });
          return newSession;
        }, "Failed to create session");
      } catch (err) {
        captureException(err, { feature: "classes", action: "createSession" });
        throw err;
      }
    },
    [schoolId, loadClasses, run],
  );

  const updateSession = useCallback(
    async (sessionId: string, updates: UpdateSessionRequest): Promise<void> => {
      await run(async () => {
        await apiUpdateSession(sessionId, updates);
        await loadClasses();
      }, "Failed to update session");
    },
    [loadClasses, run],
  );

  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        await run(async () => {
          await apiDeleteSession(sessionId);
          await loadClasses();
          track("class_session_deleted");
        }, "Failed to delete session");
      } catch (err) {
        captureException(err, { feature: "classes", action: "deleteSession" });
        throw err;
      }
    },
    [loadClasses, run],
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

// eslint-disable-next-line react-refresh/only-export-components
export const useClasses = (): ClassContextType => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error("useClasses must be used within ClassProvider");
  }
  return context;
};
