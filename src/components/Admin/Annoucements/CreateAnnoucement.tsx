import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

const CreateAnnouncement = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Call API to create new announcement
    console.log(`Creating new announcement: ${title} - ${content}`);
  };

  return (
    <div>
      <h1>Create Announcement</h1>
      {user?.role === 'admin' ? (
        <form onSubmit={handleSubmit}>
          <label>
            Title:
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Content:
            <textarea value={content} onChange={(e) => setContent(e.target.value)} />
          </label>
          <button type="submit">Create</button>
        </form>
      ) : (
        <p>You do not have permission to create announcements.</p>
      )}
    </div>
  );
};

export default CreateAnnouncement;