import { Fragment, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Student } from "../../../../types/user";
import { HandleAddOrEdit } from "./HandleAddOrEdit";
import { createStudent } from "../../../../api/StudentRequests/studentRequests";
import { useSchool } from "../../../../context/SchoolContext";
import { useBelts } from "../../../../context/BeltContext";
import { AppConfirmModal } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { validateFormData } from "../../../../utils/formValidation";
import { Skeleton } from "../../../ui/skeleton";

type EditForm = { name: string; email: string; phone: string; current_rank_id: string };

const StudentListSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4">
    <Skeleton className="h-9 w-56 mb-4" />
    <Skeleton className="h-10 w-40 my-6" />
    <Skeleton className="h-8 w-48 mb-4" />
    <div className="w-full bg-white shadow rounded overflow-hidden">
      <div className="bg-gray-100 grid grid-cols-5 gap-3 p-3">
        {["w-16", "w-32", "w-20", "w-16", "w-16"].map((w, i) => (
          <Skeleton key={i} className={`h-4 ${w}`} />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`grid grid-cols-5 gap-3 p-3 border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-100"}`}
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const StudentListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadStudents, handleDelete, students, schoolId, loading, patchStudent } = useSchool();
  const { ranks } = useBelts();
  const [editingUser, setEditingUser] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    current_rank_id: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    studentId: string;
    studentName: string;
  }>({ open: false, studentId: "", studentName: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(students.length / pageSize);
  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page: number) => {
    setEditingUser(null);
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const changePageSize = (size: 25 | 50 | 100) => {
    setPageSize(size);
    setCurrentPage(1);
    setEditingUser(null);
  };

  const viewStudent = (student: Student) => {
    navigate(`${location.pathname.replace(/\/$/, "")}/${student.id}`);
  };

  const handleEdit = (user: Student) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      current_rank_id: user.current_rank_id ?? "",
    });
    setEditError(null);
  };

  const handleEditSave = async () => {
    setEditError(null);
    const validationError = validateFormData({
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
    });
    if (validationError) {
      setEditError(validationError);
      return;
    }

    const snapshot = editingUser!;
    setEditingUser(null);

    try {
      await patchStudent(snapshot.id!, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        role: "Student",
        school_id: schoolId,
        current_rank_id: editForm.current_rank_id || undefined,
      });
    } catch {
      handleEdit(snapshot);
      setEditError("Failed to update student. Please try again.");
    }
  };

  const requestDelete = (student: Student) => {
    setDeleteConfirm({ open: true, studentId: student.id!, studentName: student.name });
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await handleDelete(deleteConfirm.studentId);
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm({ open: false, studentId: "", studentName: "" });
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRankName = (rankId?: string | null) => {
    if (!rankId) return "";
    return ranks.find((rank) => rank.rank_id === rankId)?.rank_name ?? rankId;
  };

  if (loading && students.length === 0) return <StudentListSkeleton />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-black">Student Management</h1>

      <div className="my-6 text-left">
        <HandleAddOrEdit
          createStudent={async (studentData) => {
            await createStudent(studentData);
          }}
          loadStudents={loadStudents}
          buttonText="Add New Student"
          buttonClassName="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-black">View Current Students</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          {([25, 50, 100] as const).map((n) => (
            <button
              key={n}
              onClick={() => changePageSize(n)}
              className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                pageSize === n
                  ? "bg-black text-white border-black"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-100 text-left text-black">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Belt</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!loading && students.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No students found.
              </td>
            </tr>
          ) : (
            paginatedStudents.map((student, idx) => {
              const display = editingUser?.id === student.id ? editForm : student;
              const isPending = editingUser?.id === student.id;
              const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-100";
              return (
                <Fragment key={student.id}>
                  <tr className={`border-t text-black ${rowBg} ${isPending ? "opacity-70" : ""}`}>
                    <td className="p-3">{display.name}</td>
                    <td className="p-3">{display.email}</td>
                    <td className="p-3">{display.phone || "N/A"}</td>
                    <td className="p-3">{getRankName(display.current_rank_id)}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => handleEdit(student)}
                          disabled={editingUser?.id === student.id || isPending}
                          className="w-full px-3 py-1 text-xs font-medium rounded border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {editingUser?.id === student.id
                            ? "Editing..."
                            : isPending
                              ? "Saving..."
                              : "Edit"}
                        </button>
                        <button
                          onClick={() => viewStudent(student)}
                          className="w-full px-3 py-1 text-xs font-medium rounded border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                        >
                          View Student
                        </button>
                        <button
                          onClick={() => requestDelete(student)}
                          className="w-full px-3 py-1 text-xs font-medium rounded border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingUser?.id === student.id && (
                    <tr className="bg-blue-50 border-t border-blue-200">
                      <td colSpan={5} className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-4 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Name *</label>
                              <Input
                                type="text"
                                placeholder="Full name"
                                value={editForm.name}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, name: e.target.value }))
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Email *</label>
                              <Input
                                type="email"
                                placeholder="student@example.com"
                                value={editForm.email}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, email: e.target.value }))
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Phone</label>
                              <Input
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={editForm.phone}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Belt</label>
                              <select
                                value={editForm.current_rank_id}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, current_rank_id: e.target.value }))
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                <option value="">No belt</option>
                                {ranks
                                  .sort((a, b) => a.rank_order - b.rank_order)
                                  .map((r) => (
                                    <option key={r.rank_id} value={r.rank_id}>
                                      {r.rank_name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                          {editError && <p className="text-sm text-red-600">{editError}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={handleEditSave}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {students.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Showing {Math.min((currentPage - 1) * pageSize + 1, students.length)}–
            {Math.min(currentPage * pageSize, students.length)} of {students.length} students
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}

      <AppConfirmModal
        open={deleteConfirm.open}
        onOpenChange={(open) => !deleteLoading && setDeleteConfirm((s) => ({ ...s, open }))}
        title="Delete Student?"
        description={`Are you sure you want to delete ${deleteConfirm.studentName}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        variant="destructive"
        confirmLabel="Delete Student"
      />
    </div>
  );
};
