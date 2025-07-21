import React from "react";
import Swal from "sweetalert2";
import { HandleAddOrEditProps } from "../../../../types/school";
import { useSchool } from "../../../../context/SchoolContext";
import {
  createFormTemplate,
  createLoadingTemplate,
  createStatusTemplate,
  FormField,
} from "../../../../utils/modalTemplates";
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

  const getFormFields = (): FormField[] => [
    {
      id: "swal-name",
      label: "Full Name",
      type: "text",
      placeholder: "Enter student's full name",
      required: true,
      value: student?.name,
      autocomplete: "name",
    },
    {
      id: "swal-email",
      label: "Email Address",
      type: "email",
      placeholder: "student@example.com",
      required: true,
      value: student?.email || "",
      autocomplete: "email",
    },
    {
      id: "swal-phone",
      label: "Phone Number",
      type: "tel",
      placeholder: "(555) 123-4567",
      required: false,
      value: student?.phone,
      autocomplete: "tel",
    },
  ];

  const getFormData = (): Record<string, string> => ({
    name: (document.getElementById("swal-name") as HTMLInputElement).value.trim(),
    email: (document.getElementById("swal-email") as HTMLInputElement).value.trim(),
    phone: (document.getElementById("swal-phone") as HTMLInputElement).value.trim(),
  });

  const handleAddOrEdit = async () => {
    try {
      const formFields = getFormFields();
      const infoBox = {
        title: "Student Role",
        subtitle: "This user will be assigned as a student",
        icon: '<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>',
      };

      const { value: formValues } = await Swal.fire({
        ...getBaseModalOptions(),
        ...config,
        html: createFormTemplate(formFields, infoBox),
        preConfirm: () => {
          const formData = getFormData();
          const validationError = validateFormData(formData);

          if (validationError) {
            Swal.showValidationMessage(validationError);
            return false;
          }

          return {
            ...formData,
            role: "Student",
            school_id: schoolId,
          };
        },
      });

      if (formValues) {
        await handleFormSubmission(formValues);
      }
    } catch (error) {
      console.error(`Error in handle${isEdit ? "Edit" : "Add"}:`, error);
    }
  };

  const handleFormSubmission = async (formValues: Omit<UserProfile, "id">) => {
    // Show loading
    Swal.fire({
      title: isEdit ? "Updating Student..." : "Creating Student...",
      html: createLoadingTemplate(
        isEdit ? "Updating Student..." : "Creating Student...",
        "Please wait while we process your request."
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

      if (loadStudents) {
        await loadStudents();
      }

      // Show success
      await Swal.fire({
        title: "Success!",
        html: createStatusTemplate(
          "success",
          `Student ${formValues.name} has been ${isEdit ? "updated" : "created"} successfully.`
        ),
        confirmButtonText: "Continue",
        confirmButtonColor: "#10b981",
        timer: 1500,
        timerProgressBar: true,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Show error
      Swal.fire({
        title: "Oops! Something went wrong",
        html: createStatusTemplate(
          "error",
          `Failed to ${isEdit ? "update" : "create"} student.`,
          `Please check your connection and try again. ${error}`
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
