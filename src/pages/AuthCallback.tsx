import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-gray-500 text-sm">Completing sign-in...</p>
    </div>
  );
};

export default AuthCallback;
