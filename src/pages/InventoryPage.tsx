import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useSchool } from "../context/SchoolContext";
import { InventoryCategory } from "../types/inventory";
import { InventoryItemWithAlert } from "../types/inventory";
import { FaExclamationTriangle, FaBoxOpen, FaTrash, FaHistory, FaPlus } from "react-icons/fa";
import { AppConfirmModal } from "../components/ui/modal";
import { AddItemModal } from "../components/AccountDashboards/AdminFeatures/Inventory/AddItemModal";
import { SellModal } from "../components/AccountDashboards/AdminFeatures/Inventory/SellModal";
import { RestockModal } from "../components/AccountDashboards/AdminFeatures/Inventory/RestockModal";

const CATEGORIES: InventoryCategory[] = ["Uniforms", "Gear", "Belts", "Merchandise"];

export const InventoryPage = () => {
  const { items, lowStockItems, transactions, loading, deleteItem } = useInventory();
  const { students } = useSchool();
  const [activeTab, setActiveTab] = useState<"items" | "transactions">("items");
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | "All">("All");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [sellTarget, setSellTarget] = useState<InventoryItemWithAlert | null>(null);
  const [restockTarget, setRestockTarget] = useState<InventoryItemWithAlert | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    itemId: string;
    itemName: string;
    loading: boolean;
  }>({ open: false, itemId: "", itemName: "", loading: false });

  const filteredItems =
    selectedCategory === "All" ? items : items.filter((item) => item.category === selectedCategory);

  const handleDeleteItem = async () => {
    setDeleteConfirm((s) => ({ ...s, loading: true }));
    try {
      await deleteItem(deleteConfirm.itemId);
    } finally {
      setDeleteConfirm({ open: false, itemId: "", itemName: "", loading: false });
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <button
            onClick={() => setAddItemOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus /> Add Item
          </button>
        </div>

        {lowStockItems.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} running low on
                stock
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            {(["items", "transactions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab === "items" ? `Items (${items.length})` : "Transaction History"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "items" ? (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {(["All", ...CATEGORIES] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBoxOpen className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No Items Found</h2>
                    <p className="text-gray-500 mb-4">
                      Add your first inventory item to get started
                    </p>
                    <button
                      onClick={() => setAddItemOpen(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add First Item
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => (
                      <div
                        key={item.item_id}
                        className={`border rounded-lg p-4 ${
                          item.is_low_stock ? "border-yellow-300 bg-yellow-50" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{item.item_name}</h3>
                            <p className="text-sm text-gray-500">
                              {item.category}
                              {item.size && ` · ${item.size}`}
                              {item.color && ` · ${item.color}`}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                itemId: item.item_id,
                                itemName: item.item_name,
                                loading: false,
                              })
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Stock:</span>
                            <span
                              className={`font-semibold ${
                                item.is_low_stock ? "text-yellow-700" : "text-gray-900"
                              }`}
                            >
                              {item.stock_quantity} {item.is_low_stock && "⚠️"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-semibold text-gray-900">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setSellTarget(item)}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            disabled={item.stock_quantity === 0}
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => setRestockTarget(item)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Restock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHistory className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No Transactions Yet</h2>
                    <p className="text-gray-500">Transaction history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((txn) => {
                      const item = items.find((i) => i.item_id === txn.item_id);
                      const student = students.find((s) => s.id === txn.student_id);
                      return (
                        <div
                          key={txn.transaction_id}
                          className="border rounded-lg p-3 flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {item?.item_name || "Unknown Item"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  txn.transaction_type === "sale"
                                    ? "bg-green-100 text-green-800"
                                    : txn.transaction_type === "restock"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {txn.transaction_type}
                              </span>
                              {" · "}Qty: {Math.abs(txn.quantity)}
                              {txn.total_amount && ` · $${txn.total_amount.toFixed(2)}`}
                              {student && ` · ${student.name}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(txn.transaction_date).toLocaleString()}
                              {txn.notes && ` · ${txn.notes}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddItemModal open={addItemOpen} onOpenChange={setAddItemOpen} />
      <SellModal item={sellTarget} onClose={() => setSellTarget(null)} />
      <RestockModal item={restockTarget} onClose={() => setRestockTarget(null)} />

      <AppConfirmModal
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          !deleteConfirm.loading && setDeleteConfirm((s) => ({ ...s, open }))
        }
        title="Delete Item?"
        description={`Are you sure you want to delete "${deleteConfirm.itemName}"? This will also delete all transaction history.`}
        onConfirm={handleDeleteItem}
        loading={deleteConfirm.loading}
        confirmLabel="Delete Item"
      />
    </div>
  );
};
