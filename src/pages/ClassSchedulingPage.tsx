import { useState } from "react";
import { useClasses } from "../context/ClassContext";
import { FaPlus, FaTrash, FaClock, FaUsers } from "react-icons/fa";
import { AppConfirmModal } from "../components/ui/modal";
import { CreateClassModal } from "../components/AccountDashboards/AdminFeatures/ClassScheduling/CreateClassModal";
import { AddSessionModal } from "../components/AccountDashboards/AdminFeatures/ClassScheduling/AddSessionModal";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const ClassSchedulingPage = () => {
  const { classes, loading, deleteClass, deleteSession } = useClasses();
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [addSessionTarget, setAddSessionTarget] = useState<{
    classId: string;
    className: string;
  } | null>(null);

  const [deleteClassConfirm, setDeleteClassConfirm] = useState<{
    open: boolean;
    classId: string;
    className: string;
    loading: boolean;
  }>({ open: false, classId: "", className: "", loading: false });

  const [deleteSessionConfirm, setDeleteSessionConfirm] = useState<{
    open: boolean;
    sessionId: string;
    loading: boolean;
  }>({ open: false, sessionId: "", loading: false });

  const handleDeleteClass = async () => {
    setDeleteClassConfirm((s) => ({ ...s, loading: true }));
    try {
      await deleteClass(deleteClassConfirm.classId);
    } finally {
      setDeleteClassConfirm({ open: false, classId: "", className: "", loading: false });
    }
  };

  const handleDeleteSession = async () => {
    setDeleteSessionConfirm((s) => ({ ...s, loading: true }));
    try {
      await deleteSession(deleteSessionConfirm.sessionId);
    } finally {
      setDeleteSessionConfirm({ open: false, sessionId: "", loading: false });
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
            onClick={() => setClassModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus /> New Class
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FaUsers className="mx-auto text-gray-300 text-5xl mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Classes Yet</h2>
            <p className="text-gray-500 mb-4">
              Create your first class to get started with scheduling
            </p>
            <button
              onClick={() => setClassModalOpen(true)}
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
                    <button
                      onClick={() =>
                        setDeleteClassConfirm({
                          open: true,
                          classId: cls.class_id,
                          className: cls.class_name,
                          loading: false,
                        })
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
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
                              onClick={() =>
                                setDeleteSessionConfirm({
                                  open: true,
                                  sessionId: session.session_id,
                                  loading: false,
                                })
                              }
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
                    onClick={() =>
                      setAddSessionTarget({ classId: cls.class_id, className: cls.class_name })
                    }
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

      <CreateClassModal open={classModalOpen} onOpenChange={setClassModalOpen} />

      <AddSessionModal
        classId={addSessionTarget?.classId ?? ""}
        className={addSessionTarget?.className ?? ""}
        open={!!addSessionTarget}
        onOpenChange={(open) => { if (!open) setAddSessionTarget(null); }}
      />

      <AppConfirmModal
        open={deleteClassConfirm.open}
        onOpenChange={(open) =>
          !deleteClassConfirm.loading && setDeleteClassConfirm((s) => ({ ...s, open }))
        }
        title="Delete Class?"
        description={`Are you sure you want to delete "${deleteClassConfirm.className}"? All sessions will be removed.`}
        onConfirm={handleDeleteClass}
        loading={deleteClassConfirm.loading}
        confirmLabel="Delete Class"
      />

      <AppConfirmModal
        open={deleteSessionConfirm.open}
        onOpenChange={(open) =>
          !deleteSessionConfirm.loading && setDeleteSessionConfirm((s) => ({ ...s, open }))
        }
        title="Delete Session?"
        description="Are you sure you want to delete this session?"
        onConfirm={handleDeleteSession}
        loading={deleteSessionConfirm.loading}
        confirmLabel="Delete"
      />
    </div>
  );
};
