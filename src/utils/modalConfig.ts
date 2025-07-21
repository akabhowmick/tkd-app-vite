export interface ModalConfig {
  title: string;
  confirmButtonText: string;
  confirmButtonColor: string;
  width: string;
  padding: string;
}

export const getModalConfig = (isEdit: boolean): ModalConfig => ({
  title: isEdit ? "Edit Student" : "Add New Student",
  confirmButtonText: isEdit ? "Update Student" : "Add Student", 
  confirmButtonColor: isEdit ? "#059669" : "#3b82f6",
  width: "600px",
  padding: "2rem",
});

export const getBaseModalOptions = () => ({
  focusConfirm: false,
  showCancelButton: true,
  cancelButtonText: "Cancel",
  cancelButtonColor: "#6b7280",
  customClass: {
    htmlContainer: "text-left",
    popup: "custom-swal-popup",
    title: "custom-swal-title",
  },
  backdrop: `rgba(0, 0, 0, 0.4) center no-repeat`,
});
