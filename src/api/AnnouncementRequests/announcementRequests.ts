import { supabase } from "../supabase";
import {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from "../../types/announcements";

export async function getAnnouncements(schoolId: string): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("school_id", schoolId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAnnouncement(req: CreateAnnouncementRequest): Promise<Announcement> {
  const { data, error } = await supabase.from("announcements").insert(req).select().single();

  if (error) throw error;
  return data;
}

export async function updateAnnouncement(
  announcementId: string,
  updates: UpdateAnnouncementRequest,
): Promise<Announcement> {
  const { data, error } = await supabase
    .from("announcements")
    .update(updates)
    .eq("announcement_id", announcementId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("announcement_id", announcementId);

  if (error) throw error;
}
