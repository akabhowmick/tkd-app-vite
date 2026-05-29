import { useEffect, useState } from "react";
import { SchoolForm } from "./SchoolForm";
import { School } from "../../../../types/school";
import { StudentGroup } from "../../../../types/groups";
import { useSchool } from "../../../../context/SchoolContext";
import { School as SchoolIcon } from "lucide-react";
import { FaPlus, FaTimes, FaPencilAlt, FaCheck } from "react-icons/fa";
import { Trash2 } from "lucide-react";
import {
  getSchoolGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../../../../api/GroupRequests/groupRequests";
import { AppConfirmModal } from "../../../ui/modal";
import { Input } from "../../../ui/input";

export const SchoolManagement = () => {
  const { school, loading, updateSchool, createSchool, deleteSchool } = useSchool();
  const [editing, setEditing] = useState(false);

  // ── Groups state ────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [addGroupError, setAddGroupError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; group: StudentGroup | null }>({
    open: false, group: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadGroups = async () => {
    if (!school?.id) return;
    setGroupsLoading(true);
    try {
      setGroups(await getSchoolGroups(school.id));
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    if (school?.id) loadGroups();
  }, [school?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setAddGroupError(null);
    try {
      const created = await createGroup(school!.id, name);
      setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewGroupName("");
      setAddingGroup(false);
    } catch {
      setAddGroupError("A group with that name may already exist.");
    }
  };

  const startRename = (group: StudentGroup) => {
    setRenamingId(group.id);
    setRenameValue(group.name);
  };

  const handleRename = async (groupId: string) => {
    const name = renameValue.trim();
    if (!name) return;
    try {
      const updated = await updateGroup(groupId, name);
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? updated : g)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setRenamingId(null);
    } catch {
      // silently keep editing on error
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.group) return;
    setDeleteLoading(true);
    try {
      await deleteGroup(deleteConfirm.group.id);
      setGroups((prev) => prev.filter((g) => g.id !== deleteConfirm.group!.id));
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm({ open: false, group: null });
    }
  };

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
              <div
                key={group.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors"
              >
                {renamingId === group.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(group.id); if (e.key === "Escape") setRenamingId(null); }}
                      className="h-8 text-sm"
                    />
                    <button
                      onClick={() => handleRename(group.id)}
                      disabled={!renameValue.trim()}
                      className="text-green-600 hover:text-green-700 disabled:opacity-40"
                    >
                      <FaCheck size={13} />
                    </button>
                    <button onClick={() => setRenamingId(null)} className="text-gray-400 hover:text-gray-600">
                      <FaTimes size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-800">{group.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startRename(group)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <FaPencilAlt size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, group })}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
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
