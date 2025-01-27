import { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Event {
  id: number;
  name: string;
}

export const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Fetch upcoming events and recent discussions from the API
    fetch("/api/events")
      .then((response) => response.json())
      .then((data) => setEvents(data));
  }, []);

  return (
    <div className="mx-auto p-4 pt-6 bg-white text-black">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
      </header>
      <nav className="flex justify-between items-center mb-4">
        <ul className="flex space-x-4">
          <li>
            <Link to="/discussion-boards" className="text-blue-500 hover:text-blue-700">
              Discussion Boards
            </Link>
          </li>
          <li>
            <Link to="/notifications" className="text-blue-500 hover:text-blue-700">
              Notifications
            </Link>
          </li>
          <li>
            <Link to="/profile" className="text-blue-500 hover:text-blue-700">
              Profile Management
            </Link>
          </li>
        </ul>
      </nav>
      <main className="grid grid-cols-1 gap-4">
        <section className="bg-white rounded shadow-md p-4">
          <h2 className="text-2xl font-bold mb-2">Upcoming Events</h2>
          <ul>
            {events.map((event) => (
              <li key={event.id}>{event.name}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};
