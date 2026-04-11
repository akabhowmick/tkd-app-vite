import { useState } from "react";
import { useClasses } from "../context/ClassContext";
import { AgeGroup, SessionType } from "../types/classes";
import { FaPlus, FaTrash, FaClock, FaUsers } from "react-icons/fa";
import { AppFormModal, AppConfirmModal, ModalField } from "../components/ui/modal";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ClassForm = {
  class_name: string;
  age_group: AgeGroup;
  instructor: string;
  session_type: SessionType;
  day_of_week: string;
  specific_date: string;
  start_time: string;
  end_time: string;
};

type RecurringForm = { day_of_week: string; start_time: string; end_time: string };
type OneOffForm = { specific_date: string; start_time: string; end_time: string };

const emptyClassForm = (): ClassForm => ({
  class_name: "",
  age_group: "Kids",
  instructor: "",
  session_type: "recurring",
  day_of_week: "1",
  specific_date: "",
  start_time: "",
  end_time: "",
});
const emptyRecurring = (): RecurringForm => ({ day_of_week: "1", start_time: "", end_time: "" });
const emptyOneOff = (): OneOffForm => ({ specific_date: "", start_time: "", end_time: "" });

export const ClassSchedulingPage = () => {
  const { classes, loading, createClass, deleteClass, createSession, deleteSession } = useClasses();

  // ── Create class modal ─────────────────────────────────────────────────────
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState<ClassForm>(emptyClassForm());
  const [classLoading, setClassLoading] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);

  // ── Add session modals ─────────────────────────────────────────────────────
  const [sessionTypeModal, setSessionTypeModal] = useState<{
    open: boolean;
    classId: string;
    className: string;
  }>({ open: false, classId: "", className: "" });
  const [sessionType, setSessionType] = useState<SessionType | "">("");

  const [recurringModal, setRecurringModal] = useState(false);
  const [recurringForm, setRecurringForm] = useState<RecurringForm>(emptyRecurring());
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [recurringError, setRecurringError] = useState<string | null>(null);

  const [oneOffModal, setOneOffModal] = useState(false);
  const [oneOffForm, setOneOffForm] = useState<OneOffForm>(emptyOneOff());
  const [oneOffLoading, setOneOffLoading] = useState(false);
  const [oneOffError, setOneOffError] = useState<string | null>(null);

  // ── Delete confirms ────────────────────────────────────────────────────────
  const [deleteClassConfirm, setDeleteClassConfirm] = useState<{
    open: boolean;
    classId: string;
    className: string;
    loading: boolean;
  }>({ open: false, classId: "", className: "", loading: false });

  const [deleteSessionConfirm, setDeleteSessionConfirm] = useState<{
    open: boolean;
    sessionId: string;
    loading: boolean;
  }>({ open: false, sessionId: "", loading: false });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError(null);
    if (!classForm.class_name.trim()) {
      setClassError("Class name is required.");
      return;
    }
    if (!classForm.instructor.trim()) {
      setClassError("Instructor is required.");
      return;
    }
    if (!classForm.start_time) {
      setClassError("Start time is required.");
      return;
    }
    if (!classForm.end_time) {
      setClassError("End time is required.");
      return;
    }
    if (classForm.session_type === "one-off" && !classForm.specific_date) {
      setClassError("Date is required.");
      return;
    }

    setClassLoading(true);
    try {
      const newClass = await createClass({
        class_name: classForm.class_name.trim(),
        age_group: classForm.age_group,
        instructor: classForm.instructor.trim(),
      });

      await createSession({
        class_id: newClass.class_id,
        session_type: classForm.session_type,
        ...(classForm.session_type === "recurring"
          ? { day_of_week: parseInt(classForm.day_of_week) }
          : { specific_date: classForm.specific_date }),
        start_time: classForm.start_time,
        end_time: classForm.end_time,
      });

      setClassModalOpen(false);
      setClassForm(emptyClassForm());
    } catch (err) {
      setClassError(err instanceof Error ? err.message : "Failed to create class.");
    } finally {
      setClassLoading(false);
    }
  };

  const openSessionFlow = (classId: string, className: string) => {
    setSessionType("");
    setSessionTypeModal({ open: true, classId, className });
  };

  const handleSessionTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionType) return;
    setSessionTypeModal((s) => ({ ...s, open: false }));
    if (sessionType === "recurring") {
      setRecurringForm(emptyRecurring());
      setRecurringError(null);
      setRecurringModal(true);
    } else {
      setOneOffForm(emptyOneOff());
      setOneOffError(null);
      setOneOffModal(true);
    }
  };

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecurringError(null);
    if (!recurringForm.start_time) {
      setRecurringError("Start time is required.");
      return;
    }
    if (!recurringForm.end_time) {
      setRecurringError("End time is required.");
      return;
    }
    setRecurringLoading(true);
    try {
      await createSession({
        class_id: sessionTypeModal.classId,
        session_type: "recurring",
        day_of_week: parseInt(recurringForm.day_of_week),
        start_time: recurringForm.start_time,
        end_time: recurringForm.end_time,
      });
      setRecurringModal(false);
    } catch (err) {
      setRecurringError(err instanceof Error ? err.message : "Failed to add session.");
    } finally {
      setRecurringLoading(false);
    }
  };

  const handleAddOneOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setOneOffError(null);
    if (!oneOffForm.specific_date) {
      setOneOffError("Date is required.");
      return;
    }
    if (!oneOffForm.start_time) {
      setOneOffError("Start time is required.");
      return;
    }
    if (!oneOffForm.end_time) {
      setOneOffError("End time is required.");
      return;
    }
    setOneOffLoading(true);
    try {
      await createSession({
        class_id: sessionTypeModal.classId,
        session_type: "one-off",
        specific_date: oneOffForm.specific_date,
        start_time: oneOffForm.start_time,
        end_time: oneOffForm.end_time,
      });
      setOneOffModal(false);
    } catch (err) {
      setOneOffError(err instanceof Error ? err.message : "Failed to add session.");
    } finally {
      setOneOffLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    setDeleteClassConfirm((s) => ({ ...s, loading: true }));
    try {
      await deleteClass(deleteClassConfirm.classId);
    } finally {
      setDeleteClassConfirm({ open: false, classId: "", className: "", loading: false });
    }
  };

  const handleDeleteSession = async () => {
    setDeleteSessionConfirm((s) => ({ ...s, loading: true }));
    try {
      await deleteSession(deleteSessionConfirm.sessionId);
    } finally {
      setDeleteSessionConfirm({ open: false, sessionId: "", loading: false });
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Class Scheduling</h1>
          <button
            onClick={() => {
              setClassForm(emptyClassForm());
              setClassError(null);
              setClassModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus /> New Class
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FaUsers className="mx-auto text-gray-300 text-5xl mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Classes Yet</h2>
            <p className="text-gray-500 mb-4">
              Create your first class to get started with scheduling
            </p>
            <button
              onClick={() => {
                setClassForm(emptyClassForm());
                setClassModalOpen(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Class
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <div key={cls.class_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-2" style={{ backgroundColor: cls.color }} />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{cls.class_name}</h3>
                      <p className="text-sm text-gray-500">{cls.instructor}</p>
                    </div>
                    <button
                      onClick={() =>
                        setDeleteClassConfirm({
                          open: true,
                          classId: cls.class_id,
                          className: cls.class_name,
                          loading: false,
                        })
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className="mb-3">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {cls.age_group}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <FaClock className="text-gray-400" /> Sessions ({cls.sessions.length})
                    </h4>
                    {cls.sessions.length === 0 ? (
                      <p className="text-xs text-gray-400">No sessions scheduled</p>
                    ) : (
                      <div className="space-y-1">
                        {cls.sessions.map((session) => (
                          <div
                            key={session.session_id}
                            className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs"
                          >
                            <span>
                              {session.session_type === "recurring"
                                ? `${DAYS_OF_WEEK[session.day_of_week!]} ${session.start_time}-${session.end_time}`
                                : `${session.specific_date} ${session.start_time}-${session.end_time}`}
                            </span>
                            <button
                              onClick={() =>
                                setDeleteSessionConfirm({
                                  open: true,
                                  sessionId: session.session_id,
                                  loading: false,
                                })
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openSessionFlow(cls.class_id, cls.class_name)}
                    className="w-full bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    + Add Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Class Modal ── */}
      <AppFormModal
        open={classModalOpen}
        onOpenChange={setClassModalOpen}
        title="Create New Class"
        size="compact"
        onSubmit={handleCreateClass}
        submitLabel="Create Class"
        loading={classLoading}
        error={classError}
      >
        <ModalField label="Class Name" required htmlFor="class-name">
          <Input
            id="class-name"
            placeholder="e.g., Kids Beginners"
            value={classForm.class_name}
            onChange={(e) => setClassForm((f) => ({ ...f, class_name: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Age Group" required htmlFor="age-group">
          <Select
            value={classForm.age_group}
            onValueChange={(v) => setClassForm((f) => ({ ...f, age_group: v as AgeGroup }))}
          >
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
        <ModalField label="Instructor" required htmlFor="instructor">
          <Input
            id="instructor"
            placeholder="e.g., Master Lee"
            value={classForm.instructor}
            onChange={(e) => setClassForm((f) => ({ ...f, instructor: e.target.value }))}
          />
        </ModalField>

        {/* Session fields */}
        <ModalField label="Schedule Type" required htmlFor="session-type">
          <Select
            value={classForm.session_type}
            onValueChange={(v) => setClassForm((f) => ({ ...f, session_type: v as SessionType }))}
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

        {classForm.session_type === "recurring" ? (
          <ModalField label="Day of Week" required htmlFor="day-of-week">
            <Select
              value={classForm.day_of_week}
              onValueChange={(v) => setClassForm((f) => ({ ...f, day_of_week: v }))}
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
        ) : (
          <ModalField label="Date" required htmlFor="specific-date">
            <Input
              id="specific-date"
              type="date"
              value={classForm.specific_date}
              onChange={(e) => setClassForm((f) => ({ ...f, specific_date: e.target.value }))}
            />
          </ModalField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Start Time" required htmlFor="start-time">
            <Input
              id="start-time"
              type="time"
              value={classForm.start_time}
              onChange={(e) => setClassForm((f) => ({ ...f, start_time: e.target.value }))}
            />
          </ModalField>
          <ModalField label="End Time" required htmlFor="end-time">
            <Input
              id="end-time"
              type="time"
              value={classForm.end_time}
              onChange={(e) => setClassForm((f) => ({ ...f, end_time: e.target.value }))}
            />
          </ModalField>
        </div>
      </AppFormModal>

      {/* ── Session Type Modal ── */}
      <AppFormModal
        open={sessionTypeModal.open}
        onOpenChange={(open) => setSessionTypeModal((s) => ({ ...s, open }))}
        title={`Add Session — ${sessionTypeModal.className}`}
        size="compact"
        onSubmit={handleSessionTypeSubmit}
        submitLabel="Continue"
      >
        <ModalField label="Session Type" required htmlFor="session-type">
          <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
            <SelectTrigger id="session-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring (Weekly)</SelectItem>
              <SelectItem value="one-off">One-off Session</SelectItem>
            </SelectContent>
          </Select>
        </ModalField>
      </AppFormModal>

      {/* ── Recurring Session Modal ── */}
      <AppFormModal
        open={recurringModal}
        onOpenChange={setRecurringModal}
        title="Recurring Session"
        size="compact"
        onSubmit={handleAddRecurring}
        submitLabel="Add Session"
        loading={recurringLoading}
        error={recurringError}
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

      {/* ── One-off Session Modal ── */}
      <AppFormModal
        open={oneOffModal}
        onOpenChange={setOneOffModal}
        title="One-off Session"
        size="compact"
        onSubmit={handleAddOneOff}
        submitLabel="Add Session"
        loading={oneOffLoading}
        error={oneOffError}
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

      {/* ── Delete Class Confirm ── */}
      <AppConfirmModal
        open={deleteClassConfirm.open}
        onOpenChange={(open) =>
          !deleteClassConfirm.loading && setDeleteClassConfirm((s) => ({ ...s, open }))
        }
        title="Delete Class?"
        description={`Are you sure you want to delete "${deleteClassConfirm.className}"? All sessions will be removed.`}
        onConfirm={handleDeleteClass}
        loading={deleteClassConfirm.loading}
        confirmLabel="Delete Class"
      />

      {/* ── Delete Session Confirm ── */}
      <AppConfirmModal
        open={deleteSessionConfirm.open}
        onOpenChange={(open) =>
          !deleteSessionConfirm.loading && setDeleteSessionConfirm((s) => ({ ...s, open }))
        }
        title="Delete Session?"
        description="Are you sure you want to delete this session?"
        onConfirm={handleDeleteSession}
        loading={deleteSessionConfirm.loading}
        confirmLabel="Delete"
      />
    </div>
  );
};
