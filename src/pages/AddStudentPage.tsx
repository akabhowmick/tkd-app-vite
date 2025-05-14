import { AdminStudentForm } from "../components/AccountDashboards/AdminFeatures/AdminAddStudent"


export const AddStudentPage = () => {
  return (
    <AdminStudentForm onSuccess={function (): void {
      console.log("Function not implemented.")
    } } />
  )
}
