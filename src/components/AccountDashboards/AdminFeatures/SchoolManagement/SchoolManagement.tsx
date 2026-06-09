import { useState } from "react";
import { SchoolForm } from "./SchoolForm";
import { School } from "../../../../types/school";
import { useSchool } from "../../../../context/SchoolContext";
import { useGroups } from "../../../../context/GroupContext";
import { School as SchoolIcon, Search, X } from "lucide-react";
import { FaPlus, FaTimes, FaPencilAlt, FaCheck } from "react-icons/fa";
import { Trash2 } from "lucide-react";
import { AppConfirmModal } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Student } from "../../../../types/user";

export const SchoolManagement = () => {
  const { school, loading, updateSchool, createSchool, deleteSchool, students } = useSchool();
  const {
    groups,
    loading: groupsLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupStudentIds,
    addMemberToGroup,
    removeMemberFromGroup,
  } = useGroups();
  const [editing, setEditing] = useState(false);

  // ── Groups UI state ──────────────────────────────────────────────────────────
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [addGroupError, setAddGroupError] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; group: { id: string; name: string } | null }>({
    open: false, group: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Member management state ──────────────────────────────────────────────────
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<string, string[]>>({});
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const handleAddGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setAddGroupError(null);
    try {
      await createGroup(name);
      setNewGroupName("");
      setAddingGroup(false);
    } catch {
      setAddGroupError("A group with that name may already exist.");
    }
  };

  const startEdit = async (group: { id: string; name: string }) => {
    setRenameValue(group.name);
    setExpandedGroupId(group.id);
    setMemberSearch("");
    setShowMemberDropdown(false);
    if (groupMembers[group.id] === undefined) {
      setMemberLoading(true);
      try {
        const ids = await getGroupStudentIds(group.id);
        setGroupMembers((prev) => ({ ...prev, [group.id]: ids }));
      } finally {
        setMemberLoading(false);
      }
    }
  };

  const cancelEdit = () => {
    setExpandedGroupId(null);
    setMemberSearch("");
    setShowMemberDropdown(false);
  };

  const handleRename = async (groupId: string) => {
    const name = renameValue.trim();
    if (!name) return;
    try {
      await updateGroup(groupId, name);
      // keep expanded panel open after rename
    } catch {
      // silently keep editing on error
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.group) return;
    setDeleteLoading(true);
    try {
      await deleteGroup(deleteConfirm.group.id);
      if (expandedGroupId === deleteConfirm.group.id) cancelEdit();
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm({ open: false, group: null });
    }
  };

  const handleAddMember = async (student: Student) => {
    if (!expandedGroupId) return;
    const gid = expandedGroupId;
    setGroupMembers((prev) => ({ ...prev, [gid]: [...(prev[gid] ?? []), student.id!] }));
    setMemberSearch("");
    setShowMemberDropdown(false);
    try {
      await addMemberToGroup(student.id!, gid);
    } catch {
      // revert optimistic update
      setGroupMembers((prev) => ({ ...prev, [gid]: (prev[gid] ?? []).filter((id) => id !== student.id) }));
    }
  };

  const handleRemoveMember = async (studentId: string) => {
    if (!expandedGroupId) return;
    const gid = expandedGroupId;
    setGroupMembers((prev) => ({ ...prev, [gid]: (prev[gid] ?? []).filter((id) => id !== studentId) }));
    try {
      await removeMemberFromGroup(studentId, gid);
    } catch {
      // revert optimistic update
      setGroupMembers((prev) => ({ ...prev, [gid]: [...(prev[gid] ?? []), studentId] }));
    }
  };

  const currentMembers = expandedGroupId ? (groupMembers[expandedGroupId] ?? []) : [];
  const filteredStudents = students.filter(
    (s) =>
      !currentMembers.includes(s.id!) &&
      (!memberSearch.trim() || s.name.toLowerCase().includes(memberSearch.toLowerCase())),
  );

  // ── School CRUD ─────────────────────────────────────────────────────────────
  const handleSchoolDelete = async () => {
    if (!school) return;
    await deleteSchool(school.id);
  };

  const handleUpdateOrCreate = async (formData: Omit<School, "id" | "created_at">) => {
    if (school?.id) {
      await updateSchool(school.id, formData);
    } else {
      await createSchool(formData);
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!school && !editing) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <SchoolIcon size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No school set up yet</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-6">
          Create your school profile to get started. You'll be able to add students and manage
          everything from here.
        </p>
        <button
          onClick={() => setEditing(true)}
          className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Create School Profile
        </button>
      </div>
    );
  }

  if (editing) {
    return <SchoolForm existingSchool={school} onSubmit={handleUpdateOrCreate} />;
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* ── School info card ──────────────────────────────────────────────────── */}
      <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-300 overflow-hidden">
        <div className="bg-red-700 h-24 w-full" />
        <div className="px-8 pb-8 -mt-8">
          <div className="flex items-end justify-between mb-6">
            <div className="h-16 w-16 rounded-xl bg-white shadow border border-gray-200 flex items-center justify-center">
              <SchoolIcon size={28} className="text-red-700" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleSchoolDelete}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{school!.name}</h2>
          <div className="mt-6 border-t border-gray-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Address</p>
              <p className="text-sm text-gray-800">{school!.address || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Student Groups card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Student Groups</h3>
          {!addingGroup && (
            <button
              onClick={() => { setAddingGroup(true); setAddGroupError(null); setNewGroupName(""); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors"
            >
              <FaPlus size={11} /> New Group
            </button>
          )}
        </div>

        {/* Add group inline form */}
        {addingGroup && (
          <div className="flex gap-2 mb-4">
            <Input
              autoFocus
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddGroup(); if (e.key === "Escape") setAddingGroup(false); }}
            />
            <button
              onClick={handleAddGroup}
              disabled={!newGroupName.trim()}
              className="px-3 py-2 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setAddingGroup(false)}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}
        {addGroupError && <p className="text-sm text-red-600 mb-3">{addGroupError}</p>}

        {/* Group list */}
        {groupsLoading ? (
          <div className="flex items-center justify-center h-12">
            <div className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No groups yet. Add one above.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {groups.map((group) => (
              <div key={group.id}>
                {/* ── Collapsed row ── */}
                {expandedGroupId !== group.id && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                    <span className="text-sm font-medium text-gray-800">{group.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(group)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit group"
                      >
                        <FaPencilAlt size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, group })}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete group"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Expanded edit panel ── */}
                {expandedGroupId === group.id && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 flex flex-col gap-4">
                    {/* Rename row */}
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(group.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-8 text-sm font-medium"
                      />
                      <button
                        onClick={() => handleRename(group.id)}
                        disabled={!renameValue.trim()}
                        className="text-green-600 hover:text-green-700 disabled:opacity-40 p-1"
                        title="Save name"
                      >
                        <FaCheck size={13} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Close"
                      >
                        <FaTimes size={13} />
                      </button>
                    </div>

                    {/* Members section */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                        Members
                      </p>
                      {memberLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                          Loading…
                        </div>
                      ) : currentMembers.length === 0 ? (
                        <p className="text-sm text-gray-400">No members yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {currentMembers.map((sid) => {
                            const s = students.find((st) => st.id === sid);
                            return (
                              <span
                                key={sid}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                              >
                                {s?.name ?? sid}
                                <button
                                  onClick={() => handleRemoveMember(sid)}
                                  className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Remove from group"
                                >
                                  <X size={11} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Add student search */}
                    <div className="relative">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                        Add Student
                      </p>
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search students…"
                          value={memberSearch}
                          onChange={(e) => { setMemberSearch(e.target.value); setShowMemberDropdown(true); }}
                          onFocus={() => setShowMemberDropdown(true)}
                          onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      {showMemberDropdown && filteredStudents.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {filteredStudents.map((s) => (
                            <button
                              key={s.id}
                              onMouseDown={() => handleAddMember(s)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {showMemberDropdown && memberSearch.trim() && filteredStudents.length === 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-400">
                          No students found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AppConfirmModal
        open={deleteConfirm.open}
        onOpenChange={(open) => !deleteLoading && setDeleteConfirm((s) => ({ ...s, open }))}
        title="Delete Group?"
        description={`Delete "${deleteConfirm.group?.name}"? Students in this group will be unassigned.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
        variant="destructive"
        confirmLabel="Delete Group"
      />
    </div>
  );
};
