import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest } from "../types/announcements";
import {
  getAnnouncements,
  createAnnouncement as apiCreate,
  updateAnnouncement as apiUpdate,
  deleteAnnouncement as apiDelete,
} from "../api/AnnouncementRequests/announcementRequests";
import { useSchool } from "./SchoolContext";

interface AnnouncementContextType {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  loadAnnouncements: () => Promise<void>;
  createAnnouncement: (req: Omit<CreateAnnouncementRequest, "school_id">) => Promise<void>;
  updateAnnouncement: (id: string, updates: UpdateAnnouncementRequest) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

export const AnnouncementProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const { loading, error, run, load } = useAsyncState();

  const loadAnnouncements = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const data = await getAnnouncements(schoolId);
      setAnnouncements(data);
    }, "Failed to load announcements");
  }, [schoolId, load]);

  const createAnnouncement = useCallback(
    async (req: Omit<CreateAnnouncementRequest, "school_id">) => {
      if (!schoolId) throw new Error("School ID required");
      await run(async () => {
        const newItem = await apiCreate({ ...req, school_id: schoolId });
        setAnnouncements((prev) =>
          [newItem, ...prev].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
        );
      }, "Failed to create announcement");
    },
    [schoolId, run],
  );

  const updateAnnouncement = useCallback(
    async (id: string, updates: UpdateAnnouncementRequest) => {
      await run(async () => {
        const updated = await apiUpdate(id, updates);
        setAnnouncements((prev) =>
          prev
            .map((a) => (a.announcement_id === id ? updated : a))
            .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
        );
      }, "Failed to update announcement");
    },
    [run],
  );

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      await run(async () => {
        await apiDelete(id);
        setAnnouncements((prev) => prev.filter((a) => a.announcement_id !== id));
      }, "Failed to delete announcement");
    },
    [run],
  );

  useEffect(() => {
    if (schoolId) loadAnnouncements();
  }, [schoolId, loadAnnouncements]);

  return (
    <AnnouncementContext.Provider
      value={{
        announcements,
        loading,
        error,
        loadAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = (): AnnouncementContextType => {
  const ctx = useContext(AnnouncementContext);
  if (!ctx) throw new Error("useAnnouncements must be used within AnnouncementProvider");
  return ctx;
};
