import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { BaseUser, UserRole } from "../types/user";
import { UserSignIn } from "../types/auth";
import { School } from "../types/school";
import { supabase } from "../api/supabase";
import { identifyUser, resetIdentity, track } from "../analytics/posthog";
import { setSentryUser, clearSentryUser } from "../analytics/sentry";

interface AuthResult {
  success: boolean;
  message: string;
}

interface AuthContextType {
  user: BaseUser | null;
  school: School | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (newUser: UserSignIn, password: string) => Promise<AuthResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const friendlyAuthError = (message: string): string => {
  if (message.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (message.includes("Email not confirmed"))
    return "Please confirm your email before logging in.";
  if (message.includes("User already registered"))
    return "An account with this email already exists.";
  if (message.includes("Password should be at least")) return "Password is too short.";
  if (message.includes("Unable to validate email address"))
    return "Please enter a valid email address.";
  if (message.includes("rate limit"))
    return "Too many attempts. Please wait a moment and try again.";
  return "Something went wrong. Please try again.";
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BaseUser | null>(null);
  const [school, setSchool] = useState<School | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      // Only log when there's actually an error — previously this fired on every
      // successful load because the check was missing
      if (error) {
        console.error("Error fetching user session:", error);
        return;
      }
      if (data?.user) {
        const m = data.user.user_metadata;
        const storedSchool = localStorage.getItem("authSchool");
        setUser({
          id: data.user.id,
          name: m?.name || "Unknown User",
          email: data.user.email || "",
          phone: m?.phone || "",
          role: m?.role || UserRole.Student,
          createdAt: new Date(data.user.created_at),
          schoolId: m?.schoolId || "",
        });
        if (storedSchool) setSchool(JSON.parse(storedSchool));
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const m = session.user.user_metadata;
        setUser({
          id: session.user.id,
          name: m?.name || m?.full_name || "Unknown User",
          email: session.user.email || "",
          phone: m?.phone || "",
          role: m?.role || UserRole.Student,
          createdAt: new Date(session.user.created_at),
          schoolId: m?.schoolId || "",
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: friendlyAuthError(error.message) };

    const m = data.user?.user_metadata;
    setUser({
      id: data.user.id,
      name: m?.name || "Unknown User",
      email: data.user.email || "",
      phone: m?.phone || "",
      role: m?.role || UserRole.Student,
      createdAt: new Date(data.user.created_at),
      schoolId: m?.schoolId || null,
    });

    return { success: true, message: "" };
  };

  const signup = async (newUser: UserSignIn, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password,
      options: { data: { role: newUser.role } },
    });

    if (error) return { success: false, message: friendlyAuthError(error.message) };

    if (data.user && !data.session) {
      return {
        success: false,
        message: "Account created! Please check your email to confirm before logging in.",
      };
    }

    setUser({
      id: data.user!.id,
      name: "",
      email: newUser.email,
      phone: "",
      role: newUser.role,
      createdAt: new Date(),
      schoolId: "",
    });

    return { success: true, message: "" };
  };

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
