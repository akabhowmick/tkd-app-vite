// updated SchoolContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../api/supabase";
import { School } from "../types/school";

interface SchoolContextType {
  sales: number;
  attendance: number;
  clients: number;
  school: School | null;
  schoolId: string;
  loading: boolean;
  setSchoolId: React.Dispatch<React.SetStateAction<string>>;
  createSchool: (school: Omit<School, "id" | "created_at">) => Promise<void>;
  updateSchool: (id: string, updates: Partial<Omit<School, "id" | "created_at">>) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<number>(0);
  const [attendance, setAttendance] = useState<number>(0);
  const [clients, setClients] = useState<number>(0);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [schoolId, setSchoolId] = useState<string>("");

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
  };

  return (
    <SchoolContext.Provider
      value={{
        sales,
        attendance,
        clients,
        school,
        loading,
        schoolId,
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
