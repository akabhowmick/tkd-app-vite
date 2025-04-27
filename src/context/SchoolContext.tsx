import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../api/supabase";

interface SchoolContextType {
  sales: number;
  attendance: number;
  clients: number;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setUser] = useState(0);
  const [attendance, setSchool] = useState(0);
  const [clients, setClients] = useState(0);

  // derive from supabase
  useEffect(() => {
    const fetchUserCount = async () => {
      const { count, error } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("Error fetching user count:", error.message);
        return;
      }

      if (typeof count === "number") {
        setClients(count); // You can also set this to setSales or setAttendance
      }
    };

    fetchUserCount();
  }, []);

  return (
    <SchoolContext.Provider value={{ sales, attendance, clients }}>
      {children}
    </SchoolContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) throw new Error("useSchool must be used within an SchoolProvider");
  return context;
};
