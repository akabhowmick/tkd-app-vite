import React, { createContext, useContext, useState, ReactNode } from "react";
import { BaseUser, UserRole } from "../types/user";

interface AuthContextType {
  user: BaseUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BaseUser | null>(null);

  const login = async (email: string, password: string) => {
    // TODO: Implement login logic with backend
    console.log("Logging in", { email, password });
    setUser({ id: "1", email, role: UserRole.Student, name: "John Doe", createdAt: new Date() });
  };

  const logout = () => {
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
