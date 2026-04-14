export type ProgramType = "time_based" | "milestone_based";

export interface SchoolProgram {
  program_id: string;
  school_id: string;
  name: string;
  program_type: ProgramType;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSchoolProgramRequest {
  school_id: string;
  name: string;
  program_type: ProgramType;
  description?: string;
}

export interface UpdateSchoolProgramRequest {
  name?: string;
  program_type?: ProgramType;
  description?: string;
}
