import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

import { BaseUser, School, UserRole } from "../types/user";
import { supabase } from "../api/supabase";
import { UserSignIn } from "../types/auth";

interface AuthContextType {
  user: BaseUser | null;
  school: School | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (newUser: UserSignIn, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BaseUser | null>(null);
  const [school, setSchool] = useState<School | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user && !error) {
        const userMetadata = data.user.user_metadata;
        const storedSchool = localStorage.getItem("authSchool");

        setUser({
          id: data.user.id!,
          name: userMetadata?.name || "Unknown User",
          email: data.user.email || "",
          phone: userMetadata?.phone || "",
          role: userMetadata?.role || UserRole.Student,
          createdAt: new Date(data.user.created_at),
          schoolId: userMetadata?.schoolId || null,
        });

        if (storedSchool) setSchool(JSON.parse(storedSchool));
      }
    };

    fetchUser();
  }, []);

  // Login Function using Supabase
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("log in error: ", error);
    if (error) return false;

    const userMetadata = data.user?.user_metadata;
    setUser({
      id: data.user.id,
      name: userMetadata?.name || "Unknown User",
      email: data.user.email || "",
      phone: userMetadata?.phone || "",
      role: userMetadata?.role || UserRole.Student,
      createdAt: new Date(data.user.created_at),
      schoolId: userMetadata?.schoolId || null,
    });

    return true;
  };

  // 🔹 Signup Function using Supabase
  const signup = async (newUser: UserSignIn, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password,
      options: {
        data: {
          role: newUser.role,
        },
      },
    });
    console.log("checking return", data, error);

    if (error) return false;

    setUser({
      id: data.user!.id,
      name: "",
      email: newUser.email,
      phone: "",
      role: newUser.role,
      createdAt: new Date(),
      schoolId: "",
    });

    return true;
  };

  // Logout Function
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSchool(null);
    localStorage.removeItem("authSchool");
  };

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
