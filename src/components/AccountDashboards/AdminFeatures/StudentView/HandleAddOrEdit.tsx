import React from "react";
import Swal from "sweetalert2";
import { HandleAddOrEditProps } from "../../../../types/school";
import { useSchool } from "../../../../context/SchoolContext";
import { createLoadingTemplate, createStatusTemplate } from "../../../../utils/modalTemplates";
import "../../../../styles/AddStudentModal.css";
import { UserProfile } from "../../../../types/user";
import { getBaseModalOptions, getModalConfig } from "../../../../utils/modalConfig";
import { validateFormData } from "../../../../utils/formValidation";

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
  const defaultButtonText = isEdit ? "Edit Student" : "Add Student";
  const config = getModalConfig(isEdit);

  // ─── Single student form fields (used for edit or single-add) ───────────────
  const getSingleFormHTML = (prefill?: Partial<UserProfile>) => `
    <div class="swal-form-wrapper">
      <div class="swal-info-box">
        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        <div>
          <div class="swal-info-title">Student Role</div>
          <div class="swal-info-subtitle">This user will be assigned as a student</div>
        </div>
      </div>
      <div class="swal-field-group">
        <label for="swal-name">Full Name <span class="required">*</span></label>
        <input id="swal-name" type="text" placeholder="Enter student's full name" autocomplete="name" value="${prefill?.name ?? ""}" />
      </div>
      <div class="swal-field-group">
        <label for="swal-email">Email Address <span class="required">*</span></label>
        <input id="swal-email" type="email" placeholder="student@example.com" autocomplete="email" value="${prefill?.email ?? ""}" />
      </div>
      <div class="swal-field-group">
        <label for="swal-phone">Phone Number</label>
        <input id="swal-phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel" value="${prefill?.phone ?? ""}" />
      </div>
    </div>
  `;

  // ─── Bulk form HTML (rendered inside Swal, rows managed via vanilla JS) ──────
  const getBulkFormHTML = () => `
    <div class="swal-form-wrapper">
      <div class="swal-info-box">
        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        <div>
          <div class="swal-info-title">Bulk Add Students</div>
          <div class="swal-info-subtitle">Fill in each row — only Name and Email are required</div>
        </div>
      </div>

      <div id="bulk-rows-container">
        ${buildBulkRow(0)}
      </div>

      <button
        type="button"
        id="bulk-add-row-btn"
        style="margin-top:12px; padding:6px 14px; background:#2563eb; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:13px;"
        onclick="
          const container = document.getElementById('bulk-rows-container');
          const count = container.querySelectorAll('.bulk-row').length;
          const div = document.createElement('div');
          div.innerHTML = \`${buildBulkRow(999).replace(/`/g, "\\`")}\`;
          div.querySelector('.bulk-row').dataset.index = count;
          div.querySelector('.bulk-row-number').textContent = count + 1;
          container.appendChild(div.firstElementChild);
        "
      >
        + Add Another Student
      </button>
    </div>
  `;

  const buildBulkRow = (index: number) => `
    <div class="bulk-row" data-index="${index}" style="border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin-bottom:10px; background:#f9fafb; position:relative;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="bulk-row-number" style="font-weight:600; font-size:13px; color:#374151;">Student ${index + 1}</span>
        ${
          index > 0
            ? `
          <button type="button" onclick="this.closest('.bulk-row').remove()"
            style="background:none; border:none; cursor:pointer; color:#ef4444; font-size:18px; line-height:1;">&times;</button>
        `
            : ""
        }
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
        <div>
          <label style="font-size:12px; color:#6b7280; display:block; margin-bottom:3px;">Name *</label>
          <input class="bulk-name" type="text" placeholder="Full name"
            style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;" />
        </div>
        <div>
          <label style="font-size:12px; color:#6b7280; display:block; margin-bottom:3px;">Email *</label>
          <input class="bulk-email" type="email" placeholder="student@example.com"
            style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;" />
        </div>
        <div>
          <label style="font-size:12px; color:#6b7280; display:block; margin-bottom:3px;">Phone</label>
          <input class="bulk-phone" type="tel" placeholder="(555) 123-4567"
            style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; font-size:13px;" />
        </div>
      </div>
    </div>
  `;

  // ─── Main handler ────────────────────────────────────────────────────────────
  const handleAddOrEdit = async () => {
    try {
      if (isEdit) {
        await handleSingleModal();
      } else {
        // Ask: single or bulk?
        const { value: mode } = await Swal.fire({
          ...getBaseModalOptions(),
          title: "Add Students",
          text: "Would you like to add a single student or multiple at once?",
          showDenyButton: true,
          confirmButtonText: "Single Student",
          denyButtonText: "Bulk Add",
          confirmButtonColor: "#2563eb",
          denyButtonColor: "#7c3aed",
        });

        if (mode === true) {
          await handleSingleModal();
        } else if (mode === false) {
          await handleBulkModal();
        }
        // undefined = dismissed, do nothing
      }
    } catch (error) {
      console.error("Error in handleAddOrEdit:", error);
    }
  };

  // ─── Single modal ────────────────────────────────────────────────────────────
  const handleSingleModal = async () => {
    const { value: formValues } = await Swal.fire({
      ...getBaseModalOptions(),
      ...config,
      html: getSingleFormHTML(student),
      preConfirm: () => {
        const formData = {
          name: (document.getElementById("swal-name") as HTMLInputElement).value.trim(),
          email: (document.getElementById("swal-email") as HTMLInputElement).value.trim(),
          phone: (document.getElementById("swal-phone") as HTMLInputElement).value.trim(),
        };

        const validationError = validateFormData(formData);
        if (validationError) {
          Swal.showValidationMessage(validationError);
          return false;
        }

        return { ...formData, role: "Student", school_id: schoolId };
      },
    });

    if (formValues) {
      await handleFormSubmission(formValues);
    }
  };

  // ─── Bulk modal ──────────────────────────────────────────────────────────────
  const handleBulkModal = async () => {
    const { value: confirmed } = await Swal.fire({
      ...getBaseModalOptions(),
      title: "Bulk Add Students",
      html: getBulkFormHTML(),
      width: "800px",
      confirmButtonText: "Add All Students",
      confirmButtonColor: "#10b981",
      showCancelButton: true,
      preConfirm: () => {
        const rows = document.querySelectorAll(".bulk-row");
        const students: Array<Record<string, string>> = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const name = (row.querySelector(".bulk-name") as HTMLInputElement).value.trim();
          const email = (row.querySelector(".bulk-email") as HTMLInputElement).value.trim();
          const phone = (row.querySelector(".bulk-phone") as HTMLInputElement).value.trim();

          if (!name && !email && !phone) continue; // skip fully empty rows

          const validationError = validateFormData({ name, email, phone });
          if (validationError) {
            Swal.showValidationMessage(`Row ${i + 1}: ${validationError}`);
            return false;
          }

          students.push({ name, email, phone });
        }

        if (students.length === 0) {
          Swal.showValidationMessage("Please fill in at least one student.");
          return false;
        }

        return students;
      },
    });

    if (confirmed && Array.isArray(confirmed)) {
      await handleBulkSubmission(confirmed);
    }
  };

  // ─── Bulk submission ─────────────────────────────────────────────────────────
  const handleBulkSubmission = async (studentsData: Array<Record<string, string>>) => {
    Swal.fire({
      title: "Adding Students...",
      html: createLoadingTemplate(
        "Adding Students...",
        `Creating ${studentsData.length} student${studentsData.length > 1 ? "s" : ""}. Please wait.`,
      ),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const failed: string[] = [];

    for (const s of studentsData) {
      try {
        if (createStudent) {
          await createStudent({
            name: s.name,
            email: s.email,
            phone: s.phone,
            role: "Student",
            school_id: schoolId,
          } as Omit<UserProfile, "id">);
        }
      } catch {
        failed.push(s.name || s.email);
      }
    }

    if (loadStudents) await loadStudents();

    const successCount = studentsData.length - failed.length;

    if (failed.length === 0) {
      await Swal.fire({
        title: "All Done!",
        html: createStatusTemplate(
          "success",
          `${successCount} student${successCount > 1 ? "s" : ""} added successfully.`,
        ),
        confirmButtonText: "Continue",
        confirmButtonColor: "#10b981",
        timer: 1500,
        timerProgressBar: true,
      });
    } else {
      await Swal.fire({
        title: "Partially Complete",
        html: createStatusTemplate(
          "error",
          `${successCount} student${successCount > 1 ? "s" : ""} added. Failed: ${failed.join(", ")}`,
          "Please retry the failed entries manually.",
        ),
        confirmButtonText: "OK",
        confirmButtonColor: "#f59e0b",
      });
    }

    if (onSuccess) onSuccess();
  };

  // ─── Single submission (edit or single-add) ──────────────────────────────────
  const handleFormSubmission = async (formValues: Omit<UserProfile, "id">) => {
    Swal.fire({
      title: isEdit ? "Updating Student..." : "Creating Student...",
      html: createLoadingTemplate(
        isEdit ? "Updating Student..." : "Creating Student...",
        "Please wait while we process your request.",
      ),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    try {
      if (isEdit && updateStudent && student) {
        await updateStudent(student.id!, formValues);
      } else if (!isEdit && createStudent) {
        await createStudent(formValues);
      }

      if (loadStudents) await loadStudents();

      await Swal.fire({
        title: "Success!",
        html: createStatusTemplate(
          "success",
          `Student ${formValues.name} has been ${isEdit ? "updated" : "created"} successfully.`,
        ),
        confirmButtonText: "Continue",
        confirmButtonColor: "#10b981",
        timer: 1500,
        timerProgressBar: true,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      Swal.fire({
        title: "Oops! Something went wrong",
        html: createStatusTemplate(
          "error",
          `Failed to ${isEdit ? "update" : "create"} student.`,
          `Please check your connection and try again. ${error}`,
        ),
        confirmButtonText: "Try Again",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <button onClick={handleAddOrEdit} className={buttonClassName}>
      {buttonText || defaultButtonText}
    </button>
  );
};
