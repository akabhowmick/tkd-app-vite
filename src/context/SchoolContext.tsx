import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../api/supabase";
import { School } from "../types/school";
import { getSchoolByAdmin } from "../api/SchoolRequests/schoolRequests";
import { useAuth } from "./AuthContext";
import { Student } from "../types/user";
import { deleteStudent, getStudents } from "../api/StudentRequests/studentRequests";
import Swal from "sweetalert2";

interface SchoolContextType {
  sales: number;
  attendance: number;
  clients: number;
  school: School | null;
  schoolId: string;
  loading: boolean;
  students: Student[];
  fetchSchool: () => Promise<void>;
  loadStudents: (currentSchoolId?: string, forceRefresh?: boolean) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  refreshStudents: () => Promise<void>;
  setSchoolId: React.Dispatch<React.SetStateAction<string>>;
  createSchool: (school: Omit<School, "id" | "created_at">) => Promise<void>;
  updateSchool: (id: string, updates: Partial<Omit<School, "id" | "created_at">>) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sales, setSales] = useState<number>(0);
  const [attendance, setAttendance] = useState<number>(0);
  const [clients, setClients] = useState<number>(0);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");
  const [studentsCache, setStudentsCache] = useState<Map<string, Student[]>>(new Map());
  const [lastStudentsFetch, setLastStudentsFetch] = useState<Map<string, number>>(new Map());

  const fetchSchool = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetchedSchool = await getSchoolByAdmin(user.id!);
      setSchool(fetchedSchool);
      if (fetchedSchool) {
        setSchoolId(fetchedSchool.id);
      }
    } catch (error) {
      console.error("Error fetching school:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLastName = (name: string = "") => name.trim().split(" ").pop() ?? "";

  const loadStudents = useCallback(
    async (currentSchoolId?: string, forceRefresh = false) => {
      const targetSchoolId = currentSchoolId || schoolId;
      if (!targetSchoolId) return;

      const now = Date.now();
      const cacheTimeout = 5 * 60 * 1000;
      const lastFetch = lastStudentsFetch.get(targetSchoolId) || 0;
      const cachedStudents = studentsCache.get(targetSchoolId);

      if (!forceRefresh && cachedStudents && now - lastFetch < cacheTimeout) {
        setStudents(cachedStudents);
        return;
      }

      try {
        setLoading(true);
        const filtered = await getStudents(targetSchoolId);
        const sorted = filtered.sort((a, b) =>
          getLastName(a.name).localeCompare(getLastName(b.name)),
        );

        setStudentsCache((prev) => new Map(prev).set(targetSchoolId, sorted));
        setLastStudentsFetch((prev) => new Map(prev).set(targetSchoolId, now));
        setStudents(sorted);
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        setLoading(false);
      }
    },
    [schoolId, studentsCache, lastStudentsFetch],
  );

  const handleDelete = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: "Delete Student?",
        text: "Are you sure you want to delete this student? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the student.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => Swal.showLoading(),
        });

        try {
          await deleteStudent(id);
          await loadStudents(schoolId, true);

          Swal.fire({
            title: "Deleted!",
            text: "The student has been successfully deleted.",
            icon: "success",
            confirmButtonColor: "#10b981",
            timer: 1000,
            timerProgressBar: true,
          });
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: `Failed to delete the student. Please try again. ${error}`,
            icon: "error",
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
    }
  };

  useEffect(() => {
    if (user) fetchSchool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const memoizedStudents = useMemo(() => students, [students]);

  const refreshStudents = useCallback(async () => {
    await loadStudents(schoolId, true);
  }, [loadStudents, schoolId]);

  useEffect(() => {
    if (schoolId) loadStudents(schoolId);
  }, [schoolId, loadStudents]);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!schoolId) return;

      try {
        setLoading(true);

        const { data: schoolData, error: schoolError } = await supabase
          .from("schools")
          .select("*")
          .eq("id", schoolId)
          .single();

        if (schoolError) throw schoolError;
        setSchool(schoolData);

        // Student count
        const { count: userCount, error: userError } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId);

        if (userError) throw userError;
        setClients(userCount ?? 0);

        // Today's present attendance count
        const today = new Date().toISOString().split("T")[0];
        const { count: attendanceCount, error: attendanceError } = await supabase
          .from("attendance_records")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("date", today)
          .eq("status", "present");

        if (attendanceError) throw attendanceError;
        setAttendance(attendanceCount ?? 0);

        // Today's revenue — now that sales has school_id, this query works
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("amount")
          .eq("school_id", schoolId)
          .gte("payment_date", `${today}T00:00:00`)
          .lte("payment_date", `${today}T23:59:59`);

        if (salesError) throw salesError;
        const totalSales = (salesData ?? []).reduce(
          (sum: number, row: { amount: number }) => sum + row.amount,
          0,
        );
        setSales(totalSales);
      } catch (err) {
        console.error("Error fetching school dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [schoolId]);

  const createSchool = async (school: Omit<School, "id" | "created_at">) => {
    const { data, error } = await supabase.from("schools").insert(school).select().single();
    if (error) throw error;
    setSchool(data);
    setSchoolId(data.id);
  };

  const updateSchool = async (id: string, updates: Partial<Omit<School, "id" | "created_at">>) => {
    const { data, error } = await supabase
      .from("schools")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    setSchool(data);
  };

  const deleteSchool = async (id: string) => {
    const { error } = await supabase.from("schools").delete().eq("id", id);
    if (error) throw error;
    setSchool(null);
    setSchoolId("");
    setStudents([]);
    setStudentsCache((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setLastStudentsFetch((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <SchoolContext.Provider
      value={{
        fetchSchool,
        sales,
        students: memoizedStudents,
        attendance,
        clients,
        school,
        loading,
        schoolId,
        loadStudents,
        handleDelete,
        refreshStudents,
        setSchoolId,
        createSchool,
        updateSchool,
        deleteSchool,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) throw new Error("useSchool must be used within a SchoolProvider");
  return context;
};
