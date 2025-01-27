import { Link } from 'react-router-dom';

const InstructorDashboard = () => {
  return (
    <div>
      <h1>Instructor Dashboard</h1>
      <section>
        <h2>Class Management</h2>
        <ul>
          <li>
            <Link to="/instructor/classes">View Classes</Link>
          </li>
          <li>
            <Link to="/instructor/classes/create">Create Class</Link>
          </li>
        </ul>
      </section>
      <section>
        <h2>Student Management</h2>
        <ul>
          <li>
            <Link to="/instructor/students">View Students</Link>
          </li>
          <li>
            <Link to="/instructor/students/progress">View Student Progress</Link>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default InstructorDashboard;