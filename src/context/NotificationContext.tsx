import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { useAsyncState } from "../hooks/useAsyncState";
import {
  getNotificationSettings,
  upsertNotificationSettings,
  NotificationSettings,
  UpsertNotificationSettings,
} from "../api/NotificationRequests/notificationRequests";
import { useSchool } from "./SchoolContext";
import { track } from "../analytics/posthog";

interface NotificationContextType {
  settings: NotificationSettings | null;
  loading: boolean;
  error: string | null;
  saveSettings: (data: UpsertNotificationSettings) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const { loading, error, run, load } = useAsyncState();

  const loadSettings = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const data = await getNotificationSettings(schoolId);
      setSettings(data);
    }, "Failed to load notification settings");
  }, [schoolId, load]);

  const saveSettings = useCallback(
    async (data: UpsertNotificationSettings): Promise<void> => {
      await run(async () => {
        const updated = await upsertNotificationSettings(data);
        setSettings(updated);
        track("notification_settings_saved");
      }, "Failed to save notification settings");
    },
    [run],
  );

  useEffect(() => {
    if (schoolId) loadSettings();
  }, [schoolId, loadSettings]);

  return (
    <NotificationContext.Provider value={{ settings, loading, error, saveSettings }}>
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
