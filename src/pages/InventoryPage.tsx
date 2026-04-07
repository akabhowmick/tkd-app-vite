import { useState } from "react";
import { useInventory } from "../context/InventoryContext";
import { useSchool } from "../context/SchoolContext";
import { InventoryCategory, TransactionType } from "../types/inventory";
import { FaPlus, FaExclamationTriangle, FaBoxOpen, FaTrash, FaHistory } from "react-icons/fa";
import { AppFormModal, AppConfirmModal, ModalField } from "../components/ui/modal";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const CATEGORIES: InventoryCategory[] = ["Uniforms", "Gear", "Belts", "Merchandise"];

type ItemForm = {
  item_name: string;
  category: InventoryCategory;
  price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  size: string;
  color: string;
};
type SellForm = { quantity: string; student_id: string; price_per_unit: string; notes: string };
type RestockForm = { quantity: string; cost: string; notes: string };

const emptyItemForm = (): ItemForm => ({
  item_name: "",
  category: "Uniforms",
  price: "",
  stock_quantity: "0",
  low_stock_threshold: "5",
  size: "",
  color: "",
});
const emptySellForm = (price: number): SellForm => ({
  quantity: "1",
  student_id: "",
  price_per_unit: String(price),
  notes: "",
});
const emptyRestockForm = (): RestockForm => ({ quantity: "", cost: "", notes: "" });

