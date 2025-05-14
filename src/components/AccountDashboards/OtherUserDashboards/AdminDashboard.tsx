import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1>Admin Dashboard: {user?.name}</h1>
      <section>
        <h2>School Management</h2>
        <ul>
          <li>
            <Link to="/admin/school-settings">School Settings</Link>
          </li>
          <li>
            <Link to="/admin/instructor-management">Instructor Management</Link>
          </li>
          <li>
            <Link to="/admin/student-management">Student Management</Link>
          </li>
        </ul>
      </section>
      <section>
        <h2>Announcements</h2>
        <ul>
          <li>
            <Link to="/admin/announcements">Create Announcement</Link>
          </li>
          <li>
            <Link to="/admin/announcements/list">View Announcements</Link>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;
