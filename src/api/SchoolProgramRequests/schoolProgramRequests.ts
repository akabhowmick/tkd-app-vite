import { supabase } from "../supabase";
import {
  SchoolProgram,
  CreateSchoolProgramRequest,
  UpdateSchoolProgramRequest,
} from "../../types/programs";

export async function getSchoolPrograms(schoolId: string): Promise<SchoolProgram[]> {
  const { data, error } = await supabase
    .from("school_programs")
    .select("*")
    .eq("school_id", schoolId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function createSchoolProgram(req: CreateSchoolProgramRequest): Promise<SchoolProgram> {
  const { data, error } = await supabase.from("school_programs").insert(req).select().single();

  if (error) throw error;
  return data;
}

export async function updateSchoolProgram(
  programId: string,
  updates: UpdateSchoolProgramRequest,
): Promise<SchoolProgram> {
  const { data, error } = await supabase
    .from("school_programs")
    .update(updates)
    .eq("program_id", programId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a program. Will fail if renewals are still attached to it
 * (FK ON DELETE SET NULL means it won't cascade-delete renewals,
 * but we guard in the UI before allowing delete).
 */
export async function deleteSchoolProgram(programId: string): Promise<void> {
  const { error } = await supabase.from("school_programs").delete().eq("program_id", programId);

  if (error) throw error;
}

/**
 * Check if any renewal periods are using this program.
 * Used to block/warn before deletion.
 */
export async function getProgramRenewalCount(programId: string): Promise<number> {
  const { count, error } = await supabase
    .from("renewal_periods")
    .select("*", { count: "exact", head: true })
    .eq("program_id", programId);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Ensure a "Regular" default program exists for a school.
 * Safe to call multiple times — uses upsert.
 */
export async function ensureDefaultProgram(schoolId: string): Promise<SchoolProgram> {
  const { data, error } = await supabase
    .from("school_programs")
    .upsert(
      {
        school_id: schoolId,
        name: "Regular",
        program_type: "time_based",
        description: "Standard time-based membership",
      },
      { onConflict: "school_id,name" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
