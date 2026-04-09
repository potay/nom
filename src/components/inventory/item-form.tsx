"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, UNITS, type CreateItemInput } from "@/lib/schemas/item";
import { CATEGORY_META } from "@/lib/utils/categories";

type ItemFormProps = {
  defaultValues?: Partial<CreateItemInput>;
  onSubmit: (data: CreateItemInput) => Promise<void>;
  submitLabel?: string;
};

export function ItemForm({
  defaultValues,
  onSubmit,
  submitLabel = "Add item",
}: ItemFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [category, setCategory] = useState(defaultValues?.category ?? "other");
  const [quantity, setQuantity] = useState(
    String(defaultValues?.quantity ?? 1),
  );
  const [unit, setUnit] = useState(defaultValues?.unit ?? "item");
  const [expirationDate, setExpirationDate] = useState(
    defaultValues?.expirationDate
      ? formatDateForInput(defaultValues.expirationDate)
      : "",
  );
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !expirationDate) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        quantity: Number(quantity),
        unit,
        expirationDate: new Date(expirationDate + "T00:00:00"),
        notes: notes.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="item-name">Name</Label>
        <Input
          id="item-name"
          placeholder="e.g. Milk, Chicken breast"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-category">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger id="item-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="item-quantity">Quantity</Label>
          <Input
            id="item-quantity"
            type="number"
            min={0.1}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="item-unit">Unit</Label>
          <Select value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
            <SelectTrigger id="item-unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-expiration">Expiration date</Label>
        <Input
          id="item-expiration"
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="item-notes">Notes (optional)</Label>
        <Textarea
          id="item-notes"
          placeholder="Any extra details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}
