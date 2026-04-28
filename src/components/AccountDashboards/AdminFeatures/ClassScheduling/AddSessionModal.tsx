import { useState } from "react";
import { useClasses } from "../../../../context/ClassContext";
import { SessionType } from "../../../../types/classes";
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

type Step = "type" | "recurring" | "one-off";
type RecurringForm = { day_of_week: string; start_time: string; end_time: string };
type OneOffForm = { specific_date: string; start_time: string; end_time: string };

const emptyRecurring = (): RecurringForm => ({ day_of_week: "1", start_time: "", end_time: "" });
const emptyOneOff = (): OneOffForm => ({ specific_date: "", start_time: "", end_time: "" });

type Props = {
  classId: string;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddSessionModal = ({ classId, className, open, onOpenChange }: Props) => {
  const { createSession } = useClasses();
  const [step, setStep] = useState<Step>("type");
  const [sessionType, setSessionType] = useState<SessionType | "">("");
  const [recurringForm, setRecurringForm] = useState<RecurringForm>(emptyRecurring());
  const [oneOffForm, setOneOffForm] = useState<OneOffForm>(emptyOneOff());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep("type");
      setSessionType("");
      setRecurringForm(emptyRecurring());
      setOneOffForm(emptyOneOff());
      setError(null);
    }
    onOpenChange(open);
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionType) return;
    setStep(sessionType as Step);
  };

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!recurringForm.start_time) return setError("Start time is required.");
    if (!recurringForm.end_time) return setError("End time is required.");
    setLoading(true);
    try {
      await createSession({
        class_id: classId,
        session_type: "recurring",
        day_of_week: parseInt(recurringForm.day_of_week),
        start_time: recurringForm.start_time,
        end_time: recurringForm.end_time,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add session.");
    } finally {
      setLoading(false);
    }
  };

  const handleOneOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!oneOffForm.specific_date) return setError("Date is required.");
    if (!oneOffForm.start_time) return setError("Start time is required.");
    if (!oneOffForm.end_time) return setError("End time is required.");
    setLoading(true);
    try {
      await createSession({
        class_id: classId,
        session_type: "one-off",
        specific_date: oneOffForm.specific_date,
        start_time: oneOffForm.start_time,
        end_time: oneOffForm.end_time,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add session.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "type") {
    return (
      <AppFormModal
        open={open}
        onOpenChange={handleOpenChange}
        title={`Add Session — ${className}`}
        size="compact"
        onSubmit={handleTypeSubmit}
        submitLabel="Continue"
        submitDisabled={!sessionType}
      >
        <ModalField label="Session Type" required htmlFor="add-session-type">
          <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
            <SelectTrigger id="add-session-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring (Weekly)</SelectItem>
              <SelectItem value="one-off">One-off Session</SelectItem>
            </SelectContent>
          </Select>
        </ModalField>
      </AppFormModal>
    );
  }

  if (step === "recurring") {
    return (
      <AppFormModal
        open={open}
        onOpenChange={handleOpenChange}
        title="Recurring Session"
        size="compact"
        onSubmit={handleRecurringSubmit}
        submitLabel="Add Session"
        loading={loading}
        error={error}
      >
        <ModalField label="Day of Week" required htmlFor="day-of-week">
          <Select
            value={recurringForm.day_of_week}
            onValueChange={(v) => setRecurringForm((f) => ({ ...f, day_of_week: v }))}
          >
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
        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Start Time" required htmlFor="start-time">
            <Input
              id="start-time"
              type="time"
              value={recurringForm.start_time}
              onChange={(e) => setRecurringForm((f) => ({ ...f, start_time: e.target.value }))}
            />
          </ModalField>
          <ModalField label="End Time" required htmlFor="end-time">
            <Input
              id="end-time"
              type="time"
              value={recurringForm.end_time}
              onChange={(e) => setRecurringForm((f) => ({ ...f, end_time: e.target.value }))}
            />
          </ModalField>
        </div>
      </AppFormModal>
    );
  }

  return (
    <AppFormModal
      open={open}
      onOpenChange={handleOpenChange}
      title="One-off Session"
      size="compact"
      onSubmit={handleOneOffSubmit}
      submitLabel="Add Session"
      loading={loading}
      error={error}
    >
      <ModalField label="Date" required htmlFor="specific-date">
        <Input
          id="specific-date"
          type="date"
          value={oneOffForm.specific_date}
          onChange={(e) => setOneOffForm((f) => ({ ...f, specific_date: e.target.value }))}
        />
      </ModalField>
      <div className="grid grid-cols-2 gap-4">
        <ModalField label="Start Time" required htmlFor="one-off-start">
          <Input
            id="one-off-start"
            type="time"
            value={oneOffForm.start_time}
            onChange={(e) => setOneOffForm((f) => ({ ...f, start_time: e.target.value }))}
          />
        </ModalField>
        <ModalField label="End Time" required htmlFor="one-off-end">
          <Input
            id="one-off-end"
            type="time"
            value={oneOffForm.end_time}
            onChange={(e) => setOneOffForm((f) => ({ ...f, end_time: e.target.value }))}
          />
        </ModalField>
      </div>
    </AppFormModal>
  );
};
