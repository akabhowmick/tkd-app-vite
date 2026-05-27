import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useSchool } from "../context/SchoolContext";
import { InventoryCategory, InventoryItemWithAlert, TransactionType } from "../types/inventory";
import { FaExclamationTriangle, FaBoxOpen, FaTrash, FaHistory, FaPlus, FaTimes } from "react-icons/fa";
import { AppConfirmModal } from "../components/ui/modal";
import { Input } from "../components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";

const CATEGORIES: InventoryCategory[] = ["Uniforms", "Gear", "Belts", "Merchandise"];

// ── Add item form ──────────────────────────────────────────────────────────────
type ItemForm = { item_name: string; category: InventoryCategory; price: string; stock_quantity: string; low_stock_threshold: string; size: string; color: string };
const emptyItemForm = (): ItemForm => ({ item_name: "", category: "Uniforms", price: "", stock_quantity: "0", low_stock_threshold: "5", size: "", color: "" });

// ── Sell / Restock forms ───────────────────────────────────────────────────────
type SellForm = { quantity: string; student_id: string; price_per_unit: string; notes: string };
type RestockForm = { quantity: string; cost: string; notes: string };
type ActionType = "sell" | "restock";
type ActiveAction = { item: InventoryItemWithAlert; type: ActionType } | null;

