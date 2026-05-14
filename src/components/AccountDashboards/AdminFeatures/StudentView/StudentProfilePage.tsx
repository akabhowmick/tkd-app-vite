import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBelts } from "../../../../context/BeltContext";
import { useSchool } from "../../../../context/SchoolContext";
import { Skeleton } from "../../../ui/skeleton";
import { AttendanceTab } from "./AttendanceTab";
import { PaymentHistory } from "./PaymentHistory";

type Tab = "payments" | "attendance";

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
  const { students, loadStudents, loading: studentsLoading } = useSchool();
  const { ranks } = useBelts();
  const [activeTab, setActiveTab] = useState<Tab>("payments");

  useEffect(() => {
    if (students.length === 0) loadStudents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            <h1 className="text-2xl font-bold text-black">{student.name}</h1>
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
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["payments", "attendance"] as Tab[]).map((tab) => (
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

      {activeTab === "payments" ? (
        <PaymentHistory studentId={student.id!} />
      ) : (
        <AttendanceTab studentId={student.id!} />
      )}
    </div>
  );
};
