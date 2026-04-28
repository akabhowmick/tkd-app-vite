import { useState, useEffect } from "react";
import { useAnnouncements } from "../../../../context/AnnouncementContext";
import { useAuth } from "../../../../context/AuthContext";
import { Announcement } from "../../../../types/announcements";
import { AppFormModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";

type AnnouncementForm = { title: string; content: string; pinned: boolean };
const emptyForm = (): AnnouncementForm => ({ title: "", content: "", pinned: false });

// null = closed, "new" = create mode, Announcement = edit mode
export type AnnouncementFormTarget = Announcement | "new" | null;

type Props = {
  target: AnnouncementFormTarget;
  onClose: () => void;
};

export const AnnouncementFormModal = ({ target, onClose }: Props) => {
  const { createAnnouncement, updateAnnouncement } = useAnnouncements();
  const { user } = useAuth();
  const [form, setForm] = useState<AnnouncementForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = target !== null && target !== "new";

  useEffect(() => {
    if (!target) return;
    if (target === "new") {
      setForm(emptyForm());
    } else {
      setForm({ title: target.title, content: target.content, pinned: target.pinned });
    }
    setError(null);
  }, [target]);

  const set = <K extends keyof AnnouncementForm>(k: K, v: AnnouncementForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.content.trim()) return setError("Content is required.");
    setLoading(true);
    try {
      if (isEdit) {
        await updateAnnouncement((target as Announcement).announcement_id, {
          title: form.title.trim(),
          content: form.content.trim(),
          pinned: form.pinned,
        });
      } else {
        await createAnnouncement({
          title: form.title.trim(),
          content: form.content.trim(),
          pinned: form.pinned,
          created_by: user?.id ?? "",
          created_by_name: user?.name ?? "Unknown",
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFormModal
      open={!!target}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={isEdit ? "Edit Announcement" : "New Announcement"}
      size="default"
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Save Changes" : "Post Announcement"}
      loading={loading}
      error={error}
    >
      <ModalField label="Title" required htmlFor="ann-title">
        <Input
          id="ann-title"
          placeholder="e.g., Belt test this Saturday"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </ModalField>
      <ModalField label="Content" required htmlFor="ann-content">
        <Textarea
          id="ann-content"
          rows={5}
          placeholder="Write your announcement here..."
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
        />
      </ModalField>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.pinned}
          onChange={(e) => set("pinned", e.target.checked)}
          className="h-4 w-4 accent-primary rounded"
        />
        <span className="text-sm font-medium text-gray-700">Pin this announcement</span>
      </label>
    </AppFormModal>
  );
};
