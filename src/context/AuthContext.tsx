import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { BaseUser, School, UserRole } from "../types/user";

interface AuthContextType {
  user: BaseUser | null;
  school: School | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BaseUser | null>(null);
  const [school, setSchool] = useState<School | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login logic (replace with actual backend logic)
    const mockSchool: School = {
      id: "school-123",
      name: "Best Taekwondo Academy",
      address: "123 Martial Arts Lane",
      createdAt: new Date(),
    };

    const mockUser: BaseUser = {
      id: "user-456",
      name: "John Doe",
      email,
      phone: "1234567890",
      role: UserRole.Student,
      createdAt: new Date(),
      schoolId: mockSchool.id,
    };
    console.log(password);

    setSchool(mockSchool);
    setUser(mockUser);
  };

     // Persist user state in localStorage
     useEffect(() => {
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }, []);

    // Logout function
    const logout = () => {
      setUser(null);
      localStorage.removeItem("authUser");
    };

  return (
    <AuthContext.Provider value={{ user, school, login, logout }}>{children}</AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
