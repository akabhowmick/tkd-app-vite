import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const RegDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="bg-gray-300 antialiased min-h-screen flex items-center justify-center p-4">
      <div className="bg-white relative shadow rounded-lg w-full max-w-3xl">
        {/* Profile Picture */}
        <div className="flex justify-center">
          <img
            src={user?.profilePicture || "https://via.placeholder.com/150"}
            alt="Profile"
            className="rounded-full mx-auto absolute -top-16 w-32 h-32 shadow-md border-4 border-white transition duration-200 transform hover:scale-110"
          />
        </div>

        {/* User Info */}
        <div className="mt-16 text-center">
          <h1 className="font-bold text-3xl text-gray-900">{user?.name || "Admin"}</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-sm font-medium text-gray-400">Taekwondo School Administrator</p>
        </div>

        {/* School Management & Announcements */}
        <div className="my-5 px-6">
          <h2 className="text-lg font-bold text-gray-900">School Management</h2>
          <ul className="mt-2 space-y-2">
            <li>
              <Link
                to="/admin/school-settings"
                className="block text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-md"
              >
                🏫 School Settings
              </Link>
            </li>
            <li>
              <Link
                to="/admin/instructor-management"
                className="block text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-md"
              >
                🧑‍🏫 Instructor Management
              </Link>
            </li>
            <li>
              <Link
                to="/admin/student-management"
                className="block text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-md"
              >
                🥋 Student Management
              </Link>
            </li>
          </ul>
        </div>

        {/* Announcements Section */}
        <div className="my-5 px-6">
          <h2 className="text-lg font-bold text-gray-900">Announcements</h2>
          <ul className="mt-2 space-y-2">
            <li>
              <Link
                to="/admin/announcements"
                className="block text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-md"
              >
                📢 Create Announcement
              </Link>
            </li>
            <li>
              <Link
                to="/admin/announcements/list"
                className="block text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-md"
              >
                📝 View Announcements
              </Link>
            </li>
          </ul>
        </div>

        {/* Recent Activities */}
        <div className="w-full px-6">
          <h3 className="font-medium text-gray-900 text-left">Recent Activities</h3>
          <div className="mt-5 flex flex-col space-y-2 text-sm">
            <div className="border-t border-gray-100 py-4 text-gray-600 hover:bg-gray-100 px-4 rounded-md transition duration-150">
              🟢 <strong>{user?.name || "Admin"}</strong> updated school settings
              <span className="text-gray-500 text-xs block">24 min ago</span>
            </div>
            <div className="border-t border-gray-100 py-4 text-gray-600 hover:bg-gray-100 px-4 rounded-md transition duration-150">
              📢 Posted a new announcement
              <span className="text-gray-500 text-xs block">42 min ago</span>
            </div>
            <div className="border-t border-gray-100 py-4 text-gray-600 hover:bg-gray-100 px-4 rounded-md transition duration-150">
              🏆 Added new rank for students
              <span className="text-gray-500 text-xs block">1 day ago</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm my-4">
          &copy; 2024 Taekwondo School Admin Dashboard
        </div>
      </div>
    </div>
  );
};
