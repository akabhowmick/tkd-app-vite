import { AdminStudentForm } from "../components/Admin/AdminAddStudent"

export const AddStudentPage = () => {
  return (
    <AdminStudentForm onSuccess={function (): void {
      console.log("Function not implemented.")
    } } />
  )
}
