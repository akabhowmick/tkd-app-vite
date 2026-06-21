import { useEffect, useState } from "react";
import { Pencil, Check, X, Loader2, Link2, Link2Off } from "lucide-react";
import { useSchool } from "../../../../../context/SchoolContext";
import { getUsers, updateUser } from "../../../../../api/AppUserRequests/UserService";
import { UserProfile } from "../../../../../types/user";
import { Input } from "../../../../ui/input";
import { Skeleton } from "../../../../ui/skeleton";

type EditForm = { name: string; phone: string };

export const InstructorManagement = () => {
  const { schoolId } = useSchool();

  const [instructors, setInstructors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    getUsers("Instructor")
      .then((data) => setInstructors((data as UserProfile[]) ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [schoolId]);

  const startEdit = (instructor: UserProfile) => {
    setEditingId(instructor.id ?? null);
    setEditForm({ name: instructor.name, phone: instructor.phone });
    setSaveError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveError(null);
  };

  const saveEdit = async (id: string) => {
    if (!editForm.name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateUser(id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
      });
      setInstructors((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updated } : i))
      );
      setEditingId(null);
    } catch {
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fixLink = async (id: string) => {
    setFixingId(id);
    try {
      const updated = await updateUser(id, { school_id: schoolId });
      setInstructors((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updated } : i))
      );
    } catch {
      // silent — row badge will stay yellow
    } finally {
      setFixingId(null);
    }
  };

  const isLinked = (instructor: UserProfile) =>
    instructor.school_id === schoolId;

  const fmt = (dateStr?: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-500 mt-1">
            View and manage instructors linked to your school.
          </p>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : instructors.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
              <span className="text-4xl">👨‍🏫</span>
              <p className="font-medium">No instructors found</p>
              <p className="text-sm">
                Add instructors via the "Add User" button in User Management.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">School Link</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((instructor, idx) => {
                  const linked = isLinked(instructor);
                  const isEditing = editingId === instructor.id;

                  return (
                    <>
                      <tr
                        key={instructor.id}
                        className={`border-b border-gray-100 transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } ${isEditing ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {instructor.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {instructor.email}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {instructor.phone || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {linked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <Link2 className="h-3 w-3" />
                              Linked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                              <Link2Off className="h-3 w-3" />
                              Unlinked
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {fmt(instructor.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {!linked && (
                              <button
                                onClick={() => fixLink(instructor.id!)}
                                disabled={fixingId === instructor.id}
                                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors disabled:opacity-50"
                                title="Fix school link"
                              >
                                {fixingId === instructor.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Link2 className="h-3 w-3" />
                                )}
                                Fix Link
                              </button>
                            )}
                            <button
                              onClick={() =>
                                isEditing ? cancelEdit() : startEdit(instructor)
                              }
                              className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              title={isEditing ? "Cancel edit" : "Edit"}
                            >
                              {isEditing ? (
                                <X className="h-4 w-4" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline edit row */}
                      {isEditing && (
                        <tr key={`${instructor.id}-edit`} className="bg-blue-50 border-b border-blue-100">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="flex flex-wrap items-end gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-600">
                                  Name
                                </label>
                                <Input
                                  value={editForm.name}
                                  onChange={(e) =>
                                    setEditForm((f) => ({
                                      ...f,
                                      name: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm w-52"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-gray-600">
                                  Phone
                                </label>
                                <Input
                                  value={editForm.phone}
                                  onChange={(e) =>
                                    setEditForm((f) => ({
                                      ...f,
                                      phone: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm w-40"
                                  placeholder="(555) 000-0000"
                                />
                              </div>
                              <div className="flex items-center gap-2 pb-0.5">
                                <button
                                  onClick={() => saveEdit(instructor.id!)}
                                  disabled={saving}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                  {saving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
                                >
                                  Cancel
                                </button>
                                {saveError && (
                                  <span className="text-xs text-red-600">
                                    {saveError}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Count */}
        {!loading && instructors.length > 0 && (
          <p className="mt-3 text-xs text-gray-400 text-right">
            {instructors.length} instructor{instructors.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
};
