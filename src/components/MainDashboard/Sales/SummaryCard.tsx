import React from "react";
import { FaCheckCircle, FaDollarSign, FaPiggyBank } from "react-icons/fa";
import { Sale } from "../../../types/sales";
import { formatCurrency } from "../../../utils/SaleHelperFunc";


export const SummaryCards: React.FC<{ sales: Sale[] }> = ({ sales }) => {
  const todaysTotal = sales.reduce((sum, s) => sum + s.amount, 0);
  const salesCount = sales.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <FaDollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(todaysTotal)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FaCheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Sales</p>
            <p className="text-2xl font-bold text-gray-900">{salesCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <FaPiggyBank className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Average Sale</p>
            <p className="text-2xl font-bold text-gray-900">
              {salesCount > 0 ? formatCurrency(todaysTotal / salesCount) : "$0.00"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
