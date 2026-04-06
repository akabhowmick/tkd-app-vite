import { Student } from "./user";

export interface School {
  id: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  description?: string;
  established_at?: string;
  admin_id?: string;
  created_at: string;
}

export type SchoolInput = {
  admin_id?: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  description?: string;
  established_at?: string;
};

export interface HandleAddOrEditProps {
  student?: Student;
  onSuccess?: () => void;
  buttonText?: string;
  buttonClassName?: string;
  createStudent?: (student: Omit<Student, "id">) => Promise<void>;
  updateStudent?: (id: string, student: Partial<Student>) => Promise<void>;
  loadStudents?: () => Promise<void>;
}
