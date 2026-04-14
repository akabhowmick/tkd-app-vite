import React, { useState } from "react";
import { usePrograms } from "../../../../context/ProgramContext";
import { SchoolProgram, ProgramType } from "../../../../types/programs";
import { AppFormModal, AppConfirmModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { Pencil, Trash2, Plus, Trophy, Clock } from "lucide-react";

const PROGRAM_TYPE_LABELS: Record<
  ProgramType,
  { label: string; description: string; icon: React.ReactNode }
> = {
  time_based: {
    label: "Time-based",
    description: "Renewal expires after a set duration (e.g. 3 months)",
    icon: <Clock size={14} />,
  },
  milestone_based: {
    label: "Milestone-based",
    description: "Renewal continues until a goal is reached (e.g. Black Belt)",
    icon: <Trophy size={14} />,
  },
};

interface ProgramTypeSelectorProps {
  value: ProgramType;
  onChange: (type: ProgramType) => void;
}

const ProgramTypeSelector: React.FC<ProgramTypeSelectorProps> = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    {(["time_based", "milestone_based"] as ProgramType[]).map((type) => {
      const info = PROGRAM_TYPE_LABELS[type];
      const isSelected = value === type;
      return (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={`flex flex-col gap-1.5 p-3 rounded-lg border-2 text-left transition-colors ${
            isSelected
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-sm font-semibold ${isSelected ? "text-primary" : "text-gray-700"}`}
          >
            {info.icon}
            {info.label}
          </div>
          <p className="text-xs text-gray-500 leading-snug">{info.description}</p>
        </button>
      );
    })}
  </div>
);

type ProgramForm = { name: string; program_type: ProgramType; description: string };
const emptyForm = (): ProgramForm => ({ name: "", program_type: "time_based", description: "" });

export const ProgramsSettings: React.FC = () => {
  const { programs, loading, error, createProgram, updateProgram, deleteProgram } = usePrograms();

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ProgramForm>(emptyForm());
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal
  const [editTarget, setEditTarget] = useState<SchoolProgram | null>(null);
  const [editForm, setEditForm] = useState<ProgramForm>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<SchoolProgram | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.name.trim()) {
      setCreateError("Program name is required.");
      return;
    }
    setCreateLoading(true);
    try {
      await createProgram({
        name: createForm.name.trim(),
        program_type: createForm.program_type,
        description: createForm.description.trim() || undefined,
      });
      setCreateOpen(false);
      setCreateForm(emptyForm());
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create program.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (program: SchoolProgram) => {
    setEditTarget(program);
    setEditForm({
      name: program.name,
      program_type: program.program_type,
      description: program.description ?? "",
    });
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);
    if (!editForm.name.trim()) {
      setEditError("Program name is required.");
      return;
    }
    setEditLoading(true);
    try {
      await updateProgram(editTarget.program_id, {
        name: editForm.name.trim(),
        program_type: editForm.program_type,
        description: editForm.description.trim() || undefined,
      });
      setEditTarget(null);
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
        <Button
          size="sm"
          onClick={() => {
            setCreateForm(emptyForm());
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus size={14} /> Add Program
        </Button>
      </div>

      {/* Global error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Delete error (shown inline since delete has no modal body) */}
      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {deleteError}
        </p>
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
            return (
              <div
                key={program.program_id}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-white"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{program.name}</span>
                    {isDefault && (
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                    <span
                      className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        program.program_type === "milestone_based"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {typeInfo.icon}
                      {typeInfo.label}
                    </span>
                  </div>
                  {program.description && (
                    <p className="text-xs text-gray-500 truncate">{program.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    onClick={() => openEdit(program)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  {!isDefault && (
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(program);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal */}
      <AppFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add Program"
        size="compact"
        onSubmit={handleCreate}
        submitLabel="Create Program"
        loading={createLoading}
        error={createError}
      >
        <ModalField label="Program Name" required htmlFor="prog-name">
          <Input
            id="prog-name"
            placeholder="e.g., Black Belt Club"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Program Type" required htmlFor="prog-type">
          <ProgramTypeSelector
            value={createForm.program_type}
            onChange={(type) => setCreateForm((f) => ({ ...f, program_type: type }))}
          />
        </ModalField>
        <ModalField label="Description" htmlFor="prog-desc" helper="Optional">
          <Input
            id="prog-desc"
            placeholder="e.g., Continues until student earns black belt"
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Edit Modal */}
      <AppFormModal
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        title="Edit Program"
        size="compact"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        loading={editLoading}
        error={editError}
      >
        <ModalField label="Program Name" required htmlFor="edit-prog-name">
          <Input
            id="edit-prog-name"
            placeholder="e.g., Black Belt Club"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Program Type" required htmlFor="edit-prog-type">
          <ProgramTypeSelector
            value={editForm.program_type}
            onChange={(type) => setEditForm((f) => ({ ...f, program_type: type }))}
          />
        </ModalField>
        <ModalField label="Description" htmlFor="edit-prog-desc" helper="Optional">
          <Input
            id="edit-prog-desc"
            placeholder="e.g., Continues until student earns black belt"
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Delete Confirm */}
      <AppConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleteLoading) setDeleteTarget(null);
        }}
        title="Delete Program?"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone. Any renewals using this program will need to be reassigned.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
        confirmLabel="Delete Program"
      />
    </div>
  );
};
