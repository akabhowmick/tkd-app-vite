import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useSales, SalesProvider } from "../../../context/SalesContext";
import { AddSaleForm } from "./AddSaleForm";
import { SalesList } from "./SalesList";
import { SummaryCards } from "./SummaryCard";

const SalesTrackingInner: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<"main" | "add">("main");
  const { sales, loading } = useSales();

  if (currentPage === "add") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setCurrentPage("main")}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Sale</h1>
              <p className="text-gray-600 mt-1">Record a new payment transaction</p>
            </div>
          </div>

          <AddSaleForm onCancel={() => setCurrentPage("main")} onSaved={() => setCurrentPage("main")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Today's Sales</h1>
            <p className="text-gray-600 mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <button
            onClick={() => setCurrentPage("add")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <FaPlus className="w-5 h-5" />
            Add Sale
          </button>
        </div>

        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <>
            <SummaryCards sales={sales} />
            <SalesList sales={sales} />
          </>
        )}
      </div>
    </div>
  );
};

const SalesTrackingPage: React.FC = () => (
  <SalesProvider>
    <SalesTrackingInner />
  </SalesProvider>
);

export default SalesTrackingPage;