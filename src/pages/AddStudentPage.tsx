import { useNavigate } from "react-router-dom";
import { AdminStudentForm } from "../components/AccountDashboards/AdminFeatures/AdminAddStudent";

export const AddStudentPage = () => {
  const navigate = useNavigate();

  return (
    <AdminStudentForm
      onSuccess={function (): void {
        navigate("/dashboard");
      }}
    />
  );
};
