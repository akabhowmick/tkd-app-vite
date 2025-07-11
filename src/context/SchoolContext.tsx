// updated SchoolContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { supabase } from "../api/supabase";
import { School } from "../types/school";
import { getSchoolByAdmin } from "../api/SchoolRequests/schoolRequests";
import { useAuth } from "./AuthContext";
import { UserProfile } from "../types/user";
import { getStudents } from "../api/StudentRequests/studentRequests";

interface SchoolContextType {
  sales: number;
  attendance: number;
  clients: number;
  school: School | null;
  schoolId: string;
  loading: boolean;
  students: UserProfile[];
  fetchSchool: () => Promise<void>;
  loadStudents: (currentSchoolId?: string, forceRefresh?: boolean) => Promise<void>;
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
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [schoolId, setSchoolId] = useState<string>("");
  const [studentsCache, setStudentsCache] = useState<Map<string, UserProfile[]>>(new Map());
  const [lastStudentsFetch, setLastStudentsFetch] = useState<Map<string, number>>(new Map());

  const fetchSchool = async () => {
    if (user) {
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
    }
  };

  const loadStudents = useCallback(async (currentSchoolId?: string, forceRefresh = false) => {
    const targetSchoolId = currentSchoolId || schoolId;
    if (!targetSchoolId) return;
    
    const now = Date.now();
    const cacheTimeout = 5 * 60 * 1000; // 5 minutes
    const lastFetch = lastStudentsFetch.get(targetSchoolId) || 0;
    const cachedStudents = studentsCache.get(targetSchoolId);
    
    // Return cached data if it's fresh and not forcing refresh
    if (!forceRefresh && cachedStudents && (now - lastFetch) < cacheTimeout) {
      setStudents(cachedStudents);
      return;
    }
    
    try {
      setLoading(true);
      const allUsers = await getStudents();
      // Filter students by school_id and role
      const filtered = allUsers.filter((user) => 
        user.role === "Student" && user.school_id === targetSchoolId
      );
      
      // Update cache
      setStudentsCache(prev => new Map(prev).set(targetSchoolId, filtered));
      setLastStudentsFetch(prev => new Map(prev).set(targetSchoolId, now));
      setStudents(filtered);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  }, [schoolId, studentsCache, lastStudentsFetch]);

  // Effect to fetch school data when user is available
  useEffect(() => {
    if (user) {
      fetchSchool();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Memoized students for the current school
  const memoizedStudents = useMemo(() => {
    return students;
  }, [students]);

  // Function to force refresh students
  const refreshStudents = useCallback(async () => {
    await loadStudents(schoolId, true);
  }, [loadStudents, schoolId]);

  // Effect to load students when schoolId changes
  useEffect(() => {
    if (schoolId) {
      loadStudents(schoolId);
    }
  }, [schoolId, loadStudents]);

  // Effect to fetch metrics when schoolId is available
  useEffect(() => {
    const fetchMetrics = async () => {
      if (schoolId !== "") {
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
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("school_id", schoolId);

          if (userError) throw userError;
          setClients(userCount ?? 0);

          const { data: salesData, error: salesError } = await supabase
            .from("sales")
            .select("amount")
            .eq("school_id", schoolId);

          if (salesError) throw salesError;

          const totalSales =
            salesData?.reduce((sum, record) => sum + parseFloat(record.amount), 0) ?? 0;
          setSales(totalSales);

          const { count: attendanceCount, error: attendanceError } = await supabase
            .from("attendance")
            .select("*", { count: "exact", head: true })
            .eq("school_id", schoolId);

          if (attendanceError) throw attendanceError;
          setAttendance(attendanceCount ?? 0);
        } catch (err) {
          console.error("Error fetching school dashboard:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMetrics();
  }, [schoolId]);

  // CRUD operations
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
    // Clear cache for deleted school
    setStudentsCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(id);
      return newCache;
    });
    setLastStudentsFetch(prev => {
      const newCache = new Map(prev);
      newCache.delete(id);
      return newCache;
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