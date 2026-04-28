import { useState } from "react";
import { useAnnouncements } from "../context/AnnouncementContext";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/user";
import { AppConfirmModal } from "../components/ui/modal";
import { Button } from "../components/ui/button";
import { Pin, Pencil, Trash2, Plus, Megaphone } from "lucide-react";
import { Announcement } from "../types/announcements";
import {
  AnnouncementFormModal,
  AnnouncementFormTarget,
} from "../components/AccountDashboards/AdminFeatures/Announcements/AnnouncementFormModal";

const canManage = (role?: string) => role === UserRole.Admin || role === UserRole.Instructor;

export const AnnouncementsPage = () => {
  const { announcements, loading, error, deleteAnnouncement } = useAnnouncements();
  const { user } = useAuth();
  const [formTarget, setFormTarget] = useState<AnnouncementFormTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
            onClick={() => setFormTarget("new")}
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
                  {a.pinned && <Pin size={14} className="text-primary shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 leading-snug">{a.title}</h3>
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
                      onClick={() => setFormTarget(a)}
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

      <AnnouncementFormModal target={formTarget} onClose={() => setFormTarget(null)} />

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
