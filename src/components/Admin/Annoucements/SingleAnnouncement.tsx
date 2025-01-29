import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Announcement } from '../../../types/user';


interface Props {
  announcement: Announcement;
  onDelete: () => void;
  onEdit: (announcement: Announcement) => void;
}

export const SingleAnnouncement: React.FC<Props> = ({
  announcement,
  onDelete,
  onEdit,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);

  useEffect(() => {
    setTitle(announcement.title);
    setContent(announcement.content);
  }, [announcement]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedAnnouncement = { ...announcement, title, content };
    onEdit(updatedAnnouncement);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete();
  };

  if (isEditing) {
    return (
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleSave}>Save</button>
      </div>
    );
  }

  return (
    <div>
      <h2>{announcement.title}</h2>
      <p>{announcement.content}</p>
      {user?.role === 'admin' && (
        <div>
          <button onClick={handleEdit}>Edit</button>
          <button onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
};
