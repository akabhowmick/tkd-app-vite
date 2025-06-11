import { useEffect, useState } from "react";

import { UserProfile } from "../../../types/user";
import { AdminStudentForm } from "./AdminAddStudent";
import { deleteStudent, getStudents } from "../../../api/StudentRequests/studentRequests";

import Swal from "sweetalert2";

export const StudentListPage = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const allUsers = await getStudents();
      const filtered = allUsers.filter((user) => user.role === "Student");
      setStudents(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: "Delete Student?",
        text: "Are you sure you want to delete this student? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        // Show loading
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the student.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          await deleteStudent(id);
          await loadStudents();

          // Success message
          Swal.fire({
            title: "Deleted!",
            text: "The student has been successfully deleted.",
            icon: "success",
            confirmButtonColor: "#10b981",
            timer: 2000,
            timerProgressBar: true,
          });
        } catch (error) {
          // Error message
          Swal.fire({
            title: "Error!",
            text: `Failed to delete the student. Please try again. ${error}`,
            icon: "error",
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
  };

  const handleFormSuccess = async () => {
    setEditingUser(null);
    await loadStudents();
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-black">Student Management</h1>

      {editingUser && (
        <div className="mb-6 border p-4 rounded bg-white">
          <AdminStudentForm existingUser={editingUser} onSuccess={handleFormSuccess} />
          <button
            className="mt-2 text-sm text-gray-500 hover:underline"
            onClick={() => setEditingUser(null)}
          >
            Cancel
          </button>
        </div>
      )}

      <table className="w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-100 text-left text-black">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="p-4 text-center">
                Loading...
              </td>
            </tr>
          ) : students.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-4 text-center text-gray-500">
                No students found.
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student.id} className="border-t text-black">
                <td className="p-3">{student.name}</td>
                <td className="p-3">{student.email}</td>
                <td className="p-3">{student.phone}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(student.id!)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
