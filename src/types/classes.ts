export type AgeGroup = "Kids" | "Adults" | "All";
export type SessionType = "recurring" | "one-off";

export interface Class {
  class_id: string;
  school_id: string;
  class_name: string;
  age_group: AgeGroup;
  instructor: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  session_id: string;
  class_id: string;
  school_id: string;
  session_type: SessionType;
  day_of_week?: number; // 0-6 (Sunday-Saturday), only for recurring
  start_time: string; // HH:MM format
  end_time: string;
  specific_date?: string; // YYYY-MM-DD, only for one-off
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClassRequest {
  school_id: string;
  class_name: string;
  age_group: AgeGroup;
}

export interface UpdateClassRequest {
  class_name?: string;
  age_group?: AgeGroup;
  instructor?: string;
  color?: string;
}

export interface CreateSessionRequest {
  class_id: string;
  school_id: string;
  session_type: SessionType;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  specific_date?: string;
}

export interface UpdateSessionRequest {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  specific_date?: string;
  is_active?: boolean;
}

export interface ClassWithSessions extends Class {
  sessions: ClassSession[];
}

export type ClassRow = {
  class_id: string;
  school_id: string;
  class_name: string;
  age_group: "Kids" | "Adults" | "All";
  created_at: string;
};

export type CreateClassPayload = {
  school_id: string;
  class_name: string;
  age_group: AgeGroup;
};
