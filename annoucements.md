# Announcements Feature Setup

Follow every step in order. Do not skip steps or combine them.

---

## Step 1 — Supabase SQL

Open your Supabase dashboard → SQL Editor → paste and run the following:

```sql
CREATE TABLE announcements (
  announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  pinned          BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_school ON announcements(school_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School members can view announcements"
  ON announcements FOR SELECT
  USING (
    school_id IN (
      SELECT id FROM schools WHERE admin_id = auth.uid()
      UNION
      SELECT school_id FROM students WHERE id = auth.uid()
      UNION
      SELECT school_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and instructors can manage announcements"
  ON announcements FOR ALL
  USING (
    school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid())
    OR
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  )
  WITH CHECK (
    school_id IN (SELECT id FROM schools WHERE admin_id = auth.uid())
    OR
    school_id IN (
      SELECT school_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'instructor')
    )
  );

CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_announcements_updated_at();
```

---

## Step 2 — Create `src/types/announcements.ts`

```typescript
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
```

---

## Step 3 — Create `src/api/AnnouncementRequests/announcementRequests.ts`

```typescript
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
```

---

## Step 4 — Create `src/context/AnnouncementContext.tsx`

```typescript
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
```

---

## Step 5 — Create `src/pages/AnnouncementsPage.tsx`

