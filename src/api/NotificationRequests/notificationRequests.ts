import { supabase } from "../supabase";

export type ReminderWindow = 7 | 14 | 30;

export interface NotificationSettings {
  id: string;
  school_id: string;
  reminders_enabled: boolean;
  reminder_days: ReminderWindow[];
  send_to_admin: boolean;
  send_to_parent: boolean;
  created_at: string;
  updated_at: string;
}

export type UpsertNotificationSettings = Pick<
  NotificationSettings,
  "school_id" | "reminders_enabled" | "reminder_days" | "send_to_admin" | "send_to_parent"
>;

export async function getNotificationSettings(
  schoolId: string,
): Promise<NotificationSettings | null> {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("school_id", schoolId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertNotificationSettings(
  settings: UpsertNotificationSettings,
): Promise<NotificationSettings> {
  const { data, error } = await supabase
    .from("notification_settings")
    .upsert(settings, { onConflict: "school_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}
