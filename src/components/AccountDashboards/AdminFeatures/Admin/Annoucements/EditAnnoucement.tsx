import React, { useState, useEffect } from "react";
import { Announcement } from "../../../../../types/user";
import { useAuth } from "../../../../../context/AuthContext";

interface Props {
  announcement: Announcement;
  onCancel: () => void;
  onSave: (announcement: Announcement) => void;
}

const EditAnnouncement: React.FC<Props> = ({ announcement, onCancel, onSave }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);

  useEffect(() => {
    setTitle(announcement.title);
    setContent(announcement.content);
  }, [announcement]);

  const handleSave = () => {
    const updatedAnnouncement = { ...announcement, title, content };
    onSave(updatedAnnouncement);
  };

  return (
    <div>
      <h1>Edit Announcement</h1>
      {user?.role === "admin" ? (
        <form>
          <label>
            Title:
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Content:
            <textarea value={content} onChange={(e) => setContent(e.target.value)} />
          </label>
          <button type="button" onClick={handleSave}>
            Save
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </form>
      ) : (
        <p>You do not have permission to edit announcements.</p>
      )}
    </div>
  );
};

export default EditAnnouncement;