export const InventoryPage = () => {
  const { items, lowStockItems, transactions, loading, deleteItem, createItem, recordTransaction } = useInventory();
  const { students } = useSchool();
  const [activeTab, setActiveTab] = useState<"items" | "transactions">("items");
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | "All">("All");

  // ── Add item ─────────────────────────────────────────────────────────────
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── Sell / Restock inline action ──────────────────────────────────────────
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [sellForm, setSellForm] = useState<SellForm>({ quantity: "1", student_id: "", price_per_unit: "0", notes: "" });
  const [restockForm, setRestockForm] = useState<RestockForm>({ quantity: "", cost: "", notes: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; itemId: string; itemName: string; loading: boolean }>({ open: false, itemId: "", itemName: "", loading: false });

  const setIF = <K extends keyof ItemForm>(k: K, v: ItemForm[K]) => setItemForm((f) => ({ ...f, [k]: v }));

  const openAddForm = () => { setItemForm(emptyItemForm()); setAddError(null); setAddItemOpen(true); setActiveAction(null); };
  const closeAddForm = () => { setAddItemOpen(false); setAddError(null); };

  const openAction = (item: InventoryItemWithAlert, type: ActionType) => {
    setActiveAction({ item, type });
    setActionError(null);
    setAddItemOpen(false);
    if (type === "sell") {
      setSellForm({ quantity: "1", student_id: "", price_per_unit: String(item.price), notes: "" });
    } else {
      setRestockForm({ quantity: "", cost: "", notes: "" });
    }
  };
  const closeAction = () => { setActiveAction(null); setActionError(null); };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!itemForm.item_name.trim()) return setAddError("Item name is required.");
    if (!itemForm.price) return setAddError("Price is required.");
    setAddLoading(true);
    try {
      await createItem({
        item_name: itemForm.item_name.trim(), category: itemForm.category,
        price: parseFloat(itemForm.price),
        stock_quantity: parseInt(itemForm.stock_quantity) || 0,
        low_stock_threshold: parseInt(itemForm.low_stock_threshold) || 5,
        size: itemForm.size.trim() || undefined, color: itemForm.color.trim() || undefined,
      });
      closeAddForm();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction) return;
    setActionError(null);
    const qty = parseInt(sellForm.quantity);
    if (!qty || qty < 1) return setActionError("Quantity must be at least 1.");
    if (qty > activeAction.item.stock_quantity) return setActionError(`Only ${activeAction.item.stock_quantity} in stock.`);
    const price = parseFloat(sellForm.price_per_unit);
    if (isNaN(price) || price < 0) return setActionError("Invalid price.");
    setActionLoading(true);
    try {
      await recordTransaction({
        item_id: activeAction.item.item_id, transaction_type: "sale" as TransactionType,
        quantity: -qty, price_per_unit: price, total_amount: price * qty,
        student_id: sellForm.student_id || undefined, notes: sellForm.notes.trim() || undefined,
      });
      closeAction();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to record sale.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction) return;
    setActionError(null);
    const qty = parseInt(restockForm.quantity);
    if (!qty || qty < 1) return setActionError("Quantity must be at least 1.");
    setActionLoading(true);
    try {
      const cost = restockForm.cost ? parseFloat(restockForm.cost) : undefined;
      await recordTransaction({
        item_id: activeAction.item.item_id, transaction_type: "restock" as TransactionType,
        quantity: qty, price_per_unit: cost, total_amount: cost ? cost * qty : undefined,
        notes: restockForm.notes.trim() || undefined,
      });
      closeAction();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to record restock.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = selectedCategory === "All" ? items : items.filter((i) => i.category === selectedCategory);

  const handleDeleteItem = async () => {
    setDeleteConfirm((s) => ({ ...s, loading: true }));
    try { await deleteItem(deleteConfirm.itemId); }
    finally { setDeleteConfirm({ open: false, itemId: "", itemName: "", loading: false }); }
  };

  if (loading && items.length === 0) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Loading inventory...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          {!addItemOpen && (
            <button onClick={openAddForm} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <FaPlus /> Add Item
            </button>
          )}
        </div>

        {/* ── Inline add-item form ── */}
        {addItemOpen && (
          <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">New Item</h2>
              <button onClick={closeAddForm} className="text-gray-400 hover:text-gray-600"><FaTimes size={16} /></button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item Name <span className="text-red-500">*</span></label>
                  <Input placeholder="e.g., White Uniform" value={itemForm.item_name} onChange={(e) => setIF("item_name", e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category <span className="text-red-500">*</span></label>
                  <Select value={itemForm.category} onValueChange={(v) => setIF("category", v as InventoryCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price <span className="text-red-500">*</span></label>
                  <Input type="number" step="0.01" placeholder="29.99" value={itemForm.price} onChange={(e) => setIF("price", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Initial Stock <span className="text-red-500">*</span></label>
                  <Input type="number" value={itemForm.stock_quantity} onChange={(e) => setIF("stock_quantity", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Alert <span className="text-red-500">*</span></label>
                  <Input type="number" value={itemForm.low_stock_threshold} onChange={(e) => setIF("low_stock_threshold", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Size <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input placeholder="M" value={itemForm.size} onChange={(e) => setIF("size", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Input placeholder="White" value={itemForm.color} onChange={(e) => setIF("color", e.target.value)} />
                </div>
              </div>
              {addError && <p className="text-sm text-red-600 mb-3">{addError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeAddForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={addLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {addLoading ? "Adding…" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        )}

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
            {(["items", "transactions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
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
                        selectedCategory === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* ── Inline sell/restock action panel ── */}
                {activeAction && (
                  <div className={`border rounded-lg p-5 mb-4 ${activeAction.type === "sell" ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          {activeAction.type === "sell" ? "Sell" : "Restock"} — {activeAction.item.item_name}
                        </h3>
                        <p className="text-xs text-gray-500">{activeAction.item.stock_quantity} currently in stock</p>
                      </div>
                      <button onClick={closeAction} className="text-gray-400 hover:text-gray-600"><FaTimes size={14} /></button>
                    </div>

                    {activeAction.type === "sell" ? (
                      <form onSubmit={handleSell}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity <span className="text-red-500">*</span></label>
                            <Input type="number" min={1} max={activeAction.item.stock_quantity} value={sellForm.quantity} onChange={(e) => setSellForm((f) => ({ ...f, quantity: e.target.value }))} autoFocus />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Price Per Unit <span className="text-red-500">*</span></label>
                            <Input type="number" step="0.01" value={sellForm.price_per_unit} onChange={(e) => setSellForm((f) => ({ ...f, price_per_unit: e.target.value }))} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Student <span className="text-gray-400 font-normal">(optional)</span></label>
                            <Select value={sellForm.student_id} onValueChange={(v) => setSellForm((f) => ({ ...f, student_id: v }))}>
                              <SelectTrigger><SelectValue placeholder="No student" /></SelectTrigger>
                              <SelectContent>
                                {students.map((s) => <SelectItem key={String(s.id)} value={String(s.id)}>{s.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                            <Input placeholder="Notes..." value={sellForm.notes} onChange={(e) => setSellForm((f) => ({ ...f, notes: e.target.value }))} />
                          </div>
                        </div>
                        {actionError && <p className="text-sm text-red-600 mb-2">{actionError}</p>}
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={closeAction} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                          <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                            {actionLoading ? "Recording…" : "Record Sale"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleRestock}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity to Add <span className="text-red-500">*</span></label>
                            <Input type="number" min={1} placeholder="10" value={restockForm.quantity} onChange={(e) => setRestockForm((f) => ({ ...f, quantity: e.target.value }))} autoFocus />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cost Per Unit <span className="text-gray-400 font-normal">(optional)</span></label>
                            <Input type="number" step="0.01" placeholder="10.00" value={restockForm.cost} onChange={(e) => setRestockForm((f) => ({ ...f, cost: e.target.value }))} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                            <Input placeholder="Supplier, PO number..." value={restockForm.notes} onChange={(e) => setRestockForm((f) => ({ ...f, notes: e.target.value }))} />
                          </div>
                        </div>
                        {actionError && <p className="text-sm text-red-600 mb-2">{actionError}</p>}
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={closeAction} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                          <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {actionLoading ? "Recording…" : "Record Restock"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBoxOpen className="mx-auto text-gray-300 text-5xl mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">No Items Found</h2>
                    <p className="text-gray-500 mb-4">Add your first inventory item to get started</p>
                    <button onClick={openAddForm} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Add First Item</button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => (
                      <div
                        key={item.item_id}
                        className={`border rounded-lg p-4 ${item.is_low_stock ? "border-yellow-300 bg-yellow-50" : ""} ${activeAction?.item.item_id === item.item_id ? "ring-2 ring-blue-400" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{item.item_name}</h3>
                            <p className="text-sm text-gray-500">
                              {item.category}{item.size && ` · ${item.size}`}{item.color && ` · ${item.color}`}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm({ open: true, itemId: item.item_id, itemName: item.item_name, loading: false })}
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
                            onClick={() => openAction(item, "sell")}
                            disabled={item.stock_quantity === 0}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 ${
                              activeAction?.item.item_id === item.item_id && activeAction.type === "sell"
                                ? "bg-green-700 text-white"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => openAction(item, "restock")}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                              activeAction?.item.item_id === item.item_id && activeAction.type === "restock"
                                ? "bg-blue-700 text-white"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
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
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                txn.transaction_type === "sale" ? "bg-green-100 text-green-800"
                                  : txn.transaction_type === "restock" ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {txn.transaction_type}
                              </span>
                              {" · "}Qty: {Math.abs(txn.quantity)}
                              {txn.total_amount && ` · $${txn.total_amount.toFixed(2)}`}
                              {student && ` · ${student.name}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(txn.transaction_date).toLocaleString()}{txn.notes && ` · ${txn.notes}`}
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

      <AppConfirmModal
        open={deleteConfirm.open}
        onOpenChange={(open) => !deleteConfirm.loading && setDeleteConfirm((s) => ({ ...s, open }))}
        title="Delete Item?"
        description={`Are you sure you want to delete "${deleteConfirm.itemName}"? This will also delete all transaction history.`}
        onConfirm={handleDeleteItem}
        loading={deleteConfirm.loading}
        confirmLabel="Delete Item"
      />
    </div>
  );
};
