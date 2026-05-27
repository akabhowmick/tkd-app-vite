import { useEffect, useState } from "react";
import { useAnnouncements } from "../context/AnnouncementContext";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";
import { AppConfirmModal } from "../components/ui/modal";
import { Button } from "../components/ui/button";
import { Pin, Pencil, Trash2, Plus, Megaphone, X, Check } from "lucide-react";
import { Announcement } from "../types/announcements";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const canManage = (role?: string) => role === UserRole.Admin || role === UserRole.Instructor;

type AnnouncementForm = { title: string; content: string; pinned: boolean };
const emptyForm = (): AnnouncementForm => ({ title: "", content: "", pinned: false });
const formFromAnnouncement = (a: Announcement): AnnouncementForm => ({
  title: a.title, content: a.content, pinned: a.pinned,
});

export const AnnouncementsPage = () => {
  const { announcements, loading, error, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const { user } = useAuth();

  // new announcement panel
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState<AnnouncementForm>(emptyForm());
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  // edit announcement (inline in card)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AnnouncementForm>(emptyForm());
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const manage = canManage(user?.role);

  const openNew = () => { setNewForm(emptyForm()); setNewError(null); setNewOpen(true); setEditingId(null); };
  const closeNew = () => { setNewOpen(false); setNewError(null); };

  const openEdit = (a: Announcement) => {
    setEditingId(a.announcement_id);
    setEditForm(formFromAnnouncement(a));
    setEditError(null);
    setNewOpen(false);
  };
  const closeEdit = () => { setEditingId(null); setEditError(null); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewError(null);
    if (!newForm.title.trim()) return setNewError("Title is required.");
    if (!newForm.content.trim()) return setNewError("Content is required.");
    setNewLoading(true);
    try {
      await createAnnouncement({
        title: newForm.title.trim(),
        content: newForm.content.trim(),
        pinned: newForm.pinned,
        created_by: user?.id ?? "",
        created_by_name: user?.name ?? "Unknown",
      });
      closeNew();
    } catch (err) {
      setNewError(err instanceof Error ? err.message : "Failed to create announcement.");
    } finally {
      setNewLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError(null);
    if (!editForm.title.trim()) return setEditError("Title is required.");
    if (!editForm.content.trim()) return setEditError("Content is required.");
    setEditLoading(true);
    try {
      await updateAnnouncement(editingId, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        pinned: editForm.pinned,
      });
      closeEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update announcement.");
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

  // auto-close edit if the announcement is deleted
  useEffect(() => {
    if (editingId && !announcements.find((a) => a.announcement_id === editingId)) {
      closeEdit();
    }
  }, [announcements, editingId]);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-600 mt-0.5">School-wide updates visible to all members.</p>
        </div>
        {manage && !newOpen && (
          <Button size="sm" onClick={openNew} className="flex items-center gap-1.5">
            <Plus size={14} /> New Announcement
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Inline new announcement form */}
      {newOpen && (
        <div className="bg-white border border-blue-200 rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-800">New Announcement</h3>
            <button onClick={closeNew} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g., Belt test this Saturday"
                value={newForm.title}
                onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Content <span className="text-red-500">*</span></label>
              <Textarea
                rows={4}
                placeholder="Write your announcement here..."
                value={newForm.content}
                onChange={(e) => setNewForm((f) => ({ ...f, content: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newForm.pinned}
                onChange={(e) => setNewForm((f) => ({ ...f, pinned: e.target.checked }))}
                className="h-4 w-4 accent-primary rounded"
              />
              <span className="text-sm font-medium text-gray-700">Pin this announcement</span>
            </label>
            {newError && <p className="text-sm text-red-600">{newError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={closeNew}>Cancel</Button>
              <Button type="submit" size="sm" disabled={newLoading}>
                {newLoading ? "Posting…" : "Post Announcement"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Announcement list */}
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
          {announcements.map((a) => {
            const isEditing = editingId === a.announcement_id;
            return (
              <div
                key={a.announcement_id}
                className={`bg-white rounded-xl border p-5 ${
                  a.pinned ? "border-primary/30 shadow-sm" : "border-gray-200"
                }`}
              >
                {isEditing ? (
                  /* Inline edit form */
                  <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Editing</span>
                      <button type="button" onClick={closeEdit} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Content <span className="text-red-500">*</span></label>
                      <Textarea
                        rows={4}
                        value={editForm.content}
                        onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.pinned}
                        onChange={(e) => setEditForm((f) => ({ ...f, pinned: e.target.checked }))}
                        className="h-4 w-4 accent-primary rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Pin this announcement</span>
                    </label>
                    {editError && <p className="text-sm text-red-600">{editError}</p>}
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={closeEdit}>Cancel</Button>
                      <Button type="submit" size="sm" disabled={editLoading}>
                        {editLoading ? "Saving…" : <><Check size={13} className="mr-1" />Save Changes</>}
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* Normal card view */
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        {a.pinned && <Pin size={14} className="text-primary shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 leading-snug">{a.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {a.created_by_name} ·{" "}
                            {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

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
