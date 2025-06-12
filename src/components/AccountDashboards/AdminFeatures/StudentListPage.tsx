import { useEffect, useState } from "react";
import { UserProfile } from "../../../types/user";
import { HandleAddOrEdit } from "./HandleAddOrEdit";
import { deleteStudent, updateStudent } from "../../../api/StudentRequests/studentRequests";
import Swal from "sweetalert2";
import { useSchool } from "../../../context/SchoolContext";

export const StudentListPage = () => {
  const { loadStudents, students } = useSchool();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

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

  const handleEditSuccess = () => {
    setEditingUser(null); // Close the edit form after successful update
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-black">Student Management</h1>

      {editingUser && (
        <div className="mb-6 border p-4 rounded bg-white shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Edit Student: {editingUser.name}
          </h3>
          <HandleAddOrEdit
            student={editingUser}
            updateStudent={updateStudent}
            loadStudents={loadStudents}
            buttonText="Update Student"
            onSuccess={handleEditSuccess}
            buttonClassName="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 mr-2"
          />
          <button
            className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            onClick={() => setEditingUser(null)}
          >
            Cancel Edit
          </button>
        </div>
      )}

      <table className="w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-100 text-left text-black">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Role</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No students found.
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student.id} className="border-t text-black">
                <td className="p-3">{student.name}</td>
                <td className="p-3">{student.email}</td>
                <td className="p-3">{student.phone || 'N/A'}</td>
                <td className="p-3">{student.role || 'Student'}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => handleEdit(student)}
                    className="text-blue-600 hover:underline focus:outline-none"
                    disabled={editingUser?.id === student.id}
                  >
                    {editingUser?.id === student.id ? 'Editing...' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(student.id!)}
                    className="text-red-600 hover:underline focus:outline-none"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add Student Button */}
      <div className="mt-6 text-center">
        <HandleAddOrEdit
          createStudent={async (studentData) => {
            // You'll need to import createStudent here or pass it as prop
            const { createStudent } = await import("../../../api/StudentRequests/studentRequests");
            await createStudent(studentData);
          }}
          loadStudents={loadStudents}
          buttonText="Add New Student"
          buttonClassName="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
};