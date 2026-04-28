import { useState } from "react";
import { useBelts } from "../../../../context/BeltContext";
import { useSchool } from "../../../../context/SchoolContext";
import { PromotionType } from "../../../../types/belts";
import { AppFormModal, ModalField, InfoBox } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

type PromoForm = {
  student_id: string;
  to_rank_id: string;
  promotion_date: string;
  promotion_type: PromotionType;
  test_score: string;
  promoted_by: string;
  notes: string;
};

const emptyForm = (): PromoForm => ({
  student_id: "",
  to_rank_id: "",
  promotion_date: new Date().toISOString().split("T")[0],
  promotion_type: "manual",
  test_score: "",
  promoted_by: "",
  notes: "",
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PromoteStudentModal = ({ open, onOpenChange }: Props) => {
  const { ranks, promoteStudent } = useBelts();
  const { students } = useSchool();
  const [form, setForm] = useState<PromoForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const selectedStudent = students.find((s) => s.id === form.student_id);
  const currentRank = selectedStudent
    ? ranks.find((r) => r.rank_id === selectedStudent.current_rank_id)
    : null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm(emptyForm());
      setError(null);
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.student_id) return setError("Please select a student.");
    if (!form.to_rank_id) return setError("Please select a target rank.");
    if (!form.promoted_by.trim()) return setError("Promoted By is required.");
    setLoading(true);
    try {
      await promoteStudent({
        student_id: form.student_id,
        from_rank_id: currentRank?.rank_id,
        to_rank_id: form.to_rank_id,
        promotion_date: form.promotion_date,
        promotion_type: form.promotion_type,
        test_score: form.test_score ? parseFloat(form.test_score) : undefined,
        promoted_by: form.promoted_by.trim(),
        notes: form.notes.trim() || undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFormModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Promote Student"
      size="default"
      onSubmit={handleSubmit}
      submitLabel="Promote"
      loading={loading}
      error={error}
    >
      <ModalField label="Student" required htmlFor="promo-student">
        <Select value={form.student_id} onValueChange={(v) => set("student_id", v)}>
          <SelectTrigger id="promo-student">
            <SelectValue placeholder="Choose a student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={String(s.id)} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ModalField>

      {selectedStudent && (
        <InfoBox title="Current Rank" subtitle={currentRank?.rank_name ?? "None"} />
      )}

      <ModalField label="Promote To" required htmlFor="promo-to-rank">
        <Select value={form.to_rank_id} onValueChange={(v) => set("to_rank_id", v)}>
          <SelectTrigger id="promo-to-rank">
            <SelectValue placeholder="Select rank" />
          </SelectTrigger>
          <SelectContent>
            {ranks.map((r) => (
              <SelectItem key={r.rank_id} value={r.rank_id}>
                {r.rank_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ModalField>

      <div className="grid grid-cols-2 gap-4">
        <ModalField label="Promotion Date" required htmlFor="promo-date">
          <Input
            id="promo-date"
            type="date"
            value={form.promotion_date}
            onChange={(e) => set("promotion_date", e.target.value)}
          />
        </ModalField>
        <ModalField label="Promotion Type" required htmlFor="promo-type">
          <Select
            value={form.promotion_type}
            onValueChange={(v) => set("promotion_type", v as PromotionType)}
          >
            <SelectTrigger id="promo-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="test">Test-based</SelectItem>
            </SelectContent>
          </Select>
        </ModalField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ModalField label="Test Score" htmlFor="promo-score" helper="Optional">
          <Input
            id="promo-score"
            type="number"
            step="0.01"
            placeholder="95.5"
            value={form.test_score}
            onChange={(e) => set("test_score", e.target.value)}
          />
        </ModalField>
        <ModalField label="Promoted By" required htmlFor="promo-by">
          <Input
            id="promo-by"
            placeholder="Master Lee"
            value={form.promoted_by}
            onChange={(e) => set("promoted_by", e.target.value)}
          />
        </ModalField>
      </div>

      <ModalField label="Notes" htmlFor="promo-notes" helper="Optional">
        <Textarea
          id="promo-notes"
          placeholder="Additional notes..."
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </ModalField>
    </AppFormModal>
  );
};
