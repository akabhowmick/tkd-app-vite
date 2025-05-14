import { Announcement } from "../../../../../types/user";
import { announcements } from "../../../../dummyInfo";
import { SingleAnnouncement } from "./SingleAnnouncement";

const AnnouncementList = () => {
  const handleDelete = (announcementId: number) => {
    // Call API to delete announcement
    console.log(`Deleting announcement ${announcementId}`);
  };

  const handleEdit = (announcement: Announcement) => {
    // Call API to update announcement
    console.log(`Updating announcement ${announcement.id}`);
  };

  return (
    <div>
      <h1>Announcements</h1>
      <ul>
        {announcements.map((announcement) => (
          <li key={announcement.id}>
            <SingleAnnouncement
              announcement={announcement}
              onDelete={() => handleDelete(announcement.id)}
              onEdit={handleEdit}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnnouncementList;