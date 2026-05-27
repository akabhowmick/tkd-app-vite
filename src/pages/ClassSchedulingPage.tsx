import { useState } from "react";
import { useClasses } from "../context/ClassContext";
import { AgeGroup, Class } from "../types/classes";
import { FaPlus, FaTrash, FaClock, FaUsers, FaTimes } from "react-icons/fa";
import { AppConfirmModal } from "../components/ui/modal";
import { Input } from "../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatTime = (t?: string) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

type ClassForm = { class_name: string; age_group: AgeGroup; day_of_week: string; start_time: string; end_time: string };
const emptyForm = (): ClassForm => ({ class_name: "", age_group: "Kids", day_of_week: "1", start_time: "", end_time: "" });
const formFromClass = (c: Class): ClassForm => ({
  class_name: c.class_name, age_group: c.age_group,
  day_of_week: c.day_of_week !== undefined ? String(c.day_of_week) : "1",
  start_time: c.start_time ?? "", end_time: c.end_time ?? "",
});

export const ClassSchedulingPage = () => {
  const { classes, loading, deleteClass, createClass, updateClass } = useClasses();

  // ── Add / Edit panel ───────────────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean; classId: string; className: string; loading: boolean;
  }>({ open: false, classId: "", className: "", loading: false });

  const setF = <K extends keyof ClassForm>(k: K, v: ClassForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditingClass(null); setForm(emptyForm()); setFormError(null); setPanelOpen(true); };
  const openEdit = (cls: Class) => { setEditingClass(cls); setForm(formFromClass(cls)); setFormError(null); setPanelOpen(true); };
  const closePanel = () => { setPanelOpen(false); setEditingClass(null); setFormError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.class_name.trim()) return setFormError("Class name is required.");
    if (!form.start_time) return setFormError("Start time is required.");
    if (!form.end_time) return setFormError("End time is required.");
    setFormLoading(true);
    try {
      const payload = {
        class_name: form.class_name.trim(),
        age_group: form.age_group,
        day_of_week: parseInt(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
      };
      if (editingClass) {
        await updateClass(editingClass.class_id, payload);
      } else {
        await createClass(payload);
      }
      closePanel();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : `Failed to ${editingClass ? "update" : "create"} class.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    setDeleteConfirm((s) => ({ ...s, loading: true }));
    try { await deleteClass(deleteConfirm.classId); }
    finally { setDeleteConfirm({ open: false, classId: "", className: "", loading: false }); }
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
          {!panelOpen && (
            <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <FaPlus /> New Class
            </button>
          )}
        </div>

        {/* Inline class form */}
        {panelOpen && (
          <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{editingClass ? "Edit Class" : "New Class"}</h2>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-600"><FaTimes size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Class Name <span className="text-red-500">*</span></label>
                  <Input placeholder="e.g., Kids Beginners" value={form.class_name} onChange={(e) => setF("class_name", e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Age Group <span className="text-red-500">*</span></label>
                  <Select value={form.age_group} onValueChange={(v) => setF("age_group", v as AgeGroup)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kids">Kids</SelectItem>
                      <SelectItem value="Adults">Adults</SelectItem>
                      <SelectItem value="All">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Day of Week <span className="text-red-500">*</span></label>
                  <Select value={form.day_of_week} onValueChange={(v) => setF("day_of_week", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day, idx) => (
                        <SelectItem key={idx} value={String(idx)}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Time <span className="text-red-500">*</span></label>
                  <Input type="time" value={form.start_time} onChange={(e) => setF("start_time", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Time <span className="text-red-500">*</span></label>
                  <Input type="time" value={form.end_time} onChange={(e) => setF("end_time", e.target.value)} />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closePanel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {formLoading ? "Saving…" : editingClass ? "Save Changes" : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        )}

        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FaUsers className="mx-auto text-gray-300 text-5xl mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Classes Yet</h2>
            <p className="text-gray-500 mb-4">Create your first class to get started with scheduling</p>
            <button onClick={openNew} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Create First Class</button>
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
                      {cls.instructor && <p className="text-sm text-gray-500">{cls.instructor}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cls)} className="text-blue-500 hover:text-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ open: true, classId: cls.class_id, className: cls.class_name, loading: false })}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{cls.age_group}</span>
                    {cls.day_of_week !== undefined && cls.start_time && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <FaClock className="text-gray-400" />
                        {DAYS_OF_WEEK[cls.day_of_week]} · {formatTime(cls.start_time)}
                        {cls.end_time && `–${formatTime(cls.end_time)}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppConfirmModal
        open={deleteConfirm.open}
        onOpenChange={(open) => !deleteConfirm.loading && setDeleteConfirm((s) => ({ ...s, open }))}
        title="Delete Class?"
        description={`Are you sure you want to delete "${deleteConfirm.className}"?`}
        onConfirm={handleDeleteClass}
        loading={deleteConfirm.loading}
        confirmLabel="Delete Class"
      />
    </div>
  );
};
