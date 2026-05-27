import { Fragment, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Student } from "../../../../types/user";
import { createStudent } from "../../../../api/StudentRequests/studentRequests";
import { useSchool } from "../../../../context/SchoolContext";
import { useBelts } from "../../../../context/BeltContext";
import { AppConfirmModal } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { validateFormData } from "../../../../utils/formValidation";
import { Skeleton } from "../../../ui/skeleton";
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa";

// ── Types ─────────────────────────────────────────────────────────────────────
type EditForm = { name: string; email: string; phone: string; current_rank_id: string };
type AddForm  = { name: string; email: string; phone: string; current_rank_id: string };
type BulkRow  = { name: string; email: string; phone: string; current_rank_id: string };
type AddTab   = "single" | "bulk";

const emptyAddForm  = (): AddForm  => ({ name: "", email: "", phone: "", current_rank_id: "" });
const emptyBulkRow  = (): BulkRow  => ({ name: "", email: "", phone: "", current_rank_id: "" });
const MAX_BULK = 20;

// ── Skeleton ──────────────────────────────────────────────────────────────────
const StudentListSkeleton = () => (
  <div className="max-w-6xl mx-auto p-4">
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

// ── Shared belt select ────────────────────────────────────────────────────────
const BeltSelect = ({
  value,
  onChange,
  ranks,
}: {
  value: string;
  onChange: (v: string) => void;
  ranks: { rank_id: string; rank_name: string; rank_order: number }[];
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
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
);

// ── Main component ────────────────────────────────────────────────────────────
export const StudentListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadStudents, handleDelete, students, schoolId, loading, patchStudent } = useSchool();
  const { ranks } = useBelts();

  // ── Edit (inline row) state ────────────────────────────────────────────────
  const [editingUser, setEditingUser] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", email: "", phone: "", current_rank_id: "" });
  const [editError, setEditError] = useState<string | null>(null);

  // ── Add (inline panel) state ───────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<AddTab>("single");

  const [addForm, setAddForm] = useState<AddForm>(emptyAddForm());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyBulkRow()]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // ── Delete confirm state ───────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean; studentId: string; studentName: string;
  }>({ open: false, studentId: "", studentName: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Pagination ─────────────────────────────────────────────────────────────
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const viewStudent = (student: Student) =>
    navigate(`${location.pathname.replace(/\/$/, "")}/${student.id}`);

  const handleEdit = (user: Student) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone ?? "", current_rank_id: user.current_rank_id ?? "" });
    setEditError(null);
  };

  const handleEditSave = async () => {
    setEditError(null);
    const validationError = validateFormData({ name: editForm.name, email: editForm.email, phone: editForm.phone });
    if (validationError) { setEditError(validationError); return; }
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

  const openAdd = () => {
    setAddForm(emptyAddForm());
    setBulkRows([emptyBulkRow()]);
    setAddError(null);
    setBulkError(null);
    setAddSuccess(null);
    setAddTab("single");
    setAddOpen(true);
  };
  const closeAdd = () => { setAddOpen(false); setAddSuccess(null); };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const err = validateFormData({ name: addForm.name, email: addForm.email, phone: addForm.phone });
    if (err) { setAddError(err); return; }
    setAddLoading(true);
    try {
      await createStudent({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        role: "Student",
        school_id: schoolId,
        current_rank_id: addForm.current_rank_id || undefined,
      });
      await loadStudents();
      setAddSuccess(`${addForm.name.trim()} added successfully.`);
      setAddForm(emptyAddForm());
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add student.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    const toSubmit = bulkRows.filter((r) => r.name || r.email);
    if (toSubmit.length === 0) { setBulkError("Fill in at least one student."); return; }
    for (let i = 0; i < toSubmit.length; i++) {
      const err = validateFormData(toSubmit[i]);
      if (err) { setBulkError(`Row ${i + 1}: ${err}`); return; }
    }
    setBulkLoading(true);
    const failed: string[] = [];
    for (const s of toSubmit) {
      try {
        await createStudent({
          name: s.name.trim(), email: s.email.trim(), phone: s.phone.trim(),
          role: "Student", school_id: schoolId,
          current_rank_id: s.current_rank_id || undefined,
        });
      } catch { failed.push(s.name || s.email); }
    }
    await loadStudents();
    setBulkLoading(false);
    if (failed.length === 0) {
      setAddSuccess(`${toSubmit.length} student${toSubmit.length !== 1 ? "s" : ""} added successfully.`);
      setBulkRows([emptyBulkRow()]);
    } else {
      setBulkError(`${toSubmit.length - failed.length} added. Failed: ${failed.join(", ")}.`);
    }
  };

  const updateBulkRow = (idx: number, field: keyof BulkRow, value: string) =>
    setBulkRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const requestDelete = (student: Student) =>
    setDeleteConfirm({ open: true, studentId: student.id!, studentName: student.name });

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try { await handleDelete(deleteConfirm.studentId); }
    finally { setDeleteLoading(false); setDeleteConfirm({ open: false, studentId: "", studentName: "" }); }
  };

  useEffect(() => { loadStudents(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getRankName = (rankId?: string | null) =>
    !rankId ? "" : (ranks.find((r) => r.rank_id === rankId)?.rank_name ?? rankId);

  if (loading && students.length === 0) return <StudentListSkeleton />;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-black">Student Management</h1>

      {/* ── Add button ────────────────────────────────────────────────────── */}
      <div className="my-6">
        {!addOpen && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
          >
            <FaPlus size={14} /> Add New Student
          </button>
        )}
      </div>

      {/* ── Inline add panel ──────────────────────────────────────────────── */}
      {addOpen && (
        <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Add Student</h2>
            <button onClick={closeAdd} className="text-gray-400 hover:text-gray-600">
              <FaTimes size={16} />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
            {(["single", "bulk"] as AddTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setAddTab(tab); setAddError(null); setBulkError(null); setAddSuccess(null); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  addTab === tab ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "single" ? "Single" : "Bulk"}
              </button>
            ))}
          </div>

          {/* Success banner */}
          {addSuccess && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-4 py-2 mb-4">
              <p className="text-sm text-green-700 font-medium">✓ {addSuccess}</p>
              <button onClick={() => setAddSuccess(null)} className="text-green-500 hover:text-green-700 ml-4">
                <FaTimes size={12} />
              </button>
            </div>
          )}

          {/* ── Single form ── */}
          {addTab === "single" && (
            <form onSubmit={handleSingleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                  <Input placeholder="Full name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                  <Input type="email" placeholder="student@example.com" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input type="tel" placeholder="(555) 123-4567" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Belt <span className="text-gray-400 font-normal">(optional)</span></label>
                  <BeltSelect value={addForm.current_rank_id} onChange={(v) => setAddForm((f) => ({ ...f, current_rank_id: v }))} ranks={ranks} />
                </div>
              </div>
              {addError && <p className="text-sm text-red-600 mb-3">{addError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeAdd} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">
                  {addLoading ? "Adding…" : "Add Student"}
                </button>
              </div>
            </form>
          )}

          {/* ── Bulk form ── */}
          {addTab === "bulk" && (
            <form onSubmit={handleBulkSubmit}>
              {/* Column headers — hidden on mobile, shown on sm+ */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_2rem] gap-2 px-1 mb-1">
                {["Name *", "Email *", "Phone", "Belt", ""].map((h, i) => (
                  <span key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</span>
                ))}
              </div>

              <div className="flex flex-col gap-2 mb-3 max-h-72 overflow-y-auto pr-1">
                {bulkRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_2rem] sm:grid-cols-[1fr_1fr_1fr_1fr_2rem] gap-2 items-start sm:items-center p-3 sm:p-0 rounded-lg border border-gray-200 sm:border-0 sm:rounded-none bg-gray-50 sm:bg-transparent">
                    {/* On mobile: stacked inside the card */}
                    <div className="grid grid-cols-1 sm:contents gap-2">
                      <div className="sm:hidden">
                        <span className="text-xs text-gray-400">Name *</span>
                        <Input placeholder="Full name" value={row.name} onChange={(e) => updateBulkRow(idx, "name", e.target.value)} />
                      </div>
                      <Input className="hidden sm:flex" placeholder="Full name" value={row.name} onChange={(e) => updateBulkRow(idx, "name", e.target.value)} />

                      <div className="sm:hidden">
                        <span className="text-xs text-gray-400">Email *</span>
                        <Input type="email" placeholder="student@example.com" value={row.email} onChange={(e) => updateBulkRow(idx, "email", e.target.value)} />
                      </div>
                      <Input className="hidden sm:flex" type="email" placeholder="student@example.com" value={row.email} onChange={(e) => updateBulkRow(idx, "email", e.target.value)} />

                      <div className="sm:hidden">
                        <span className="text-xs text-gray-400">Phone</span>
                        <Input type="tel" placeholder="(555) 123-4567" value={row.phone} onChange={(e) => updateBulkRow(idx, "phone", e.target.value)} />
                      </div>
                      <Input className="hidden sm:flex" type="tel" placeholder="(555) 123-4567" value={row.phone} onChange={(e) => updateBulkRow(idx, "phone", e.target.value)} />

                      <div className="sm:hidden">
                        <span className="text-xs text-gray-400">Belt</span>
                        <BeltSelect value={row.current_rank_id} onChange={(v) => updateBulkRow(idx, "current_rank_id", v)} ranks={ranks} />
                      </div>
                      <div className="hidden sm:block">
                        <BeltSelect value={row.current_rank_id} onChange={(v) => updateBulkRow(idx, "current_rank_id", v)} ranks={ranks} />
                      </div>
                    </div>

                    {/* Delete row */}
                    <button
                      type="button"
                      onClick={() => setBulkRows((rows) => rows.filter((_, i) => i !== idx))}
                      disabled={bulkRows.length === 1}
                      className="flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 self-start sm:self-auto mt-1 sm:mt-0"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setBulkRows((rows) => [...rows, emptyBulkRow()])}
                disabled={bulkRows.length >= MAX_BULK || bulkLoading}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-40 mb-4"
              >
                <FaPlus size={11} /> Add Row
              </button>

              {bulkError && <p className="text-sm text-red-600 mb-3">{bulkError}</p>}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeAdd} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={bulkLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">
                  {bulkLoading ? "Adding…" : `Add ${bulkRows.filter((r) => r.name || r.email).length || "All"} Students`}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Student table header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-black">View Current Students</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          {([25, 50, 100] as const).map((n) => (
            <button
              key={n}
              onClick={() => changePageSize(n)}
              className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                pageSize === n ? "bg-black text-white border-black" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
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
              <td colSpan={5} className="p-4 text-center text-gray-500">No students found.</td>
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
                          disabled={isPending}
                          className="w-full px-3 py-1 text-xs font-medium rounded border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isPending ? "Editing…" : "Edit"}
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

                  {/* Inline edit row */}
                  {editingUser?.id === student.id && (
                    <tr className="bg-blue-50 border-t border-blue-200">
                      <td colSpan={5} className="p-4">
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Name *</label>
                              <Input placeholder="Full name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Email *</label>
                              <Input type="email" placeholder="student@example.com" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Phone</label>
                              <Input type="tel" placeholder="(555) 123-4567" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Belt</label>
                              <BeltSelect value={editForm.current_rank_id} onChange={(v) => setEditForm((f) => ({ ...f, current_rank_id: v }))} ranks={ranks} />
                            </div>
                          </div>
                          {editError && <p className="text-sm text-red-600">{editError}</p>}
                          <div className="flex gap-2">
                            <button onClick={handleEditSave} className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">Save Changes</button>
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
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

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {students.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Showing {Math.min((currentPage - 1) * pageSize + 1, students.length)}–
            {Math.min(currentPage * pageSize, students.length)} of {students.length} students
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded border border-gray-300 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">←</button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border border-gray-300 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">→</button>
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
