export type AgeGroup = "Kids" | "Adults" | "All";

export interface Class {
  class_id: string;
  school_id: string;
  class_name: string;
  age_group: AgeGroup;
  instructor: string;
  color: string;
  day_of_week?: number;   // 0-6 (Sunday–Saturday)
  start_time?: string;    // HH:MM
  end_time?: string;      // HH:MM
  created_at: string;
  updated_at: string;
}

export type ClassRow = Class;

export interface CreateClassRequest {
  school_id: string;
  class_name: string;
  age_group: AgeGroup;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
}

export interface UpdateClassRequest {
  class_name?: string;
  age_group?: AgeGroup;
  instructor?: string;
  color?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
}

export type CreateClassPayload = CreateClassRequest;
