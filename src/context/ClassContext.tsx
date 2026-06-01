import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { track } from "../analytics/posthog";
import { captureException } from "../analytics/sentry";
import { useAsyncState } from "../hooks/useAsyncState";
import {
  Class,
  ClassEnrollment,
  CreateClassRequest,
  UpdateClassRequest,
} from "../types/classes";
import {
  getClasses,
  createClass as apiCreateClass,
  updateClass as apiUpdateClass,
  deleteClass as apiDeleteClass,
  getStudentEnrollments,
  enrollStudentInClass,
  unenrollStudentFromClass,
} from "../api/ClassRequests/classRequests";
import { useSchool } from "./SchoolContext";

interface ClassContextType {
  classes: Class[];
  loading: boolean;
  error: string | null;
  loadClasses: () => Promise<void>;
  createClass: (data: Omit<CreateClassRequest, "school_id">) => Promise<Class>;
  updateClass: (classId: string, updates: UpdateClassRequest) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  getStudentEnrollments: (studentId: string) => Promise<(ClassEnrollment & { class: Class })[]>;
  enrollStudent: (classId: string, studentId: string) => Promise<ClassEnrollment>;
  unenrollStudent: (enrollmentId: string) => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [classes, setClasses] = useState<Class[]>([]);
  const { loading, error, run, load } = useAsyncState();

  const loadClasses = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const data = await getClasses(schoolId);
      setClasses(data);
    }, "Failed to load classes");
  }, [schoolId, load]);

  const createClass = useCallback(
    async (data: Omit<CreateClassRequest, "school_id">): Promise<Class> => {
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

  const getStudentEnrollmentsCallback = useCallback(
    (studentId: string) => getStudentEnrollments(studentId),
    [],
  );

  const enrollStudent = useCallback(
    async (classId: string, studentId: string): Promise<ClassEnrollment> => {
      if (!schoolId) throw new Error("School ID required");
      return run(
        () => enrollStudentInClass(classId, studentId, schoolId),
        "Failed to enroll student",
      );
    },
    [schoolId, run],
  );

  const unenrollStudent = useCallback(
    (enrollmentId: string): Promise<void> =>
      run(() => unenrollStudentFromClass(enrollmentId), "Failed to unenroll student"),
    [run],
  );

  useEffect(() => {
    if (schoolId) {
      loadClasses();
    }
  }, [schoolId, loadClasses]);

  return (
    <ClassContext.Provider
      value={{
        classes, loading, error, loadClasses, createClass, updateClass, deleteClass,
        getStudentEnrollments: getStudentEnrollmentsCallback,
        enrollStudent,
        unenrollStudent,
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
