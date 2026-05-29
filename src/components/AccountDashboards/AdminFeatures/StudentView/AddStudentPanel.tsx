import { useState } from "react";
import { createStudent } from "../../../../api/StudentRequests/studentRequests";
import { validateFormData } from "../../../../utils/formValidation";
import { Input } from "../../../ui/input";
import { FaTimes, FaPlus, FaTrash } from "react-icons/fa";

type AddForm = { name: string; email: string; phone: string; current_rank_id: string };
type BulkRow = { name: string; email: string; phone: string; current_rank_id: string };
type AddTab  = "single" | "bulk";

const emptyAddForm = (): AddForm => ({ name: "", email: "", phone: "", current_rank_id: "" });
const emptyBulkRow = (): BulkRow => ({ name: "", email: "", phone: "", current_rank_id: "" });
const MAX_BULK = 20;

type Rank = { rank_id: string; rank_name: string; rank_order: number };

const BeltSelect = ({
  value,
  onChange,
  ranks,
}: {
  value: string;
  onChange: (v: string) => void;
  ranks: Rank[];
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <option value="">No belt</option>
    {ranks
      .sort((a, b) => a.rank_order - b.rank_order)
      .map((r) => (
        <option key={r.rank_id} value={r.rank_id}>
          {r.rank_name}
        </option>
      ))}
  </select>
);

interface AddStudentPanelProps {
  schoolId: string;
  ranks: Rank[];
  onClose: () => void;
  onAdded: () => void;
}

export const AddStudentPanel = ({ schoolId, ranks, onClose, onAdded }: AddStudentPanelProps) => {
  const [addTab, setAddTab]       = useState<AddTab>("single");
  const [addForm, setAddForm]     = useState<AddForm>(emptyAddForm());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError]   = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [bulkRows, setBulkRows]   = useState<BulkRow[]>([emptyBulkRow()]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const switchTab = (tab: AddTab) => {
    setAddTab(tab);
    setAddError(null);
    setBulkError(null);
    setAddSuccess(null);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const err = validateFormData({ name: addForm.name, email: addForm.email, phone: addForm.phone });
    if (err) { setAddError(err); return; }
    setAddLoading(true);
    try {
      await createStudent({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        role: "Student",
        school_id: schoolId,
        current_rank_id: addForm.current_rank_id || undefined,
      });
      onAdded();
      setAddSuccess(`${addForm.name.trim()} added successfully.`);
      setAddForm(emptyAddForm());
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add student.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    const toSubmit = bulkRows.filter((r) => r.name || r.email);
    if (toSubmit.length === 0) { setBulkError("Fill in at least one student."); return; }
    for (let i = 0; i < toSubmit.length; i++) {
      const err = validateFormData(toSubmit[i]);
      if (err) { setBulkError(`Row ${i + 1}: ${err}`); return; }
    }
    setBulkLoading(true);
    const failed: string[] = [];
    for (const s of toSubmit) {
      try {
        await createStudent({
          name: s.name.trim(), email: s.email.trim(), phone: s.phone.trim(),
          role: "Student", school_id: schoolId,
          current_rank_id: s.current_rank_id || undefined,
        });
      } catch { failed.push(s.name || s.email); }
    }
    onAdded();
    setBulkLoading(false);
    if (failed.length === 0) {
      setAddSuccess(`${toSubmit.length} student${toSubmit.length !== 1 ? "s" : ""} added successfully.`);
      setBulkRows([emptyBulkRow()]);
    } else {
      setBulkError(`${toSubmit.length - failed.length} added. Failed: ${failed.join(", ")}.`);
    }
  };

  const updateBulkRow = (idx: number, field: keyof BulkRow, value: string) =>
    setBulkRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  return (
    <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Add Student</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <FaTimes size={16} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {(["single", "bulk"] as AddTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              addTab === tab ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "single" ? "Single" : "Bulk"}
          </button>
        ))}
      </div>

      {/* Success banner */}
      {addSuccess && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-4 py-2 mb-4">
          <p className="text-sm text-green-700 font-medium">✓ {addSuccess}</p>
          <button onClick={() => setAddSuccess(null)} className="text-green-500 hover:text-green-700 ml-4">
            <FaTimes size={12} />
          </button>
        </div>
      )}

      {/* Single form */}
      {addTab === "single" && (
        <form onSubmit={handleSingleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
              <Input placeholder="Full name" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
              <Input type="email" placeholder="student@example.com" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <Input type="tel" placeholder="(555) 123-4567" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Belt <span className="text-gray-400 font-normal">(optional)</span></label>
              <BeltSelect value={addForm.current_rank_id} onChange={(v) => setAddForm((f) => ({ ...f, current_rank_id: v }))} ranks={ranks} />
            </div>
          </div>
          {addError && <p className="text-sm text-red-600 mb-3">{addError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={addLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">
              {addLoading ? "Adding…" : "Add Student"}
            </button>
          </div>
        </form>
      )}

      {/* Bulk form */}
      {addTab === "bulk" && (
        <form onSubmit={handleBulkSubmit}>
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_2rem] gap-2 px-1 mb-1">
            {["Name *", "Email *", "Phone", "Belt", ""].map((h, i) => (
              <span key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</span>
            ))}
          </div>

          <div className="flex flex-col gap-2 mb-3 max-h-72 overflow-y-auto pr-1">
            {bulkRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_2rem] sm:grid-cols-[1fr_1fr_1fr_1fr_2rem] gap-2 items-start sm:items-center p-3 sm:p-0 rounded-lg border border-gray-200 sm:border-0 sm:rounded-none bg-gray-50 sm:bg-transparent">
                <div className="grid grid-cols-1 sm:contents gap-2">
                  <div className="sm:hidden">
                    <span className="text-xs text-gray-400">Name *</span>
                    <Input placeholder="Full name" value={row.name} onChange={(e) => updateBulkRow(idx, "name", e.target.value)} />
                  </div>
                  <Input className="hidden sm:flex" placeholder="Full name" value={row.name} onChange={(e) => updateBulkRow(idx, "name", e.target.value)} />

                  <div className="sm:hidden">
                    <span className="text-xs text-gray-400">Email *</span>
                    <Input type="email" placeholder="student@example.com" value={row.email} onChange={(e) => updateBulkRow(idx, "email", e.target.value)} />
                  </div>
                  <Input className="hidden sm:flex" type="email" placeholder="student@example.com" value={row.email} onChange={(e) => updateBulkRow(idx, "email", e.target.value)} />

                  <div className="sm:hidden">
                    <span className="text-xs text-gray-400">Phone</span>
                    <Input type="tel" placeholder="(555) 123-4567" value={row.phone} onChange={(e) => updateBulkRow(idx, "phone", e.target.value)} />
                  </div>
                  <Input className="hidden sm:flex" type="tel" placeholder="(555) 123-4567" value={row.phone} onChange={(e) => updateBulkRow(idx, "phone", e.target.value)} />

                  <div className="sm:hidden">
                    <span className="text-xs text-gray-400">Belt</span>
                    <BeltSelect value={row.current_rank_id} onChange={(v) => updateBulkRow(idx, "current_rank_id", v)} ranks={ranks} />
                  </div>
                  <div className="hidden sm:block">
                    <BeltSelect value={row.current_rank_id} onChange={(v) => updateBulkRow(idx, "current_rank_id", v)} ranks={ranks} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBulkRows((rows) => rows.filter((_, i) => i !== idx))}
                  disabled={bulkRows.length === 1}
                  className="flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 self-start sm:self-auto mt-1 sm:mt-0"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setBulkRows((rows) => [...rows, emptyBulkRow()])}
            disabled={bulkRows.length >= MAX_BULK || bulkLoading}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-40 mb-4"
          >
            <FaPlus size={11} /> Add Row
          </button>

          {bulkError && <p className="text-sm text-red-600 mb-3">{bulkError}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={bulkLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50">
              {bulkLoading ? "Adding…" : `Add ${bulkRows.filter((r) => r.name || r.email).length || "All"} Students`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
