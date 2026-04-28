import { useState } from "react";
import { useInventory } from "../../../../context/InventoryContext";
import { InventoryCategory } from "../../../../types/inventory";
import { AppFormModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

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

const emptyForm = (): ItemForm => ({
  item_name: "",
  category: "Uniforms",
  price: "",
  stock_quantity: "0",
  low_stock_threshold: "5",
  size: "",
  color: "",
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddItemModal = ({ open, onOpenChange }: Props) => {
  const { createItem } = useInventory();
  const [form, setForm] = useState<ItemForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ItemForm>(k: K, v: ItemForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleOpenChange = (open: boolean) => {
    if (!open) { setForm(emptyForm()); setError(null); }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.item_name.trim()) return setError("Item name is required.");
    if (!form.price) return setError("Price is required.");
    setLoading(true);
    try {
      await createItem({
        item_name: form.item_name.trim(),
        category: form.category,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        size: form.size.trim() || undefined,
        color: form.color.trim() || undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFormModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Add Inventory Item"
      size="default"
      onSubmit={handleSubmit}
      submitLabel="Add Item"
      loading={loading}
      error={error}
    >
      <ModalField label="Item Name" required htmlFor="item-name">
        <Input
          id="item-name"
          placeholder="e.g., White Uniform"
          value={form.item_name}
          onChange={(e) => set("item_name", e.target.value)}
        />
      </ModalField>
      <div className="grid grid-cols-2 gap-4">
        <ModalField label="Category" required htmlFor="item-category">
          <Select
            value={form.category}
            onValueChange={(v) => set("category", v as InventoryCategory)}
          >
            <SelectTrigger id="item-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ModalField>
        <ModalField label="Price" required htmlFor="item-price">
          <Input
            id="item-price"
            type="number"
            step="0.01"
            placeholder="29.99"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </ModalField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ModalField label="Initial Stock" required htmlFor="item-stock">
          <Input
            id="item-stock"
            type="number"
            value={form.stock_quantity}
            onChange={(e) => set("stock_quantity", e.target.value)}
          />
        </ModalField>
        <ModalField label="Low Stock Alert" required htmlFor="item-low-stock">
          <Input
            id="item-low-stock"
            type="number"
            value={form.low_stock_threshold}
            onChange={(e) => set("low_stock_threshold", e.target.value)}
          />
        </ModalField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ModalField label="Size" htmlFor="item-size" helper="Optional">
          <Input
            id="item-size"
            placeholder="M"
            value={form.size}
            onChange={(e) => set("size", e.target.value)}
          />
        </ModalField>
        <ModalField label="Color" htmlFor="item-color" helper="Optional">
          <Input
            id="item-color"
            placeholder="White"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
          />
        </ModalField>
      </div>
    </AppFormModal>
  );
};
