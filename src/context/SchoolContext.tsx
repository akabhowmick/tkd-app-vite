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

interface SchoolContextType {
  sales: number;
  attendance: number;
  clients: number;
  school: School | null;
  schoolId: string;
  loading: boolean;
  students: Student[];
  salesChange: number | null;
  attendanceChange: number | null;
  clientsChange: number | null;
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
  const [salesChange, setSalesChange] = useState<number | null>(null);
  const [attendanceChange, setAttendanceChange] = useState<number | null>(null);
  const [clientsChange, setClientsChange] = useState<number | null>(null);

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
    await deleteStudent(id);
    await loadStudents(schoolId, true);
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

        const { count: userCount, error: userError } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId);

        if (userError) throw userError;
        setClients(userCount ?? 0);

        const today = new Date().toISOString().split("T")[0];
        const { count: attendanceCount, error: attendanceError } = await supabase
          .from("attendance_records")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("date", today)
          .eq("status", "present");

        if (attendanceError) throw attendanceError;
        setAttendance(attendanceCount ?? 0);

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
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yDate = yesterday.toISOString().split("T")[0];

        const { data: yesterdaySales } = await supabase
          .from("sales")
          .select("amount")
          .eq("school_id", schoolId)
          .gte("payment_date", `${yDate}T00:00:00`)
          .lte("payment_date", `${yDate}T23:59:59`);

        const yesterdayTotal = (yesterdaySales ?? []).reduce(
          (sum: number, row: { amount: number }) => sum + row.amount,
          0,
        );
        setSalesChange(
          yesterdayTotal === 0
            ? null
            : Math.round(((totalSales - yesterdayTotal) / yesterdayTotal) * 100),
        );

        const { count: yesterdayAttendance } = await supabase
          .from("attendance_records")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId)
          .eq("date", yDate)
          .eq("status", "present");

        const yAtt = yesterdayAttendance ?? 0;
        setAttendanceChange(
          yAtt === 0 ? null : Math.round((((attendanceCount ?? 0) - yAtt) / yAtt) * 100),
        );
        setClientsChange(null);
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
        salesChange,
        attendanceChange,
        clientsChange,
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
