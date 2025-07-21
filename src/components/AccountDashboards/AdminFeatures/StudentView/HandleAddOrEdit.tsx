import React from "react";
import Swal from "sweetalert2";
import { HandleAddOrEditProps } from "../../../../types/school";
import { useSchool } from "../../../../context/SchoolContext";

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

  const handleAddOrEdit = async () => {
    const title = isEdit ? "Edit Student" : "Add New Student";

    try {
      const { value: formValues } = await Swal.fire({
        title,
        html: `
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input id="swal-name" class="swal2-input" placeholder="Enter student name" value="${
                student?.name || ""
              }" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input id="swal-email" class="swal2-input" type="email" placeholder="Enter email address" value="${
                student?.email || ""
              }" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input id="swal-phone" class="swal2-input" type="tel" placeholder="Enter phone number" value="${
                student?.phone || ""
              }">
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: isEdit ? "Update Student" : "Add Student",
        confirmButtonColor: isEdit ? "#059669" : "#3b82f6",
        cancelButtonColor: "#6b7280",
        width: "500px",
        customClass: {
          htmlContainer: "text-left",
        },
        preConfirm: () => {
          const name = (document.getElementById("swal-name") as HTMLInputElement).value;
          const email = (document.getElementById("swal-email") as HTMLInputElement).value;
          const phone = (document.getElementById("swal-phone") as HTMLInputElement).value;
          const role = "Student";
          const school_id = schoolId; 

          if (!name || !email) {
            Swal.showValidationMessage("Please fill in all required fields");
            return false;
          }

          if (!email.includes("@")) {
            Swal.showValidationMessage("Please enter a valid email address");
            return false;
          }

          return { name, email, phone, role, school_id };
        },
      });

      if (formValues) {
        // Show loading
        Swal.fire({
          title: isEdit ? "Updating Student..." : "Creating Student...",
          text: "Please wait while we process your request.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
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

          await Swal.fire({
            title: "Success!",
            text: `Student has been ${isEdit ? "updated" : "created"} successfully.`,
            icon: "success",
            confirmButtonColor: "#10b981",
            timer: 1000,
            timerProgressBar: true,
          });

          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          Swal.fire({
            title: "Error!",
            text: `Failed to ${
              isEdit ? "update" : "create"
            } student, due to ${error} Please try again.`,
            icon: "error",
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } catch (error) {
      console.error(`Error in handle${isEdit ? "Edit" : "Add"}:`, error);
    }
  };

  return (
    <button onClick={handleAddOrEdit} className={buttonClassName}>
      {buttonText || defaultButtonText}
    </button>
  );
};

