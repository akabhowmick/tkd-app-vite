import { useState } from "react";
import { useBelts } from "../../../../context/BeltContext";
import { BeltRank } from "../../../../types/belts";
import { AppFormModal, ModalField } from "../../../ui/modal";
import { Input } from "../../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { BeltPreview, BELT_COLORS } from "./beltUtils";

type RankForm = {
  rank_name: string;
  rank_order: string;
  color_code: string;
  stripe_color: string;
};

const emptyForm = (): RankForm => ({
  rank_name: "",
  rank_order: "1",
  color_code: "#FFFFFF",
  stripe_color: "",
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ranks: BeltRank[];
};

export const CreateRankModal = ({ open, onOpenChange, ranks }: Props) => {
  const { createRank } = useBelts();
  const [form, setForm] = useState<RankForm>(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof RankForm>(k: K, v: RankForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const conflict = ranks.find((r) => r.rank_order === parseInt(form.rank_order));

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm(emptyForm());
      setError(null);
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.rank_name.trim()) {
      setError("Rank name is required.");
      return;
    }
    setLoading(true);
    try {
      await createRank({
        rank_name: form.rank_name.trim(),
        rank_order: parseInt(form.rank_order) || 1,
        color_code: form.color_code,
        stripe_color: form.stripe_color || undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rank.");
    } finally {
      setLoading(false);
    }
  };

  const ColorOption = ({ value, label }: { value: string; label: string }) => (
    <SelectItem value={value}>
      <span className="flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-sm border border-border"
          style={{ backgroundColor: value }}
        />
        {label}
      </span>
    </SelectItem>
  );

  return (
    <AppFormModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Create Belt Rank"
      size="compact"
      onSubmit={handleSubmit}
      submitLabel="Create Rank"
      loading={loading}
      submitDisabled={!!conflict}
      error={error}
    >
      <ModalField label="Rank Name" required htmlFor="rank-name">
        <Input
          id="rank-name"
          placeholder="e.g., White Belt"
          value={form.rank_name}
          onChange={(e) => set("rank_name", e.target.value)}
        />
      </ModalField>

      <ModalField label="Rank Order" required htmlFor="rank-order">
        <Input
          id="rank-order"
          type="number"
          min={1}
          placeholder="1"
          value={form.rank_order}
          onChange={(e) => set("rank_order", e.target.value)}
          className={conflict ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {conflict && (
          <p className="mt-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
            Order {form.rank_order} is already taken by &ldquo;{conflict.rank_name}&rdquo;. Choose a
            different number.
          </p>
        )}
      </ModalField>

      <ModalField label="Color" required htmlFor="color-code">
        <div className="flex items-center gap-3">
          <BeltPreview color={form.color_code} stripe={form.stripe_color} />
          <Select value={form.color_code} onValueChange={(v) => set("color_code", v)}>
            <SelectTrigger id="color-code" className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BELT_COLORS.map((c) => (
                <ColorOption key={c.value} {...c} />
              ))}
            </SelectContent>
          </Select>
        </div>
      </ModalField>

      <ModalField
        label="Stripe Color"
        htmlFor="stripe-color"
        helper="Optional — for in-between ranks (e.g. red-white-red)"
      >
        <Select
          value={form.stripe_color || "none"}
          onValueChange={(v) => set("stripe_color", v === "none" ? "" : v)}
        >
          <SelectTrigger id="stripe-color">
            <SelectValue placeholder="No stripe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No stripe</SelectItem>
            {BELT_COLORS.map((c) => (
              <ColorOption key={c.value} {...c} />
            ))}
          </SelectContent>
        </Select>
      </ModalField>
    </AppFormModal>
  );
};
