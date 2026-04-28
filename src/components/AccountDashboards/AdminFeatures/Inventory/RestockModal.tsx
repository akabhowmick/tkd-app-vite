import { useState, useEffect } from "react";
import { useInventory } from "../../../../context/InventoryContext";
import { InventoryItemWithAlert, TransactionType } from "../../../../types/inventory";
import { AppFormModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import { Textarea } from "../../../ui/textarea";

type RestockForm = { quantity: string; cost: string; notes: string };

type Props = {
  item: InventoryItemWithAlert | null;
  onClose: () => void;
};

export const RestockModal = ({ item, onClose }: Props) => {
  const { recordTransaction } = useInventory();
  const [form, setForm] = useState<RestockForm>({ quantity: "", cost: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) { setForm({ quantity: "", cost: "", notes: "" }); setError(null); }
  }, [item]);

  const set = <K extends keyof RestockForm>(k: K, v: RestockForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const qty = parseInt(form.quantity);
    if (!qty || qty < 1) return setError("Quantity must be at least 1.");
    setLoading(true);
    try {
      const cost = form.cost ? parseFloat(form.cost) : undefined;
      await recordTransaction({
        item_id: item!.item_id,
        transaction_type: "restock" as TransactionType,
        quantity: qty,
        price_per_unit: cost,
        total_amount: cost ? cost * qty : undefined,
        notes: form.notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record restock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFormModal
      open={!!item}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={`Restock — ${item?.item_name ?? ""}`}
      size="compact"
      onSubmit={handleSubmit}
      submitLabel="Record Restock"
      loading={loading}
      error={error}
    >
      <ModalField label="Quantity to Add" required htmlFor="restock-qty">
        <Input
          id="restock-qty"
          type="number"
          min={1}
          placeholder="10"
          value={form.quantity}
          onChange={(e) => set("quantity", e.target.value)}
        />
      </ModalField>
      <ModalField label="Cost Per Unit" htmlFor="restock-cost" helper="Optional">
        <Input
          id="restock-cost"
          type="number"
          step="0.01"
          placeholder="10.00"
          value={form.cost}
          onChange={(e) => set("cost", e.target.value)}
        />
      </ModalField>
      <ModalField label="Notes" htmlFor="restock-notes" helper="Optional">
        <Textarea
          id="restock-notes"
          placeholder="Supplier, PO number..."
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </ModalField>
    </AppFormModal>
  );
};
