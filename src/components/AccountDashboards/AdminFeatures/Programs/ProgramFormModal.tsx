import { useState, useEffect } from "react";
import { usePrograms } from "../../../../context/ProgramContext";
import { SchoolProgram, ProgramType } from "../../../../types/programs";
import { AppFormModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { ProgramTypeSelector } from "./ProgramTypeSelector";

type ProgramForm = { name: string; program_type: ProgramType; description: string };
const emptyForm = (): ProgramForm => ({ name: "", program_type: "time_based", description: "" });

// null = closed, "new" = create mode, SchoolProgram = edit mode
export type ProgramFormTarget = SchoolProgram | "new" | null;

type Props = {
  target: ProgramFormTarget;
  onClose: () => void;
};

export const ProgramFormModal = ({ target, onClose }: Props) => {
  const { createProgram, updateProgram } = usePrograms();
  const [form, setForm] = useState<ProgramForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = target !== null && target !== "new";

  useEffect(() => {
    if (!target) return;
    if (target === "new") {
      setForm(emptyForm());
    } else {
      setForm({
        name: target.name,
        program_type: target.program_type,
        description: target.description ?? "",
      });
    }
    setError(null);
  }, [target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Program name is required.");
    setLoading(true);
    try {
      if (isEdit) {
        await updateProgram((target as SchoolProgram).program_id, {
          name: form.name.trim(),
          program_type: form.program_type,
          description: form.description.trim() || undefined,
        });
      } else {
        await createProgram({
          name: form.name.trim(),
          program_type: form.program_type,
          description: form.description.trim() || undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} program.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFormModal
      open={!!target}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={isEdit ? "Edit Program" : "Add Program"}
      size="compact"
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Save Changes" : "Create Program"}
      loading={loading}
      error={error}
    >
      <ModalField label="Program Name" required htmlFor="prog-name">
        <Input
          id="prog-name"
          placeholder="e.g., Black Belt Club"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </ModalField>
      <ModalField label="Program Type" required htmlFor="prog-type">
        <ProgramTypeSelector
          value={form.program_type}
          onChange={(type) => setForm((f) => ({ ...f, program_type: type }))}
        />
      </ModalField>
      <ModalField label="Description" htmlFor="prog-desc" helper="Optional">
        <Input
          id="prog-desc"
          placeholder="e.g., Continues until student earns black belt"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </ModalField>
    </AppFormModal>
  );
};
