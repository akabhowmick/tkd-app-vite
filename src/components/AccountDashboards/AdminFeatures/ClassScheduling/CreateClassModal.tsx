import { useState } from "react";
import { useClasses } from "../../../../context/ClassContext";
import { AgeGroup, SessionType } from "../../../../types/classes";
import { AppFormModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

type ClassForm = {
  class_name: string;
  age_group: AgeGroup;
  session_type: SessionType;
  day_of_week: string;
  specific_date: string;
  start_time: string;
  end_time: string;
};

const emptyForm = (): ClassForm => ({
  class_name: "",
  age_group: "Kids",
  session_type: "recurring",
  day_of_week: "1",
  specific_date: "",
  start_time: "",
  end_time: "",
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateClassModal = ({ open, onOpenChange }: Props) => {
  const { createClass, createSession } = useClasses();
  const [form, setForm] = useState<ClassForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ClassForm>(k: K, v: ClassForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleOpenChange = (open: boolean) => {
    if (!open) { setForm(emptyForm()); setError(null); }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.class_name.trim()) return setError("Class name is required.");
    if (!form.start_time) return setError("Start time is required.");
    if (!form.end_time) return setError("End time is required.");
    if (form.session_type === "one-off" && !form.specific_date) return setError("Date is required.");
    setLoading(true);
    try {
      const newClass = await createClass({
        class_name: form.class_name.trim(),
        age_group: form.age_group,
      });
      await createSession({
        class_id: newClass.class_id,
        session_type: form.session_type,
        ...(form.session_type === "recurring"
          ? { day_of_week: parseInt(form.day_of_week) }
          : { specific_date: form.specific_date }),
        start_time: form.start_time,
        end_time: form.end_time,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFormModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Create New Class"
      size="compact"
      onSubmit={handleSubmit}
      submitLabel="Create Class"
      loading={loading}
      error={error}
    >
      <ModalField label="Class Name" required htmlFor="class-name">
        <Input
          id="class-name"
          placeholder="e.g., Kids Beginners"
          value={form.class_name}
          onChange={(e) => set("class_name", e.target.value)}
        />
      </ModalField>

      <ModalField label="Age Group" required htmlFor="age-group">
        <Select value={form.age_group} onValueChange={(v) => set("age_group", v as AgeGroup)}>
          <SelectTrigger id="age-group">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Kids">Kids</SelectItem>
            <SelectItem value="Adults">Adults</SelectItem>
            <SelectItem value="All">All</SelectItem>
          </SelectContent>
        </Select>
      </ModalField>

      <ModalField label="Schedule Type" required htmlFor="session-type">
        <Select
          value={form.session_type}
          onValueChange={(v) => set("session_type", v as SessionType)}
        >
          <SelectTrigger id="session-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recurring">Recurring (Weekly)</SelectItem>
            <SelectItem value="one-off">One-off Session</SelectItem>
          </SelectContent>
        </Select>
      </ModalField>

      {form.session_type === "recurring" ? (
        <ModalField label="Day of Week" required htmlFor="day-of-week">
          <Select value={form.day_of_week} onValueChange={(v) => set("day_of_week", v)}>
            <SelectTrigger id="day-of-week">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((day, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ModalField>
      ) : (
        <ModalField label="Date" required htmlFor="specific-date">
          <Input
            id="specific-date"
            type="date"
            value={form.specific_date}
            onChange={(e) => set("specific_date", e.target.value)}
          />
        </ModalField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <ModalField label="Start Time" required htmlFor="start-time">
          <Input
            id="start-time"
            type="time"
            value={form.start_time}
            onChange={(e) => set("start_time", e.target.value)}
          />
        </ModalField>
        <ModalField label="End Time" required htmlFor="end-time">
          <Input
            id="end-time"
            type="time"
            value={form.end_time}
            onChange={(e) => set("end_time", e.target.value)}
          />
        </ModalField>
      </div>
    </AppFormModal>
  );
};
