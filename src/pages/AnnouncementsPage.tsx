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
