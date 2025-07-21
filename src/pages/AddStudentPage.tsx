import { createStudent } from "../api/StudentRequests/studentRequests";
import { HandleAddOrEdit } from "../components/AccountDashboards/AdminFeatures/StudentView/HandleAddOrEdit";
import { useSchool } from "../context/SchoolContext";

export const AddStudentPage = () => {
  const { loadStudents } = useSchool();
  return (
    <HandleAddOrEdit 
      createStudent={createStudent}
      loadStudents={loadStudents}
      buttonText="Add New Student"
    />
  );
};