import React, { useState } from "react";
import { usePrograms } from "../../../../context/ProgramContext";
import { SchoolProgram } from "../../../../types/programs";
import { AppConfirmModal } from "../../../ui/modal";
import { Button } from "../../../ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import { PROGRAM_TYPE_LABELS } from "./ProgramTypeSelector";
import { ProgramFormModal, ProgramFormTarget } from "./ProgramFormModal";

export const ProgramsSettings: React.FC = () => {
  const { programs, loading, error, deleteProgram } = usePrograms();
  const [formTarget, setFormTarget] = useState<ProgramFormTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<SchoolProgram | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Membership Programs</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Define the programs your school offers. These appear when creating renewals.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setFormTarget("new")}
          className="flex items-center gap-1.5"
        >
          <Plus size={14} /> Add Program
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {deleteError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {deleteError}
        </p>
      )}

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
                    onClick={() => setFormTarget(program)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
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
            );
          })}
        </div>
      )}

      <ProgramFormModal target={formTarget} onClose={() => setFormTarget(null)} />

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
