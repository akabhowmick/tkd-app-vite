import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getAnnouncements(schoolId);
      setAnnouncements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const createAnnouncement = useCallback(
    async (req: Omit<CreateAnnouncementRequest, "school_id">) => {
      if (!schoolId) throw new Error("School ID required");
      try {
        setError(null);
        const newItem = await apiCreate({ ...req, school_id: schoolId });
        setAnnouncements((prev) => {
          const updated = [newItem, ...prev];
          return updated.sort((a, b) => Number(b.pinned) - Number(a.pinned));
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create announcement";
        setError(msg);
        throw err;
      }
    },
    [schoolId]
  );

  const updateAnnouncement = useCallback(
    async (id: string, updates: UpdateAnnouncementRequest) => {
      try {
        setError(null);
        const updated = await apiUpdate(id, updates);
        setAnnouncements((prev) =>
          prev
            .map((a) => (a.announcement_id === id ? updated : a))
            .sort((a, b) => Number(b.pinned) - Number(a.pinned))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update announcement";
        setError(msg);
        throw err;
      }
    },
    []
  );

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      setError(null);
      await apiDelete(id);
      setAnnouncements((prev) => prev.filter((a) => a.announcement_id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete announcement";
      setError(msg);
      throw err;
    }
  }, []);

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
