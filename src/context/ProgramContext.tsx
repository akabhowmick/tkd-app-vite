/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      setError(null);
      // Ensure "Regular" exists before loading
      await ensureDefaultProgram(schoolId);
      const data = await getSchoolPrograms(schoolId);
      setPrograms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const createProgram = useCallback(
    async (req: Omit<CreateSchoolProgramRequest, "school_id">): Promise<SchoolProgram> => {
      if (!schoolId) throw new Error("School ID required");
      try {
        setLoading(true);
        setError(null);
        const newProgram = await createSchoolProgram({ ...req, school_id: schoolId });
        setPrograms((prev) => [...prev, newProgram].sort((a, b) => a.name.localeCompare(b.name)));
        return newProgram;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create program";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [schoolId],
  );

  const updateProgram = useCallback(
    async (programId: string, updates: UpdateSchoolProgramRequest): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const updated = await updateSchoolProgram(programId, updates);
        setPrograms((prev) => prev.map((p) => (p.program_id === programId ? updated : p)));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update program";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteProgram = useCallback(async (programId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Guard: block deletion if renewals are attached
      const count = await getProgramRenewalCount(programId);
      if (count > 0) {
        throw new Error(
          `Cannot delete — ${count} renewal${count !== 1 ? "s" : ""} still use this program. Reassign them first.`,
        );
      }

      await deleteSchoolProgram(programId);
      setPrograms((prev) => prev.filter((p) => p.program_id !== programId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete program";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
