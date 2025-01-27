import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { BaseUser, School, UserRole } from "../types/user";

interface AuthContextType {
  user: BaseUser | null;
  school: School | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (newUser: BaseUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BaseUser | null>(null);
  const [school, setSchool] = useState<School | null>(null);

  const mockSchool: School = {
    id: "school-123",
    name: "Best Taekwondo Academy",
    address: "123 Martial Arts Lane",
    createdAt: new Date(),
  };

  const mockUser: BaseUser = {
    id: "user-456",
    name: "John Doe",
    email: "a@b.com",
    phone: "",
    role: UserRole.Student,
    createdAt: new Date(),
    schoolId: mockSchool.id,
  };

  // Login function
  const login = async (email: string, password: string) => {
    // Mock login logic (replace with actual backend logic)
    const mockLoginUser = { email: "test@example.com", password: "123456" };

    if (email === mockLoginUser.email && password === mockLoginUser.password) {
      // Save user to state and localStorage
      setUser(mockUser);
      localStorage.setItem("authUser", JSON.stringify(mockUser));
      localStorage.setItem("authSchool", JSON.stringify(mockSchool));
      return true; // Login successful
    }

    return false; // Invalid credentials
  };

  // Signup function
  const signup = (newUser: BaseUser) => {
    // Mock signup logic (replace with actual backend logic)
    const mockSchool: School = {
      id: "school-123",
      name: "Best Taekwondo Academy",
      address: "123 Martial Arts Lane",
      createdAt: new Date(),
    };

    // Save user and school to state
    setUser(newUser);
    setSchool(mockSchool);

    // Persist user in localStorage
    localStorage.setItem("authUser", JSON.stringify(newUser));
    localStorage.setItem("authSchool", JSON.stringify(mockSchool));
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setSchool(null);

    // Clear localStorage
    localStorage.removeItem("authUser");
    localStorage.removeItem("authSchool");
  };

  // Load user and school from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("authUser");
    const storedSchool = localStorage.getItem("authSchool");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedSchool) setSchool(JSON.parse(storedSchool));
  }, []);

  return (
    <AuthContext.Provider value={{ user, school, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
