import { useState } from "react";
import { useClasses } from "../context/ClassContext";
import { FaPlus, FaTrash, FaClock, FaUsers } from "react-icons/fa";
import { AppConfirmModal } from "../components/ui/modal";
import { CreateClassModal } from "../components/AccountDashboards/AdminFeatures/ClassScheduling/CreateClassModal";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatTime = (t?: string) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
};

export const ClassSchedulingPage = () => {
  const { classes, loading, deleteClass } = useClasses();
  const [classModalOpen, setClassModalOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    classId: string;
    className: string;
    loading: boolean;
  }>({ open: false, classId: "", className: "", loading: false });

  const handleDeleteClass = async () => {
    setDeleteConfirm((s) => ({ ...s, loading: true }));
    try {
      await deleteClass(deleteConfirm.classId);
    } finally {
      setDeleteConfirm({ open: false, classId: "", className: "", loading: false });
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
                      {cls.instructor && (
                        <p className="text-sm text-gray-500">{cls.instructor}</p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
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

                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {cls.age_group}
                    </span>
                    {cls.day_of_week !== undefined && cls.start_time && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <FaClock className="text-gray-400" />
                        {DAYS_OF_WEEK[cls.day_of_week]} · {formatTime(cls.start_time)}
                        {cls.end_time && `–${formatTime(cls.end_time)}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateClassModal open={classModalOpen} onOpenChange={setClassModalOpen} />

      <AppConfirmModal
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          !deleteConfirm.loading && setDeleteConfirm((s) => ({ ...s, open }))
        }
        title="Delete Class?"
        description={`Are you sure you want to delete "${deleteConfirm.className}"?`}
        onConfirm={handleDeleteClass}
        loading={deleteConfirm.loading}
        confirmLabel="Delete Class"
      />
    </div>
  );
};
