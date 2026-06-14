import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CreateRenewalForm } from "./CreateRenewalForm";
import { useStudentRenewals } from "../../../../context/StudentRenewalContext";
import { CreateRenewalRequest } from "../../../../types/student_renewal";
import { CheckCircle, ChevronRight } from "lucide-react";

export const CreateRenewalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createRenewal, updatePeriod } = useStudentRenewals();

  const studentId = searchParams.get("studentId") ?? "";
  const renewingPeriodId = searchParams.get("renewingPeriodId");

  const [successStudentId, setSuccessStudentId] = useState<string | null>(null);

  const handleSubmit = async (data: CreateRenewalRequest) => {
    if (renewingPeriodId) {
      await updatePeriod(renewingPeriodId, {
        status: "renewed",
        resolved_at: new Date().toISOString(),
        resolution_notes: "Renewed",
      });
    }
    await createRenewal(data);
    setSuccessStudentId(data.period.student_id);
  };

  if (successStudentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-10 border border-gray-100 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="text-green-500" size={56} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Registered</h2>
          <p className="text-gray-500 text-sm mb-8">The renewal has been saved successfully.</p>
          <button
            onClick={() => navigate(`../students/${successStudentId}`)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            Go to Student Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
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
