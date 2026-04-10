"use client";

import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpirationBadge } from "@/components/inventory/expiration-badge";
import { CATEGORY_META } from "@/lib/utils/categories";
import { cn } from "@/lib/utils";
import type { ItemWithStatus } from "@/lib/hooks/use-inventory";

type ItemCardProps = {
  item: ItemWithStatus;
  onEdit: (item: ItemWithStatus) => void;
  onDelete: (item: ItemWithStatus) => void;
  isDuplicate?: boolean;
};

export function ItemCard({ item, onEdit, onDelete, isDuplicate }: ItemCardProps) {
  const categoryMeta = CATEGORY_META[item.category];
  const CategoryIcon = categoryMeta.icon;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-sm",
        isDuplicate
          ? "border-warm/40 bg-warm/5"
          : "border-border/60",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <CategoryIcon className="h-4.5 w-4.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{item.name}</p>
          {isDuplicate && (
            <span className="shrink-0 rounded-md bg-warm/15 px-1.5 py-0.5 text-[10px] font-medium text-warm-foreground">
              dupe?
            </span>
          )}
          <ExpirationBadge
            expirationDate={item.expirationDate}
            status={item.expirationStatus}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {item.quantity} {item.unit}
          {item.quantity !== 1 && item.unit !== "item" ? "s" : ""}
          <span className="mx-1 text-border">·</span>
          {categoryMeta.label}
        </p>
      </div>
      <div className="flex shrink-0 gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
