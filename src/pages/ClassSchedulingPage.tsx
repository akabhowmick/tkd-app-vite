import { useState } from "react";
import { useClasses } from "../context/ClassContext";
import { AgeGroup, ClassWithSessions, SessionType } from "../types/classes";
import Swal from "sweetalert2";
import { FaPlus, FaEdit, FaTrash, FaClock, FaUsers } from "react-icons/fa";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CLASS_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export const ClassSchedulingPage = () => {
  const { classes, loading, createClass, updateClass, deleteClass, createSession, deleteSession } = useClasses();
  const [selectedClass, setSelectedClass] = useState<ClassWithSessions | null>(null);

  const handleCreateClass = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Create New Class",
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Class Name</label>
            <input id="class-name" class="swal2-input" placeholder="e.g., Kids Beginners" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Age Group</label>
            <select id="age-group" class="swal2-input" style="margin:4px 0 0 0;padding:8px">
              <option value="Kids">Kids</option>
              <option value="Adults">Adults</option>
              <option value="All">All</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Instructor</label>
            <input id="instructor" class="swal2-input" placeholder="e.g., Master Lee" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Color</label>
            <select id="color" class="swal2-input" style="margin:4px 0 0 0;padding:8px">
              ${CLASS_COLORS.map((c) => `<option value="${c}" style="background:${c};color:white">${c}</option>`).join("")}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Create",
      confirmButtonColor: "#3b82f6",
      preConfirm: () => ({
        class_name: (document.getElementById("class-name") as HTMLInputElement).value,
        age_group: (document.getElementById("age-group") as HTMLSelectElement).value as AgeGroup,
        instructor: (document.getElementById("instructor") as HTMLInputElement).value,
        color: (document.getElementById("color") as HTMLSelectElement).value,
      }),
    });

    if (formValues) {
      try {
        await createClass(formValues);
        Swal.fire("Success!", "Class created successfully", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to create class", "error");
      }
    }
  };

  const handleAddSession = async (classId: string, className: string) => {
    const { value: sessionType } = await Swal.fire({
      title: `Add Session to ${className}`,
      input: "select",
      inputOptions: {
        recurring: "Recurring (Weekly)",
        "one-off": "One-off Session",
      },
      inputPlaceholder: "Select session type",
      showCancelButton: true,
    });

    if (!sessionType) return;

    if (sessionType === "recurring") {
      const { value: formValues } = await Swal.fire({
        title: "Recurring Session",
        html: `
          <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
            <div>
              <label style="font-size:0.875rem;font-weight:600;color:#374151">Day of Week</label>
              <select id="day-week" class="swal2-input" style="margin:4px 0 0 0;padding:8px">
                ${DAYS_OF_WEEK.map((day, idx) => `<option value="${idx}">${day}</option>`).join("")}
              </select>
            </div>
            <div>
              <label style="font-size:0.875rem;font-weight:600;color:#374151">Start Time</label>
              <input id="start-time" type="time" class="swal2-input" style="margin:4px 0 0 0;padding:8px"/>
            </div>
            <div>
              <label style="font-size:0.875rem;font-weight:600;color:#374151">End Time</label>
              <input id="end-time" type="time" class="swal2-input" style="margin:4px 0 0 0;padding:8px"/>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Add Session",
        confirmButtonColor: "#3b82f6",
        preConfirm: () => ({
          day_of_week: parseInt((document.getElementById("day-week") as HTMLSelectElement).value),
          start_time: (document.getElementById("start-time") as HTMLInputElement).value,
          end_time: (document.getElementById("end-time") as HTMLInputElement).value,
        }),
      });

      if (formValues) {
        try {
          await createSession({
            class_id: classId,
            session_type: "recurring" as SessionType,
            ...formValues,
          });
          Swal.fire("Success!", "Session added successfully", "success");
        } catch (err) {
          Swal.fire("Error", err instanceof Error ? err.message : "Failed to add session", "error");
        }
      }
    } else {
      const { value: formValues } = await Swal.fire({
        title: "One-off Session",
        html: `
          <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
            <div>
              <label style="font-size:0.875rem;font-weight:600;color:#374151">Date</label>
              <input id="specific-date" type="date" class="swal2-input" style="margin:4px 0 0 0;padding:8px"/>
            </div>
            <div>
              <label style="font-size:0.875rem;font-weight:600;color:#374151">Start Time</label>
              <input id="start-time" type="time" class="swal2-input" style="margin:4px 0 0 0;padding:8px"/>
            </div>
            <div>
              <label style="font-size:0.875rem;font-weight:600;color:#374151">End Time</label>
              <input id="end-time" type="time" class="swal2-input" style="margin:4px 0 0 0;padding:8px"/>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Add Session",
        confirmButtonColor: "#3b82f6",
        preConfirm: () => ({
          specific_date: (document.getElementById("specific-date") as HTMLInputElement).value,
          start_time: (document.getElementById("start-time") as HTMLInputElement).value,
          end_time: (document.getElementById("end-time") as HTMLInputElement).value,
        }),
      });

      if (formValues) {
        try {
          await createSession({
            class_id: classId,
            session_type: "one-off" as SessionType,
            ...formValues,
          });
          Swal.fire("Success!", "Session added successfully", "success");
        } catch (err) {
          Swal.fire("Error", err instanceof Error ? err.message : "Failed to add session", "error");
        }
      }
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    const result = await Swal.fire({
      title: "Delete Class?",
      text: `Are you sure you want to delete "${className}"? All sessions will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        await deleteClass(classId);
        Swal.fire("Deleted!", "Class deleted successfully", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to delete class", "error");
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const result = await Swal.fire({
      title: "Delete Session?",
      text: "Are you sure you want to delete this session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        await deleteSession(sessionId);
        Swal.fire("Deleted!", "Session deleted successfully", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to delete session", "error");
      }
    }
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading classes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Class Scheduling</h1>
          <button
            onClick={handleCreateClass}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus /> New Class
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FaUsers className="mx-auto text-gray-300 text-5xl mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Classes Yet</h2>
            <p className="text-gray-500 mb-4">Create your first class to get started with scheduling</p>
            <button
              onClick={handleCreateClass}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Class
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
              <div key={cls.class_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-2" style={{ backgroundColor: cls.color }} />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{cls.class_name}</h3>
                      <p className="text-sm text-gray-500">{cls.instructor}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteClass(cls.class_id, cls.class_name)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {cls.age_group}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <FaClock className="text-gray-400" /> Sessions ({cls.sessions.length})
                    </h4>
                    {cls.sessions.length === 0 ? (
                      <p className="text-xs text-gray-400">No sessions scheduled</p>
                    ) : (
                      <div className="space-y-1">
                        {cls.sessions.map((session) => (
                          <div
                            key={session.session_id}
                            className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs"
                          >
                            <span>
                              {session.session_type === "recurring"
                                ? `${DAYS_OF_WEEK[session.day_of_week!]} ${session.start_time}-${session.end_time}`
                                : `${session.specific_date} ${session.start_time}-${session.end_time}`}
                            </span>
                            <button
                              onClick={() => handleDeleteSession(session.session_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddSession(cls.class_id, cls.class_name)}
                    className="w-full bg-blue-50 text-blue-600 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    + Add Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
