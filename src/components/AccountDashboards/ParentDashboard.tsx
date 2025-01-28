import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ParentDashboard = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1>Parent Dashboard: {user?.name}</h1>
      <section>
        <h2>Child Management</h2>
        <ul>
          <li>
            <Link to="/parent/children">View Children</Link>
          </li>
          <li>
            <Link to="/parent/children/progress">View Child Progress</Link>
          </li>
        </ul>
      </section>
      <section>
        <h2>Communication</h2>
        <ul>
          <li>
            <Link to="/parent/messages">View Messages</Link>
          </li>
          <li>
            <Link to="/parent/messages/send">Send Message</Link>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default ParentDashboard;