import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CreateRenewalForm } from "./CreateRenewalForm";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";
import { CreateRenewalRequest } from "../../../../types/student_renewal";
import { ChevronRight } from "lucide-react";

export const CreateRenewalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createRenewal, updatePeriod } = useStudentRenewals();

  const studentId = searchParams.get("studentId") ?? "";
  const renewingPeriodId = searchParams.get("renewingPeriodId");

  const handleSubmit = async (data: CreateRenewalRequest) => {
    if (renewingPeriodId) {
      await updatePeriod(renewingPeriodId, {
        status: "renewed",
        resolved_at: new Date().toISOString(),
        resolution_notes: "Renewed",
      });
    }
    await createRenewal(data);
    navigate(`../students/${data.period.student_id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
          <Link
            to=".."
            relative="path"
            className="hover:text-gray-800 transition-colors"
          >
            Renewal Management
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-800 font-medium">
            {renewingPeriodId ? "Renew Student" : "Register Renewal"}
          </span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {renewingPeriodId ? "Renew Student" : "Register Renewal"}
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <CreateRenewalForm
            initialStudentId={studentId}
            onSubmit={handleSubmit}
            onCancel={() => navigate("..")}
          />
        </div>
      </div>
    </div>
  );
};
