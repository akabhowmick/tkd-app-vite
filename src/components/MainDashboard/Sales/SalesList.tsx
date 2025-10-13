import React from "react";
import { FaCalendar, FaDollarSign, FaUser } from "react-icons/fa";
import { Sale } from "../../../types/sales";
import { formatCurrency, getCategoryLabel } from "../../../utils/SaleHelperFunc";
import { formatTime } from "../../../utils/SalesUtils/fomat";

export const SalesList: React.FC<{ sales: Sale[] }> = ({ sales }) => {
  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-12 text-center">
          <FaDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No sales recorded today</p>
          <p className="text-gray-400 text-sm mt-1">Add your first sale to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Today's Transactions</h2>
      </div>
      <div className="divide-y">
        {sales.map((sale) => (
          <div key={sale.sale_id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg capitalize">{sale.payment_type}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{formatCurrency(sale.amount)}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {getCategoryLabel(sale.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaCalendar className="w-3 h-3" />
                      {formatTime(sale.payment_date)}
                    </span>
                    {sale.student_id && (
                      <span className="flex items-center gap-1">
                        <FaUser className="w-3 h-3" />
                        Student #{sale.student_id}
                      </span>
                    )}
                  </div>
                  {sale.notes && <p className="text-sm text-gray-500 mt-1 italic">"{sale.notes}"</p>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 capitalize">{sale.payment_type}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


