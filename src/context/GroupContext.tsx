import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import { StudentGroup } from "../types/groups";
import {
  getSchoolGroups,
  createGroup as apiCreateGroup,
  updateGroup as apiUpdateGroup,
  deleteGroup as apiDeleteGroup,
  getStudentGroups as apiGetStudentGroups,
  setStudentGroups as apiSetStudentGroups,
  getAllGroupMembersForSchool,
  getGroupStudentIds as apiGetGroupStudentIds,
  addMemberToGroup as apiAddMemberToGroup,
  removeMemberFromGroup as apiRemoveMemberFromGroup,
} from "../api/GroupRequests/groupRequests";
import { useSchool } from "./SchoolContext";
import { track } from "../analytics/posthog";
import { captureException } from "../analytics/sentry";

interface GroupContextType {
  groups: StudentGroup[];
  loading: boolean;
  error: string | null;
  loadGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<StudentGroup>;
  updateGroup: (id: string, name: string) => Promise<StudentGroup>;
  deleteGroup: (id: string) => Promise<void>;
  getGroupMembers: () => Promise<{ student_id: string; group_id: string; group_name: string }[]>;
  getStudentGroups: (studentId: string) => Promise<StudentGroup[]>;
  setStudentGroups: (studentId: string, groupIds: string[]) => Promise<void>;
  getGroupStudentIds: (groupId: string) => Promise<string[]>;
  addMemberToGroup: (studentId: string, groupId: string) => Promise<void>;
  removeMemberFromGroup: (studentId: string, groupId: string) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const { loading, error, run, load } = useAsyncState();

  const loadGroups = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const data = await getSchoolGroups(schoolId);
      setGroups(data);
    }, "Failed to load groups");
  }, [schoolId, load]);

  const createGroup = useCallback(
    async (name: string): Promise<StudentGroup> => {
      if (!schoolId) throw new Error("School ID required");
      return run(async () => {
        const created = await apiCreateGroup(schoolId, name);
        setGroups((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        track("group_created");
        return created;
      }, "Failed to create group");
    },
    [schoolId, run],
  );

  const updateGroup = useCallback(
    async (id: string, name: string): Promise<StudentGroup> =>
      run(async () => {
        const updated = await apiUpdateGroup(id, name);
        setGroups((prev) =>
          prev.map((g) => (g.id === id ? updated : g)).sort((a, b) => a.name.localeCompare(b.name)),
        );
        track("group_updated");
        return updated;
      }, "Failed to update group"),
    [run],
  );

  const deleteGroup = useCallback(
    async (id: string): Promise<void> =>
      run(async () => {
        await apiDeleteGroup(id);
        setGroups((prev) => prev.filter((g) => g.id !== id));
        track("group_deleted");
      }, "Failed to delete group"),
    [run],
  );

  const getGroupMembers = useCallback(
    () => {
      if (!schoolId) return Promise.resolve([]);
      return getAllGroupMembersForSchool(schoolId);
    },
    [schoolId],
  );

  const getStudentGroups = useCallback(
    (studentId: string) => apiGetStudentGroups(studentId),
    [],
  );

  const setStudentGroups = useCallback(
    async (studentId: string, groupIds: string[]): Promise<void> => {
      try {
        await apiSetStudentGroups(studentId, groupIds);
      } catch (err) {
        captureException(err, { feature: "groups", action: "setStudentGroups" });
        throw err;
      }
    },
    [],
  );

  const getGroupStudentIds = useCallback(
    (groupId: string) => apiGetGroupStudentIds(groupId),
    [],
  );

  const addMemberToGroup = useCallback(
    async (studentId: string, groupId: string): Promise<void> => {
      try {
        await apiAddMemberToGroup(studentId, groupId);
      } catch (err) {
        captureException(err, { feature: "groups", action: "addMemberToGroup" });
        throw err;
      }
    },
    [],
  );

  const removeMemberFromGroup = useCallback(
    async (studentId: string, groupId: string): Promise<void> => {
      try {
        await apiRemoveMemberFromGroup(studentId, groupId);
      } catch (err) {
        captureException(err, { feature: "groups", action: "removeMemberFromGroup" });
        throw err;
      }
    },
    [],
  );

  useEffect(() => {
    if (schoolId) loadGroups();
  }, [schoolId, loadGroups]);

  return (
    <GroupContext.Provider
      value={{
        groups,
        loading,
        error,
        loadGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        getGroupMembers,
        getStudentGroups,
        setStudentGroups,
        getGroupStudentIds,
        addMemberToGroup,
        removeMemberFromGroup,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGroups = (): GroupContextType => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroups must be used within GroupProvider");
  return ctx;
};
