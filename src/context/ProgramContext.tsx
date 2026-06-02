/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import {
  SchoolProgram,
  CreateSchoolProgramRequest,
  UpdateSchoolProgramRequest,
} from "../types/programs";
import {
  getSchoolPrograms,
  createSchoolProgram,
  updateSchoolProgram,
  deleteSchoolProgram,
  getProgramRenewalCount,
  ensureDefaultProgram,
} from "../api/SchoolProgramRequests/schoolProgramRequests";
import { useSchool } from "./SchoolContext";
import { track } from "../analytics/posthog";

interface ProgramContextType {
  programs: SchoolProgram[];
  loading: boolean;
  error: string | null;
  loadPrograms: () => Promise<void>;
  createProgram: (req: Omit<CreateSchoolProgramRequest, "school_id">) => Promise<SchoolProgram>;
  updateProgram: (programId: string, updates: UpdateSchoolProgramRequest) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  getProgramById: (programId: string) => SchoolProgram | undefined;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export const ProgramProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [programs, setPrograms] = useState<SchoolProgram[]>([]);
  const { loading, error, run, load } = useAsyncState();

  const loadPrograms = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      // Ensure "Regular" exists before loading
      await ensureDefaultProgram(schoolId);
      const data = await getSchoolPrograms(schoolId);
      setPrograms(data);
    }, "Failed to load programs");
  }, [schoolId, load]);

  const createProgram = useCallback(
    async (req: Omit<CreateSchoolProgramRequest, "school_id">): Promise<SchoolProgram> => {
      if (!schoolId) throw new Error("School ID required");
      return run(async () => {
        const newProgram = await createSchoolProgram({ ...req, school_id: schoolId });
        setPrograms((prev) => [...prev, newProgram].sort((a, b) => a.name.localeCompare(b.name)));
        track("program_created");
        return newProgram;
      }, "Failed to create program");
    },
    [schoolId, run],
  );

  const updateProgram = useCallback(
    async (programId: string, updates: UpdateSchoolProgramRequest): Promise<void> => {
      await run(async () => {
        const updated = await updateSchoolProgram(programId, updates);
        setPrograms((prev) => prev.map((p) => (p.program_id === programId ? updated : p)));
        track("program_updated");
      }, "Failed to update program");
    },
    [run],
  );

  const deleteProgram = useCallback(async (programId: string): Promise<void> => {
    await run(async () => {
      // Guard: block deletion if renewals are attached
      const count = await getProgramRenewalCount(programId);
      if (count > 0) {
        throw new Error(
          `Cannot delete — ${count} renewal${count !== 1 ? "s" : ""} still use this program. Reassign them first.`,
        );
      }
      await deleteSchoolProgram(programId);
      setPrograms((prev) => prev.filter((p) => p.program_id !== programId));
      track("program_deleted");
    }, "Failed to delete program");
  }, [run]);

  const getProgramById = useCallback(
    (programId: string) => programs.find((p) => p.program_id === programId),
    [programs],
  );

  useEffect(() => {
    if (schoolId) loadPrograms();
  }, [schoolId, loadPrograms]);

  return (
    <ProgramContext.Provider
      value={{
        programs,
        loading,
        error,
        loadPrograms,
        createProgram,
        updateProgram,
        deleteProgram,
        getProgramById,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};

export const usePrograms = (): ProgramContextType => {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error("usePrograms must be used within ProgramProvider");
  return ctx;
};
