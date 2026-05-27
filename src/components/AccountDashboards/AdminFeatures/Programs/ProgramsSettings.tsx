import React, { useEffect, useState } from "react";
import { usePrograms } from "../../../../context/ProgramContext";
import { SchoolProgram, ProgramType } from "../../../../types/programs";
import { AppConfirmModal } from "../../../ui/modal";
import { Button } from "../../../ui/button";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";
import { PROGRAM_TYPE_LABELS, ProgramTypeSelector } from "./ProgramTypeSelector";
import { Input } from "../../../ui/input";

type ProgramForm = { name: string; program_type: ProgramType; description: string };
const emptyForm = (): ProgramForm => ({ name: "", program_type: "time_based", description: "" });
const formFromProgram = (p: SchoolProgram): ProgramForm => ({
  name: p.name, program_type: p.program_type, description: p.description ?? "",
});

export const ProgramsSettings: React.FC = () => {
  const { programs, loading, error, deleteProgram, createProgram, updateProgram } = usePrograms();

  // ── Add panel ──────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<ProgramForm>(emptyForm());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── Edit (inline in row) ───────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProgramForm>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<SchoolProgram | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openAdd = () => { setAddForm(emptyForm()); setAddError(null); setAddOpen(true); setEditingId(null); };
  const closeAdd = () => { setAddOpen(false); setAddError(null); };

  const openEdit = (p: SchoolProgram) => {
    setEditingId(p.program_id);
    setEditForm(formFromProgram(p));
    setEditError(null);
    setAddOpen(false);
  };
  const closeEdit = () => { setEditingId(null); setEditError(null); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addForm.name.trim()) return setAddError("Program name is required.");
    setAddLoading(true);
    try {
      await createProgram({
        name: addForm.name.trim(),
        program_type: addForm.program_type,
        description: addForm.description.trim() || undefined,
      });
      closeAdd();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create program.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    if (!editForm.name.trim()) return setEditError("Program name is required.");
    setEditLoading(true);
    try {
      await updateProgram(editingId, {
        name: editForm.name.trim(),
        program_type: editForm.program_type,
        description: editForm.description.trim() || undefined,
      });
      closeEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update program.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteProgram(deleteTarget.program_id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete program.");
      setDeleteLoading(false);
    }
  };

  // close edit if program disappears
  useEffect(() => {
    if (editingId && !programs.find((p) => p.program_id === editingId)) closeEdit();
  }, [programs, editingId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Membership Programs</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Define the programs your school offers. These appear when creating renewals.
          </p>
        </div>
        {!addOpen && (
          <Button size="sm" onClick={openAdd} className="flex items-center gap-1.5">
            <Plus size={14} /> Add Program
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {deleteError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{deleteError}</p>}

      {/* ── Inline add form ── */}
      {addOpen && (
        <div className="bg-white border border-blue-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-800">New Program</span>
            <button onClick={closeAdd} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Program Name <span className="text-red-500">*</span></label>
              <Input placeholder="e.g., Black Belt Club" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Program Type <span className="text-red-500">*</span></label>
              <ProgramTypeSelector value={addForm.program_type} onChange={(type) => setAddForm((f) => ({ ...f, program_type: type }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <Input placeholder="e.g., Continues until student earns black belt" value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={closeAdd}>Cancel</Button>
              <Button type="submit" size="sm" disabled={addLoading}>
                {addLoading ? "Creating…" : "Create Program"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Program list */}
      {loading && programs.length === 0 ? (
        <div className="h-20 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : programs.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">No programs yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {programs.map((program) => {
            const typeInfo = PROGRAM_TYPE_LABELS[program.program_type];
            const isDefault = program.name === "Regular";
            const isEditing = editingId === program.program_id;

            return (
              <div key={program.program_id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                {isEditing ? (
                  /* Inline edit form */
                  <div className="px-4 py-3">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Editing</span>
                      <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                    </div>
                    <form onSubmit={handleEdit} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Program Name <span className="text-red-500">*</span></label>
                        <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Program Type</label>
                        <ProgramTypeSelector value={editForm.program_type} onChange={(type) => setEditForm((f) => ({ ...f, program_type: type }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                        <Input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
                      </div>
                      {editError && <p className="text-sm text-red-600">{editError}</p>}
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={closeEdit}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={editLoading}>
                          {editLoading ? "Saving…" : <><Check size={13} className="mr-1" />Save Changes</>}
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  /* Normal row */
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{program.name}</span>
                        {isDefault && (
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Default</span>
                        )}
                        <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          program.program_type === "milestone_based" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {typeInfo.icon}{typeInfo.label}
                        </span>
                      </div>
                      {program.description && (
                        <p className="text-xs text-gray-500 truncate">{program.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button onClick={() => openEdit(program)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors" title="Edit">
                        <Pencil size={13} />
                      </button>
                      {!isDefault && (
                        <button
                          onClick={() => { setDeleteError(null); setDeleteTarget(program); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AppConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !deleteLoading) setDeleteTarget(null); }}
        title="Delete Program?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone. Any renewals using this program will need to be reassigned.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
        confirmLabel="Delete Program"
      />
    </div>
  );
};