export const InventoryPage = () => {
  const { items, lowStockItems, transactions, loading, createItem, deleteItem, recordTransaction } =
    useInventory();
  const { students } = useSchool();
  const [activeTab, setActiveTab] = useState<"items" | "transactions">("items");
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | "All">("All");

  const filteredItems =
    selectedCategory === "All" ? items : items.filter((item) => item.category === selectedCategory);

  // ── Add item modal ─────────────────────────────────────────────────────────
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm());
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // ── Sell modal ─────────────────────────────────────────────────────────────
  const [sellModal, setSellModal] = useState<{
    open: boolean; itemId: string; itemName: string; price: number; currentStock: number;
  }>({ open: false, itemId: "", itemName: "", price: 0, currentStock: 0 });
  const [sellForm, setSellForm] = useState<SellForm>(emptySellForm(0));
  const [sellLoading, setSellLoading] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);

  // ── Restock modal ──────────────────────────────────────────────────────────
  const [restockModal, setRestockModal] = useState<{
    open: boolean; itemId: string; itemName: string;
  }>({ open: false, itemId: "", itemName: "" });
  const [restockForm, setRestockForm] = useState<RestockForm>(emptyRestockForm());
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean; itemId: string; itemName: string; loading: boolean;
  }>({ open: false, itemId: "", itemName: "", loading: false });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);
    if (!itemForm.item_name.trim()) { setItemError("Item name is required."); return; }
    if (!itemForm.price) { setItemError("Price is required."); return; }
    setItemLoading(true);
    try {
      await createItem({
        item_name: itemForm.item_name.trim(),
        category: itemForm.category,
        price: parseFloat(itemForm.price),
        stock_quantity: parseInt(itemForm.stock_quantity) || 0,
        low_stock_threshold: parseInt(itemForm.low_stock_threshold) || 5,
        size: itemForm.size.trim() || undefined,
        color: itemForm.color.trim() || undefined,
      });
      setAddItemOpen(false);
      setItemForm(emptyItemForm());
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setItemLoading(false);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellError(null);
    const qty = parseInt(sellForm.quantity);
    if (!qty || qty < 1) { setSellError("Quantity must be at least 1."); return; }
    if (qty > sellModal.currentStock) { setSellError(`Only ${sellModal.currentStock} in stock.`); return; }
    const pricePerUnit = parseFloat(sellForm.price_per_unit);
    if (isNaN(pricePerUnit) || pricePerUnit < 0) { setSellError("Invalid price."); return; }
    setSellLoading(true);
    try {
      await recordTransaction({
        item_id: sellModal.itemId,
        transaction_type: "sale" as TransactionType,
        quantity: -qty,
        price_per_unit: pricePerUnit,
        total_amount: pricePerUnit * qty,
        student_id: sellForm.student_id || undefined,
        notes: sellForm.notes.trim() || undefined,
      });
      setSellModal((s) => ({ ...s, open: false }));
    } catch (err) {
      setSellError(err instanceof Error ? err.message : "Failed to record sale.");
    } finally {
      setSellLoading(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestockError(null);
    const qty = parseInt(restockForm.quantity);
    if (!qty || qty < 1) { setRestockError("Quantity must be at least 1."); return; }
    setRestockLoading(true);
    try {
      const cost = restockForm.cost ? parseFloat(restockForm.cost) : undefined;
      await recordTransaction({
        item_id: restockModal.itemId,
        transaction_type: "restock" as TransactionType,
        quantity: qty,
        price_per_unit: cost,
        total_amount: cost ? cost * qty : undefined,
        notes: restockForm.notes.trim() || undefined,
      });
      setRestockModal((s) => ({ ...s, open: false }));
    } catch (err) {
      setRestockError(err instanceof Error ? err.message : "Failed to record restock.");
    } finally {
      setRestockLoading(false);
    }
  };

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
            onClick={() => { setItemForm(emptyItemForm()); setItemError(null); setAddItemOpen(true); }}
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
                    <p className="text-gray-500 mb-4">Add your first inventory item to get started</p>
                    <button
                      onClick={() => { setItemForm(emptyItemForm()); setAddItemOpen(true); }}
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
                            onClick={() => {
                              setSellForm(emptySellForm(item.price));
                              setSellError(null);
                              setSellModal({
                                open: true,
                                itemId: item.item_id,
                                itemName: item.item_name,
                                price: item.price,
                                currentStock: item.stock_quantity,
                              });
                            }}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            disabled={item.stock_quantity === 0}
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => {
                              setRestockForm(emptyRestockForm());
                              setRestockError(null);
                              setRestockModal({ open: true, itemId: item.item_id, itemName: item.item_name });
                            }}
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

      {/* ── Add Item Modal ── */}
      <AppFormModal
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        title="Add Inventory Item"
        size="default"
        onSubmit={handleAddItem}
        submitLabel="Add Item"
        loading={itemLoading}
        error={itemError}
      >
        <ModalField label="Item Name" required htmlFor="item-name">
          <Input
            id="item-name"
            placeholder="e.g., White Uniform"
            value={itemForm.item_name}
            onChange={(e) => setItemForm((f) => ({ ...f, item_name: e.target.value }))}
          />
        </ModalField>
        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Category" required htmlFor="item-category">
            <Select
              value={itemForm.category}
              onValueChange={(v) => setItemForm((f) => ({ ...f, category: v as InventoryCategory }))}
            >
              <SelectTrigger id="item-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </ModalField>
          <ModalField label="Price" required htmlFor="item-price">
            <Input
              id="item-price"
              type="number"
              step="0.01"
              placeholder="29.99"
              value={itemForm.price}
              onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
            />
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Initial Stock" required htmlFor="item-stock">
            <Input
              id="item-stock"
              type="number"
              value={itemForm.stock_quantity}
              onChange={(e) => setItemForm((f) => ({ ...f, stock_quantity: e.target.value }))}
            />
          </ModalField>
          <ModalField label="Low Stock Alert" required htmlFor="item-low-stock">
            <Input
              id="item-low-stock"
              type="number"
              value={itemForm.low_stock_threshold}
              onChange={(e) => setItemForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
            />
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ModalField label="Size" htmlFor="item-size" helper="Optional">
            <Input
              id="item-size"
              placeholder="M"
              value={itemForm.size}
              onChange={(e) => setItemForm((f) => ({ ...f, size: e.target.value }))}
            />
          </ModalField>
          <ModalField label="Color" htmlFor="item-color" helper="Optional">
            <Input
              id="item-color"
              placeholder="White"
              value={itemForm.color}
              onChange={(e) => setItemForm((f) => ({ ...f, color: e.target.value }))}
            />
          </ModalField>
        </div>
      </AppFormModal>

      {/* ── Sell Modal ── */}
      <AppFormModal
        open={sellModal.open}
        onOpenChange={(open) => setSellModal((s) => ({ ...s, open }))}
        title={`Sell — ${sellModal.itemName}`}
        description={`${sellModal.currentStock} in stock`}
        size="compact"
        onSubmit={handleSell}
        submitLabel="Record Sale"
        loading={sellLoading}
        error={sellError}
      >
        <ModalField label="Quantity" required htmlFor="sell-qty">
          <Input
            id="sell-qty"
            type="number"
            min={1}
            max={sellModal.currentStock}
            value={sellForm.quantity}
            onChange={(e) => setSellForm((f) => ({ ...f, quantity: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Price Per Unit" required htmlFor="sell-price">
          <Input
            id="sell-price"
            type="number"
            step="0.01"
            value={sellForm.price_per_unit}
            onChange={(e) => setSellForm((f) => ({ ...f, price_per_unit: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Student" htmlFor="sell-student" helper="Optional">
          <Select
            value={sellForm.student_id}
            onValueChange={(v) => setSellForm((f) => ({ ...f, student_id: v }))}
          >
            <SelectTrigger id="sell-student">
              <SelectValue placeholder="No student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={String(s.id)} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ModalField>
        <ModalField label="Notes" htmlFor="sell-notes" helper="Optional">
          <Textarea
            id="sell-notes"
            placeholder="Additional notes..."
            rows={2}
            value={sellForm.notes}
            onChange={(e) => setSellForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Restock Modal ── */}
      <AppFormModal
        open={restockModal.open}
        onOpenChange={(open) => setRestockModal((s) => ({ ...s, open }))}
        title={`Restock — ${restockModal.itemName}`}
        size="compact"
        onSubmit={handleRestock}
        submitLabel="Record Restock"
        loading={restockLoading}
        error={restockError}
      >
        <ModalField label="Quantity to Add" required htmlFor="restock-qty">
          <Input
            id="restock-qty"
            type="number"
            min={1}
            placeholder="10"
            value={restockForm.quantity}
            onChange={(e) => setRestockForm((f) => ({ ...f, quantity: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Cost Per Unit" htmlFor="restock-cost" helper="Optional">
          <Input
            id="restock-cost"
            type="number"
            step="0.01"
            placeholder="10.00"
            value={restockForm.cost}
            onChange={(e) => setRestockForm((f) => ({ ...f, cost: e.target.value }))}
          />
        </ModalField>
        <ModalField label="Notes" htmlFor="restock-notes" helper="Optional">
          <Textarea
            id="restock-notes"
            placeholder="Supplier, PO number..."
            rows={2}
            value={restockForm.notes}
            onChange={(e) => setRestockForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </ModalField>
      </AppFormModal>

      {/* ── Delete Confirm ── */}
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
