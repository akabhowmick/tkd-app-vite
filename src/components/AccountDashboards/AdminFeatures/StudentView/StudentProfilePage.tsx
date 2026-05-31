import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPencilAlt, FaTimes, FaCheck } from "react-icons/fa";
import { useBelts } from "../../../../context/BeltContext";
import { useSchool } from "../../../../context/SchoolContext";
import { Skeleton } from "../../../ui/skeleton";
import { Checkbox } from "../../../ui/checkbox";
import { AttendanceTab } from "./AttendanceTab";
import { ClassesTab } from "./ClassesTab";
import { PaymentHistory } from "./PaymentHistory";
import { HandleAddOrEdit } from "./HandleAddOrEdit";
import { AppConfirmModal } from "../../../ui/modal";
import { StudentGroup } from "../../../../types/groups";
import {
  getSchoolGroups,
  getStudentGroups,
  setStudentGroups,
} from "../../../../api/GroupRequests/groupRequests";

type Tab = "payments" | "attendance" | "classes";

const BADGE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700",
];

const PageSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4">
    <Skeleton className="h-4 w-24 mb-6" />
    <Skeleton className="h-36 w-full rounded-lg mb-6" />
    <Skeleton className="h-8 w-48 mb-6" />
    <div className="flex flex-col gap-6">
      {[0, 1].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
    </div>
  </div>
);

export const StudentProfilePage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { students, loadStudents, loading: studentsLoading, patchStudent, handleDelete, schoolId } = useSchool();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { ranks } = useBelts();
  const [activeTab, setActiveTab] = useState<Tab>("payments");

  // ── Group state ──────────────────────────────────────────────────────────────
  const [studentGroupIds, setStudentGroupIds] = useState<Set<string>>(new Set());
  const [allGroups, setAllGroups] = useState<StudentGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [editGroupsOpen, setEditGroupsOpen] = useState(false);
  const [pendingGroupIds, setPendingGroupIds] = useState<Set<string>>(new Set());
  const [savingGroups, setSavingGroups] = useState(false);

  useEffect(() => {
    if (students.length === 0) loadStudents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!studentId || !schoolId) return;
    setGroupsLoading(true);
    Promise.all([getSchoolGroups(schoolId), getStudentGroups(studentId)])
      .then(([all, mine]) => {
        setAllGroups(all);
        setStudentGroupIds(new Set(mine.map((g) => g.id)));
      })
      .finally(() => setGroupsLoading(false));
  }, [studentId, schoolId]);

  const openEditGroups = () => {
    setPendingGroupIds(new Set(studentGroupIds));
    setEditGroupsOpen(true);
  };

  const togglePending = (id: string) =>
    setPendingGroupIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSaveGroups = async () => {
    if (!studentId) return;
    setSavingGroups(true);
    try {
      await setStudentGroups(studentId, [...pendingGroupIds]);
      setStudentGroupIds(new Set(pendingGroupIds));
      setEditGroupsOpen(false);
    } finally {
      setSavingGroups(false);
    }
  };

  const confirmDelete = async () => {
    if (!studentId) return;
    setDeleteLoading(true);
    try {
      await handleDelete(studentId);
      navigate(-1);
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  const student = students.find((s) => s.id === studentId);

  if (studentsLoading || (!student && students.length === 0)) {
    return <PageSkeleton />;
  }

  if (!student) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <p className="text-gray-500">Student not found.</p>
      </div>
    );
  }

  const currentRank = ranks.find((r) => r.rank_id === student.current_rank_id);
  const assignedGroups = allGroups.filter((g) => studentGroupIds.has(g.id));

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        ← Back to Students
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-black">{student.name}</h1>
              <HandleAddOrEdit
                student={student}
                updateStudent={async (id, payload) => patchStudent(id, payload)}
                loadStudents={loadStudents}
                buttonText="Edit"
                buttonClassName="px-3 py-1 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              />
              <button
                onClick={() => setDeleteOpen(true)}
                className="px-3 py-1 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
            {currentRank ? (
              <span
                className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: currentRank.color_code || "#6b7280" }}
              >
                {currentRank.rank_name}
              </span>
            ) : (
              <span className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                No belt assigned
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Email</p>
            <p className="text-sm text-black">{student.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Phone</p>
            <p className="text-sm text-black">{student.phone || "N/A"}</p>
          </div>
        </div>

        {/* Groups section */}
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">Groups</p>
            {!editGroupsOpen && (
              <button
                onClick={openEditGroups}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <FaPencilAlt size={10} /> Edit
              </button>
            )}
          </div>

          {!editGroupsOpen && (
            <>
              {groupsLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
              ) : assignedGroups.length === 0 ? (
                <p className="text-sm text-gray-400">No groups assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {assignedGroups.map((g, i) => (
                    <span
                      key={g.id}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${BADGE_COLORS[i % BADGE_COLORS.length]}`}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {editGroupsOpen && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-1">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-medium text-gray-700">Assign groups</p>
                <button onClick={() => setEditGroupsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes size={13} />
                </button>
              </div>
              {allGroups.length === 0 ? (
                <p className="text-sm text-gray-400">No groups created for this school yet.</p>
              ) : (
                <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto">
                  {allGroups.map((g) => (
                    <label key={g.id} className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={pendingGroupIds.has(g.id)}
                        onCheckedChange={() => togglePending(g.id)}
                      />
                      <span className="text-sm text-gray-800">{g.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveGroups}
                  disabled={savingGroups}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-700 rounded-md hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                  <FaCheck size={11} /> {savingGroups ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditGroupsOpen(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["payments", "attendance", "classes"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-black text-black"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "payments" && <PaymentHistory studentId={student.id!} />}
      {activeTab === "attendance" && <AttendanceTab studentId={student.id!} />}
      {activeTab === "classes" && <ClassesTab studentId={student.id!} />}

      <AppConfirmModal
        open={deleteOpen}
        onOpenChange={(open) => !deleteLoading && setDeleteOpen(open)}
        title="Delete Student?"
        description={`Are you sure you want to delete ${student.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        variant="destructive"
        confirmLabel="Delete Student"
      />
    </div>
  );
};
