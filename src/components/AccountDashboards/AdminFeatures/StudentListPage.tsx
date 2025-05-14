import { useEffect, useState } from "react";

import { UserProfile } from "../../../types/user";
import { deleteUser, getUsers } from "../../../api/StudentRequests/studentRequests";
import { AdminStudentForm } from "./AdminAddStudent";

export const StudentListPage = () => {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const allUsers = await getUsers();
      const filtered = allUsers.filter((user) => user.userType === "Student");
      setStudents(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this student?");
    if (!confirmed) return;

    await deleteUser(id);
    await loadStudents();
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
