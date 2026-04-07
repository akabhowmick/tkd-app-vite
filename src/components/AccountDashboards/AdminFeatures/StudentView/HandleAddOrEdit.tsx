import React, { useState } from "react";
import { HandleAddOrEditProps } from "../../../../types/school";
import { useSchool } from "../../../../context/SchoolContext";
import { validateFormData } from "../../../../utils/formValidation";
import { Student } from "../../../../types/user";
import { AppFormModal, AppModal, ModalField, InfoBox } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Button } from "../../../ui/button";
import { Trash2, Plus, BookOpen } from "lucide-react";

const MAX_BULK_STUDENTS = 20;

type SingleForm = { name: string; email: string; phone: string };
type BulkRow = { name: string; email: string; phone: string };
type ModalMode = "closed" | "select" | "single" | "bulk" | "result";
type ResultState = { success: boolean; message: string; subMessage?: string };

const emptyBulkRow = (): BulkRow => ({ name: "", email: "", phone: "" });
const emptySingleForm = (prefill?: Partial<Student>): SingleForm => ({
  name: prefill?.name ?? "",
  email: prefill?.email ?? "",
  phone: prefill?.phone ?? "",
});

export const HandleAddOrEdit: React.FC<HandleAddOrEditProps> = ({
  student,
  onSuccess,
  buttonText,
  buttonClassName = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
  createStudent,
  updateStudent,
  loadStudents,
}) => {
  const { schoolId } = useSchool();
  const isEdit = !!student;

  const [mode, setMode] = useState<ModalMode>("closed");
  const [singleForm, setSingleForm] = useState<SingleForm>(emptySingleForm(student));
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyBulkRow()]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [result, setResult] = useState<ResultState | null>(null);

  const open = () => {
    if (isEdit) {
      setSingleForm(emptySingleForm(student));
      setSingleError(null);
      setMode("single");
    } else {
      setMode("select");
    }
  };

  const close = () => {
    setMode("closed");
    setBulkRows([emptyBulkRow()]);
    setSingleForm(emptySingleForm(student));
    setSingleError(null);
    setBulkError(null);
    setResult(null);
  };

  // ── Single submit ──────────────────────────────────────────────────────────
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);
    const validationError = validateFormData({
      name: singleForm.name,
      email: singleForm.email,
      phone: singleForm.phone,
    });
    if (validationError) { setSingleError(validationError); return; }

    setSingleLoading(true);
    try {
      const payload: Omit<Student, "id"> = {
        name: singleForm.name.trim(),
        email: singleForm.email.trim(),
        phone: singleForm.phone.trim(),
        role: "Student",
        school_id: schoolId,
      };

      if (isEdit && updateStudent && student) {
        await updateStudent(student.id!, payload);
      } else if (!isEdit && createStudent) {
        await createStudent(payload);
      }

      if (loadStudents) await loadStudents();

      setResult({
        success: true,
        message: `${singleForm.name} has been ${isEdit ? "updated" : "created"} successfully.`,
      });
      setMode("result");
      if (onSuccess) onSuccess();
    } catch (error) {
      setSingleError(
        `Failed to ${isEdit ? "update" : "create"} student. Please check your connection and try again. ${error}`,
      );
    } finally {
      setSingleLoading(false);
    }
  };

  // ── Bulk submit ────────────────────────────────────────────────────────────
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);

    const toSubmit = bulkRows.filter((r) => r.name || r.email || r.phone);
    if (toSubmit.length === 0) { setBulkError("Please fill in at least one student."); return; }

    for (let i = 0; i < toSubmit.length; i++) {
      const err = validateFormData(toSubmit[i]);
      if (err) { setBulkError(`Row ${i + 1}: ${err}`); return; }
    }

    setBulkLoading(true);
    const failed: string[] = [];

    for (const s of toSubmit) {
      try {
        if (createStudent) {
          await createStudent({
            name: s.name.trim(),
            email: s.email.trim(),
            phone: s.phone.trim(),
            role: "Student",
            school_id: schoolId,
          } as Omit<Student, "id">);
        }
      } catch {
        failed.push(s.name || s.email);
      }
    }

    if (loadStudents) await loadStudents();

    const successCount = toSubmit.length - failed.length;
    setBulkLoading(false);

    if (failed.length === 0) {
      setResult({
        success: true,
        message: `${successCount} student${successCount !== 1 ? "s" : ""} added successfully.`,
      });
    } else {
      setResult({
        success: false,
        message: `${successCount} student${successCount !== 1 ? "s" : ""} added.`,
        subMessage: `Failed: ${failed.join(", ")}. Please retry manually.`,
      });
    }

    setMode("result");
    if (onSuccess) onSuccess();
  };

  const updateBulkRow = (idx: number, field: keyof BulkRow, value: string) => {
    setBulkRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const removeBulkRow = (idx: number) => {
    setBulkRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const addBulkRow = () => {
    if (bulkRows.length < MAX_BULK_STUDENTS) {
      setBulkRows((rows) => [...rows, emptyBulkRow()]);
    }
  };

  return (
    <>
      <button onClick={open} className={buttonClassName}>
        {buttonText || (isEdit ? "Edit Student" : "Add Student")}
      </button>

      {/* ── Mode selection ── */}
      <AppFormModal
        open={mode === "select"}
        onOpenChange={(open) => !open && close()}
        title="Add Students"
        description="Would you like to add a single student or multiple at once?"
        size="compact"
        onSubmit={(e) => { e.preventDefault(); setMode("single"); setSingleForm(emptySingleForm()); setSingleError(null); }}
        submitLabel="Single Student"
        footerLeft={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => { setMode("bulk"); setBulkRows([emptyBulkRow()]); setBulkError(null); }}
          >
            Bulk Add
          </Button>
        }
      >
        <InfoBox
          icon={<BookOpen className="h-4 w-4" />}
          title="Student Role"
          subtitle="All added users will be assigned as students in your school."
        />
      </AppFormModal>

      {/* ── Single add/edit modal ── */}
      <AppFormModal
        open={mode === "single"}
        onOpenChange={(open) => !open && close()}
        title={isEdit ? "Edit Student" : "Add Student"}
        size="compact"
        onSubmit={handleSingleSubmit}
        submitLabel={isEdit ? "Update Student" : "Add Student"}
        loading={singleLoading}
        error={singleError}
      >
        <InfoBox
          icon={<BookOpen className="h-4 w-4" />}
          title="Student Role"
          subtitle="This user will be assigned as a student."
        />
        <ModalField label="Full Name" required htmlFor="swal-name">
          <Input
            id="swal-name"
            type="text"
            placeholder="Enter student's full name"
            autoComplete="name"
            value={singleForm.name}
            onChange={(e) => setSingleForm((f) => ({ ...f, name: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Email Address" required htmlFor="swal-email">
          <Input
            id="swal-email"
            type="email"
            placeholder="student@example.com"
            autoComplete="email"
            value={singleForm.email}
            onChange={(e) => setSingleForm((f) => ({ ...f, email: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Phone Number" htmlFor="swal-phone" helper="Optional">
          <Input
            id="swal-phone"
            type="tel"
            placeholder="(555) 123-4567"
            autoComplete="tel"
            value={singleForm.phone}
            onChange={(e) => setSingleForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Bulk add modal ── */}
      <AppFormModal
        open={mode === "bulk"}
        onOpenChange={(open) => !open && close()}
        title="Bulk Add Students"
        description={`Fill in each row — Name and Email required (max ${MAX_BULK_STUDENTS})`}
        size="wide"
        onSubmit={handleBulkSubmit}
        submitLabel={`Add ${bulkRows.filter((r) => r.name || r.email || r.phone).length || "All"} Students`}
        loading={bulkLoading}
        error={bulkError}
        footerLeft={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBulkRow}
            disabled={bulkRows.length >= MAX_BULK_STUDENTS || bulkLoading}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </Button>
        }
      >
        <InfoBox
          icon={<BookOpen className="h-4 w-4" />}
          title="Bulk Add Students"
          subtitle={`Fill each row — only Name and Email are required (max ${MAX_BULK_STUDENTS})`}
        />
        <div className="flex flex-col gap-3 mt-1">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name *</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email *</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</span>
            <span />
          </div>
          {bulkRows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 items-center p-3 rounded-lg border border-border bg-muted/20"
            >
              <Input
                type="text"
                placeholder="Full name"
                value={row.name}
                onChange={(e) => updateBulkRow(idx, "name", e.target.value)}
              />
              <Input
                type="email"
                placeholder="student@example.com"
                value={row.email}
                onChange={(e) => updateBulkRow(idx, "email", e.target.value)}
              />
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={row.phone}
                onChange={(e) => updateBulkRow(idx, "phone", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeBulkRow(idx)}
                disabled={bulkRows.length === 1}
                className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </AppFormModal>

      {/* ── Result modal ── */}
      <AppModal
        open={mode === "result"}
        onOpenChange={(open) => !open && close()}
        title={result?.success ? "Done!" : "Partially Complete"}
        size="compact"
      >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center ${
              result?.success ? "bg-green-100" : "bg-yellow-100"
            }`}
          >
            <span className="text-2xl">{result?.success ? "✓" : "⚠"}</span>
          </div>
          <p className="text-sm text-foreground font-medium">{result?.message}</p>
          {result?.subMessage && (
            <p className="text-xs text-muted-foreground">{result.subMessage}</p>
          )}
          <Button size="sm" onClick={close} className="mt-2">
            Continue
          </Button>
        </div>
      </AppModal>
    </>
  );
};
