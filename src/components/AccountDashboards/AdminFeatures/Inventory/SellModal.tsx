import { useState, useEffect } from "react";
import { useInventory } from "../../../../context/InventoryContext";
import { useSchool } from "../../../../context/SchoolContext";
import { InventoryItemWithAlert, TransactionType } from "../../../../types/inventory";
import { AppFormModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

type SellForm = { quantity: string; student_id: string; price_per_unit: string; notes: string };

type Props = {
  item: InventoryItemWithAlert | null;
  onClose: () => void;
};

export const SellModal = ({ item, onClose }: Props) => {
  const { recordTransaction } = useInventory();
  const { students } = useSchool();
  const [form, setForm] = useState<SellForm>({
    quantity: "1",
    student_id: "",
    price_per_unit: "0",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setForm({ quantity: "1", student_id: "", price_per_unit: String(item.price), notes: "" });
      setError(null);
    }
  }, [item]);

  const set = <K extends keyof SellForm>(k: K, v: SellForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty = parseInt(form.quantity);
    if (!qty || qty < 1) return setError("Quantity must be at least 1.");
    if (qty > (item?.stock_quantity ?? 0)) return setError(`Only ${item?.stock_quantity} in stock.`);
    const pricePerUnit = parseFloat(form.price_per_unit);
    if (isNaN(pricePerUnit) || pricePerUnit < 0) return setError("Invalid price.");
    setLoading(true);
    try {
      await recordTransaction({
        item_id: item!.item_id,
        transaction_type: "sale" as TransactionType,
        quantity: -qty,
        price_per_unit: pricePerUnit,
        total_amount: pricePerUnit * qty,
        student_id: form.student_id || undefined,
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record sale.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFormModal
      open={!!item}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={`Sell — ${item?.item_name ?? ""}`}
      description={item ? `${item.stock_quantity} in stock` : ""}
      size="compact"
      onSubmit={handleSubmit}
      submitLabel="Record Sale"
      loading={loading}
      error={error}
    >
      <ModalField label="Quantity" required htmlFor="sell-qty">
        <Input
          id="sell-qty"
          type="number"
          min={1}
          max={item?.stock_quantity}
          value={form.quantity}
          onChange={(e) => set("quantity", e.target.value)}
        />
      </ModalField>
      <ModalField label="Price Per Unit" required htmlFor="sell-price">
        <Input
          id="sell-price"
          type="number"
          step="0.01"
          value={form.price_per_unit}
          onChange={(e) => set("price_per_unit", e.target.value)}
        />
      </ModalField>
      <ModalField label="Student" htmlFor="sell-student" helper="Optional">
        <Select value={form.student_id} onValueChange={(v) => set("student_id", v)}>
          <SelectTrigger id="sell-student">
            <SelectValue placeholder="No student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={String(s.id)} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ModalField>
      <ModalField label="Notes" htmlFor="sell-notes" helper="Optional">
        <Textarea
          id="sell-notes"
          placeholder="Additional notes..."
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </ModalField>
    </AppFormModal>
  );
};
