import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1>Student Dashboard: {user?.name}</h1>
      <section>
        <h2>Class Schedule</h2>
        <ul>
          <li>
            <Link to="/student/classes">View Classes</Link>
          </li>
        </ul>
      </section>
      <section>
        <h2>Progress Tracking</h2>
        <ul>
          <li>
            <Link to="/student/progress">View Progress</Link>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default StudentDashboard;