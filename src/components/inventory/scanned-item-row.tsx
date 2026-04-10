"use client";

import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, UNITS, type Category, type Unit } from "@/lib/schemas/item";
import { CATEGORY_META } from "@/lib/utils/categories";

export type ScannedItemDraft = {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  expirationDate: string; // YYYY-MM-DD
  scanBatchId?: string;
};

type ScannedItemRowProps = {
  item: ScannedItemDraft;
  onChange: (updated: ScannedItemDraft) => void;
  onRemove: () => void;
};

export function ScannedItemRow({ item, onChange, onRemove }: ScannedItemRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      {/* Collapsed: name + category + expiration + actions */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            value={item.name}
            onChange={(e) => onChange({ ...item, name: e.target.value })}
            className="h-8 rounded-lg border-0 bg-transparent p-0 text-sm font-medium shadow-none focus-visible:ring-0"
            placeholder="Item name"
          />
        </div>
        <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
          {CATEGORY_META[item.category]?.label ?? item.category}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Expanded: full edit fields */}
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/40 pt-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Category</Label>
            <Select
              value={item.category}
              onValueChange={(v) => onChange({ ...item, category: v as Category })}
            >
              <SelectTrigger className="h-8 rounded-lg text-xs">
                <SelectValue>
                  {CATEGORY_META[item.category]?.label ?? item.category}
                </SelectValue>
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
          <div className="space-y-1 min-w-0">
            <Label className="text-[11px] text-muted-foreground">Expiration</Label>
            <Input
              type="date"
              value={item.expirationDate}
              onChange={(e) =>
                onChange({ ...item, expirationDate: e.target.value })
              }
              className="h-8 min-w-0 rounded-lg text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Quantity</Label>
            <Input
              type="number"
              min={0.1}
              step="any"
              value={item.quantity}
              onChange={(e) =>
                onChange({ ...item, quantity: Number(e.target.value) })
              }
              className="h-8 rounded-lg text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Unit</Label>
            <Select
              value={item.unit}
              onValueChange={(v) => onChange({ ...item, unit: v as Unit })}
            >
              <SelectTrigger className="h-8 rounded-lg text-xs">
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
      )}
    </div>
  );
}
