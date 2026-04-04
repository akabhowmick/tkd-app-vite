import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useSchool } from "../context/SchoolContext";
import { InventoryCategory, TransactionType } from "../types/inventory";
import Swal from "sweetalert2";
import { FaPlus, FaExclamationTriangle, FaBoxOpen, FaTrash, FaHistory } from "react-icons/fa";

const CATEGORIES: InventoryCategory[] = ["Uniforms", "Gear", "Belts", "Merchandise"];

export const InventoryPage = () => {
  const { items, lowStockItems, transactions, loading, createItem, deleteItem, recordTransaction } = useInventory();
  const { students } = useSchool();
  const [activeTab, setActiveTab] = useState<"items" | "transactions">("items");
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | "All">("All");

  const filteredItems = selectedCategory === "All"
    ? items
    : items.filter((item) => item.category === selectedCategory);

  const handleAddItem = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Add Inventory Item",
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Item Name</label>
            <input id="item-name" class="swal2-input" placeholder="e.g., White Uniform" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Category</label>
            <select id="category" class="swal2-input" style="margin:4px 0 0 0;padding:8px">
              ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
            </select>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Price</label>
            <input id="price" type="number" step="0.01" class="swal2-input" placeholder="29.99" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Initial Stock</label>
            <input id="stock" type="number" class="swal2-input" placeholder="10" value="0" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Low Stock Alert</label>
            <input id="low-stock" type="number" class="swal2-input" placeholder="5" value="5" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Size (optional)</label>
            <input id="size" class="swal2-input" placeholder="M" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Color (optional)</label>
            <input id="color" class="swal2-input" placeholder="White" style="margin:4px 0 0 0;padding:8px"/>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Add Item",
      confirmButtonColor: "#3b82f6",
      preConfirm: () => ({
        item_name: (document.getElementById("item-name") as HTMLInputElement).value,
        category: (document.getElementById("category") as HTMLSelectElement).value as InventoryCategory,
        price: parseFloat((document.getElementById("price") as HTMLInputElement).value),
        stock_quantity: parseInt((document.getElementById("stock") as HTMLInputElement).value),
        low_stock_threshold: parseInt((document.getElementById("low-stock") as HTMLInputElement).value),
        size: (document.getElementById("size") as HTMLInputElement).value || undefined,
        color: (document.getElementById("color") as HTMLInputElement).value || undefined,
      }),
    });

    if (formValues) {
      try {
        await createItem(formValues);
        Swal.fire("Success!", "Item added to inventory", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to add item", "error");
      }
    }
  };

  const handleSellItem = async (itemId: string, itemName: string, price: number, currentStock: number) => {
    const { value: formValues } = await Swal.fire({
      title: `Sell ${itemName}`,
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Quantity</label>
            <input id="quantity" type="number" min="1" max="${currentStock}" class="swal2-input" placeholder="1" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Student (optional)</label>
            <select id="student" class="swal2-input" style="margin:4px 0 0 0;padding:8px">
              <option value="">-- No Student --</option>
              ${students.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
            </select>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Price Per Unit</label>
            <input id="price-per-unit" type="number" step="0.01" value="${price}" class="swal2-input" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Notes (optional)</label>
            <textarea id="notes" class="swal2-textarea" placeholder="Additional notes..." style="margin:4px 0 0 0;padding:8px"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Record Sale",
      confirmButtonColor: "#10b981",
      preConfirm: () => {
        const qty = parseInt((document.getElementById("quantity") as HTMLInputElement).value);
        const pricePerUnit = parseFloat((document.getElementById("price-per-unit") as HTMLInputElement).value);
        const studentId = (document.getElementById("student") as HTMLSelectElement).value || undefined;

        return {
          item_id: itemId,
          transaction_type: "sale" as TransactionType,
          quantity: -qty, // negative for sales
          price_per_unit: pricePerUnit,
          total_amount: pricePerUnit * qty,
          student_id: studentId,
          notes: (document.getElementById("notes") as HTMLTextAreaElement).value || undefined,
        };
      },
    });

    if (formValues) {
      try {
        await recordTransaction(formValues);
        Swal.fire("Success!", "Sale recorded successfully", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to record sale", "error");
      }
    }
  };

  const handleRestockItem = async (itemId: string, itemName: string) => {
    const { value: formValues } = await Swal.fire({
      title: `Restock ${itemName}`,
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left">
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Quantity to Add</label>
            <input id="quantity" type="number" min="1" class="swal2-input" placeholder="10" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Cost Per Unit (optional)</label>
            <input id="cost" type="number" step="0.01" class="swal2-input" placeholder="10.00" style="margin:4px 0 0 0;padding:8px"/>
          </div>
          <div>
            <label style="font-size:0.875rem;font-weight:600;color:#374151">Notes (optional)</label>
            <textarea id="notes" class="swal2-textarea" placeholder="Supplier, PO number..." style="margin:4px 0 0 0;padding:8px"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Record Restock",
      confirmButtonColor: "#3b82f6",
      preConfirm: () => {
        const qty = parseInt((document.getElementById("quantity") as HTMLInputElement).value);
        const costInput = (document.getElementById("cost") as HTMLInputElement).value;
        const cost = costInput ? parseFloat(costInput) : undefined;

        return {
          item_id: itemId,
          transaction_type: "restock" as TransactionType,
          quantity: qty,
          price_per_unit: cost,
          total_amount: cost ? cost * qty : undefined,
          notes: (document.getElementById("notes") as HTMLTextAreaElement).value || undefined,
        };
      },
    });

    if (formValues) {
      try {
        await recordTransaction(formValues);
        Swal.fire("Success!", "Restock recorded successfully", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to record restock", "error");
      }
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    const result = await Swal.fire({
      title: "Delete Item?",
      text: `Are you sure you want to delete "${itemName}"? This will also delete all transaction history.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        await deleteItem(itemId);
        Swal.fire("Deleted!", "Item deleted successfully", "success");
      } catch (err) {
        Swal.fire("Error", err instanceof Error ? err.message : "Failed to delete item", "error");
      }
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
            onClick={handleAddItem}
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
                {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} running low on stock
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab("items")}
              className={`flex-1 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === "items"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Items ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex-1 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === "transactions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Transaction History
            </button>
          </div>

          <div className="p-6">
            {activeTab === "items" ? (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      selectedCategory === "All"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
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
                    <p className="text-gray-500 mb-4">Add your first inventory item to get started</p>
                    <button
                      onClick={handleAddItem}
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
                        className={`border rounded-lg p-4 ${item.is_low_stock ? "border-yellow-300 bg-yellow-50" : ""}`}
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
                            onClick={() => handleDeleteItem(item.item_id, item.item_name)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Stock:</span>
                            <span className={`font-semibold ${item.is_low_stock ? "text-yellow-700" : "text-gray-900"}`}>
                              {item.stock_quantity} {item.is_low_stock && "⚠️"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-semibold text-gray-900">${item.price.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSellItem(item.item_id, item.item_name, item.price, item.stock_quantity)}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                            disabled={item.stock_quantity === 0}
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => handleRestockItem(item.item_id, item.item_name)}
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
                        <div key={txn.transaction_id} className="border rounded-lg p-3 flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{item?.item_name || "Unknown Item"}</h4>
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
                              {" · "}
                              Qty: {Math.abs(txn.quantity)}
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
    </div>
  );
};