```typescript
import { useState } from "react";
import { useAnnouncements } from "../context/AnnouncementContext";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";
import { AppFormModal, AppConfirmModal, ModalField } from "../components/ui/modal";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Pin, Pencil, Trash2, Plus, Megaphone } from "lucide-react";
import { Announcement } from "../types/announcements";

type AnnouncementForm = { title: string; content: string; pinned: boolean };
const emptyForm = (): AnnouncementForm => ({ title: "", content: "", pinned: false });

const canManage = (role?: string) =>
  role === UserRole.Admin || role === UserRole.Instructor;

export const AnnouncementsPage = () => {
  const { announcements, loading, error, createAnnouncement, updateAnnouncement, deleteAnnouncement } =
    useAnnouncements();
  const { user } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AnnouncementForm>(emptyForm());
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [editForm, setEditForm] = useState<AnnouncementForm>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) { setCreateError("Title is required."); return; }
    if (!createForm.content.trim()) { setCreateError("Content is required."); return; }
    setCreateLoading(true);
    try {
      await createAnnouncement({
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        pinned: createForm.pinned,
        created_by: user?.id ?? "",
        created_by_name: user?.name ?? "Unknown",
      });
      setCreateOpen(false);
      setCreateForm(emptyForm());
      setCreateError(null);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (a: Announcement) => {
    setEditTarget(a);
    setEditForm({ title: a.title, content: a.content, pinned: a.pinned });
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.title.trim()) { setEditError("Title is required."); return; }
    if (!editForm.content.trim()) { setEditError("Content is required."); return; }
    setEditLoading(true);
    try {
      await updateAnnouncement(editTarget.announcement_id, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        pinned: editForm.pinned,
      });
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteAnnouncement(deleteTarget.announcement_id);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const manage = canManage(user?.role);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Announcements</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            School-wide updates visible to all members.
          </p>
        </div>
        {manage && (
          <Button
            size="sm"
            onClick={() => { setCreateForm(emptyForm()); setCreateError(null); setCreateOpen(true); }}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} /> New Announcement
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading && announcements.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Megaphone size={22} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-gray-700">No announcements yet</p>
          <p className="text-xs text-gray-400 mt-1">
            {manage ? "Create one to get started." : "Check back soon."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <div
              key={a.announcement_id}
              className={`bg-white rounded-xl border p-5 ${
                a.pinned ? "border-primary/30 shadow-sm" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  {a.pinned && (
                    <Pin size={14} className="text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.created_by_name} ·{" "}
                      {new Date(a.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {manage && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(a)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(a)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">
                {a.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <AppFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Announcement"
        size="default"
        onSubmit={handleCreate}
        submitLabel="Post Announcement"
        loading={createLoading}
        error={createError}
      >
        <ModalField label="Title" required htmlFor="ann-title">
          <Input
            id="ann-title"
            placeholder="e.g., Belt test this Saturday"
            value={createForm.title}
            onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Content" required htmlFor="ann-content">
          <Textarea
            id="ann-content"
            rows={5}
            placeholder="Write your announcement here..."
            value={createForm.content}
            onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))}
          />
        </ModalField>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={createForm.pinned}
            onChange={(e) => setCreateForm((f) => ({ ...f, pinned: e.target.checked }))}
            className="h-4 w-4 accent-primary rounded"
          />
          <span className="text-sm font-medium text-gray-700">Pin this announcement</span>
        </label>
      </AppFormModal>

      <AppFormModal
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        title="Edit Announcement"
        size="default"
        onSubmit={handleEdit}
        submitLabel="Save Changes"
        loading={editLoading}
        error={editError}
      >
        <ModalField label="Title" required htmlFor="edit-ann-title">
          <Input
            id="edit-ann-title"
            placeholder="e.g., Belt test this Saturday"
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Content" required htmlFor="edit-ann-content">
          <Textarea
            id="edit-ann-content"
            rows={5}
            placeholder="Write your announcement here..."
            value={editForm.content}
            onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
          />
        </ModalField>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editForm.pinned}
            onChange={(e) => setEditForm((f) => ({ ...f, pinned: e.target.checked }))}
            className="h-4 w-4 accent-primary rounded"
          />
          <span className="text-sm font-medium text-gray-700">Pin this announcement</span>
        </label>
      </AppFormModal>

      <AppConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open && !deleteLoading) setDeleteTarget(null); }}
        title="Delete Announcement?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
        confirmLabel="Delete"
      />
    </div>
  );
};
```

---

## Step 6 — Edit `src/components/MainDashboard/MainDashboard.tsx`

### 6a — Add import near the top with the other page imports:

```typescript
import { AnnouncementsPage } from "../../pages/AnnouncementsPage";
```

### 6b — Add to the `VIEW_COMPONENTS` object:

```typescript
announcements: AnnouncementsPage,
```

### 6c — Add to the `VIEW_TITLES` object:

```typescript
announcements: "Announcements",
```

---

## Step 7 — Edit `src/components/MainDashboard/SideBar.tsx`

### 7a — Add `Megaphone` to the lucide-react import:

```typescript
import {
  // ...existing icons...
  Megaphone,
} from "lucide-react";
```

### 7b — Add to the MANAGEMENT section's `items` array (after the School Profile entry):

```typescript
{
  icon: Megaphone,
  label: "Announcements",
  view: "announcements",
},
```

---

## Step 8 — Edit `src/pages/Dashboard.tsx`

### 8a — Add import:

```typescript
import { AnnouncementProvider } from "../context/AnnouncementContext";
```

### 8b — Wrap `<MainDashboard />` with the provider inside the Admin case. The final provider stack should look like this:

```typescript
case UserRole.Admin:
  return (
    <SchoolProvider>
      <ProgramProvider>
        <StudentRenewalsProvider>
          <AttendanceProvider>
            <ClassProvider>
              <BeltProvider>
                <InventoryProvider>
                  <AnnouncementProvider>
                    <MainDashboard />
                  </AnnouncementProvider>
                </InventoryProvider>
              </BeltProvider>
            </ClassProvider>
          </AttendanceProvider>
        </StudentRenewalsProvider>
      </ProgramProvider>
    </SchoolProvider>
  );
```

---

## Verification checklist

After completing all steps, confirm:

- [ ] SQL ran without errors in Supabase
- [ ] `src/types/announcements.ts` exists
- [ ] `src/api/AnnouncementRequests/announcementRequests.ts` exists
- [ ] `src/context/AnnouncementContext.tsx` exists
- [ ] `src/pages/AnnouncementsPage.tsx` exists
- [ ] `MainDashboard.tsx` has `announcements` in both `VIEW_COMPONENTS` and `VIEW_TITLES`
- [ ] `SideBar.tsx` has `Megaphone` imported and the Announcements nav item added
- [ ] `Dashboard.tsx` has `AnnouncementProvider` wrapping `MainDashboard`
- [ ] App compiles with no TypeScript errors (`tsc --noEmit`)
- [ ] Announcements appears in the sidebar under Management
- [ ] Admin can create, edit, pin, and delete announcements
- [ ] Non-admin users see announcements but have no create/edit/delete buttons
