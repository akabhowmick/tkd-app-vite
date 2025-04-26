import React, { createContext, useContext, useState, ReactNode } from "react";

import { BaseUser, School} from "../types/user";
// import { supabase } from "../api/supabase";

interface SchoolContextType {
  sales: number;
  attendance: number; 
  clients: number;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sales, setUser] = useState<BaseUser | null>(0);
  const [attendance, setSchool] = useState<School | null>(0);
  const [clients, setClients] = useState<School | null>(null);


  // derive from supabase




 

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
