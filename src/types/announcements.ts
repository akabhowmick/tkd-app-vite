export interface Announcement {
  announcement_id: string;
  school_id: string;
  title: string;
  content: string;
  created_by: string;
  created_by_name: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnouncementRequest {
  school_id: string;
  title: string;
  content: string;
  created_by: string;
  created_by_name: string;
  pinned?: boolean;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  pinned?: boolean;
}
