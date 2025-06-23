import React from "react";
import Swal from "sweetalert2";
import { UserProfile } from "../../../../types/user";

// Types for student data
interface StudentData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  school_id: string;
}

interface HandleAddOrEditProps {
  student?: UserProfile;
  onSuccess?: () => void;
  buttonText?: string;
  buttonClassName?: string;
  createStudent?: (student: Omit<UserProfile, "id">) => Promise<void>;
  updateStudent?: (id: string, student: Partial<UserProfile>) => Promise<void>;
  loadStudents?: () => Promise<void>;
}

export const HandleAddOrEdit: React.FC<HandleAddOrEditProps> = ({
  student,
  onSuccess,
  buttonText,
  buttonClassName = "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
  createStudent,
  updateStudent,
  loadStudents,
}) => {
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
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select id="swal-role" class="swal2-select">
                <option value="Student" ${
                  !student?.role || student?.role === "Student" ? "selected" : ""
                }>Student</option>
                <option value="Admin" ${student?.role === "Admin" ? "selected" : ""}>Admin</option>
                <option value="Instructor" ${
                  student?.role === "Instructor" ? "selected" : ""
                }>Instructor</option>
                <option value="Parent" ${
                  student?.role === "Parent" ? "selected" : ""
                }>Parent</option>
              </select>
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
          const role = (document.getElementById("swal-role") as HTMLSelectElement).value;

          if (!name || !email) {
            Swal.showValidationMessage("Please fill in all required fields");
            return false;
          }

          if (!email.includes("@")) {
            Swal.showValidationMessage("Please enter a valid email address");
            return false;
          }

          return { name, email, phone, role };
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

          // Success message
          await Swal.fire({
            title: "Success!",
            text: `Student has been ${isEdit ? "updated" : "created"} successfully.`,
            icon: "success",
            confirmButtonColor: "#10b981",
            timer: 2000,
            timerProgressBar: true,
          });

          // Call success callback if provided
          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          // Error message
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

// Alternative version as a standalone page component
export const AddStudentPage: React.FC<{
  createStudent?: (data: StudentData) => Promise<void>;
  loadStudents?: () => Promise<void>;
}> = ({ createStudent, loadStudents }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Add New Student</h2>
          <p className="mt-2 text-sm text-gray-600">
            Click the button below to add a new student to the system
          </p>
        </div>
        <div className="mt-8 text-center">
          <HandleAddOrEdit
            createStudent={createStudent}
            loadStudents={loadStudents}
            buttonClassName="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
