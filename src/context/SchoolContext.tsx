import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../api/supabase";

interface SchoolContextType {
  sales: number;
  attendance: number;
  clients: number;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<number>(0);
  const [attendance, setAttendance] = useState<number>(0);
  const [clients, setClients] = useState<number>(0);

  const schoolId = "YOUR_SCHOOL_ID_HERE"; // You can make this dynamic if needed

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get total users
        const { count: userCount, error: userError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId);

        if (userError) throw userError;
        setClients(userCount ?? 0);

        // Get total sales
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("amount")
          .eq("school_id", schoolId);

        if (salesError) throw salesError;

        const totalSales = salesData?.reduce((sum, record) => sum + parseFloat(record.amount), 0) ?? 0;
        setSales(totalSales);

        // Get attendance count
        const { count: attendanceCount, error: attendanceError } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("school_id", schoolId);

        if (attendanceError) throw attendanceError;
        setAttendance(attendanceCount ?? 0);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchMetrics();
  }, [schoolId]);

  return (
    <SchoolContext.Provider value={{ sales, attendance, clients }}>
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
