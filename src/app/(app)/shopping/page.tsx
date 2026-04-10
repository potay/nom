"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Check,
  X,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useShoppingList } from "@/lib/hooks/use-shopping-list";
import { CATEGORIES, type Category } from "@/lib/schemas/item";
import { CATEGORY_META } from "@/lib/utils/categories";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ShoppingPage() {
  const {
    unchecked,
    checked,
    loading,
    addItem,
    toggleChecked,
    removeItem,
    clearChecked,
  } = useShoppingList();

  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<Category | undefined>(
    undefined,
  );
  const [showClearDialog, setShowClearDialog] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      await addItem({
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: 1,
        unit: "item",
      });
      setNewItemName("");
      setNewItemCategory(undefined);
    } catch {
      toast.error("Failed to add item");
    }
  }

  async function handleToggle(id: string, currentChecked: boolean) {
    try {
      await toggleChecked(id, !currentChecked);
    } catch {
      toast.error("Failed to update item");
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeItem(id);
    } catch {
      toast.error("Failed to remove item");
    }
  }

  async function handleClearChecked() {
    try {
      await clearChecked();
      setShowClearDialog(false);
      toast.success("Cleared checked items");
    } catch {
      toast.error("Failed to clear items");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-semibold italic tracking-tight">
        Shopping list
      </h1>

      {/* Quick add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Add an item..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <Select
          value={newItemCategory ?? ""}
          onValueChange={(v) =>
            setNewItemCategory(v ? (v as Category) : undefined)
          }
        >
          <SelectTrigger className="w-[110px] rounded-xl text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_META[cat].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="submit"
          size="icon"
          className="shrink-0 rounded-xl"
          disabled={!newItemName.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Unchecked items */}
      {unchecked.length > 0 ? (
        <div className="space-y-1.5">
          {unchecked.map((item) => (
            <ShoppingItemRow
              key={item.id}
              name={item.name}
              category={item.category}
              source={item.source}
              checked={false}
              onToggle={() => handleToggle(item.id, false)}
              onRemove={() => handleRemove(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5">
            <ShoppingCart className="h-8 w-8 text-primary/40" />
          </div>
          <p className="mt-4 font-heading text-base font-semibold italic">
            List is empty
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add items you need to buy
          </p>
        </div>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Done ({checked.length})
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setShowClearDialog(true)}
            >
              <ListChecks className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          </div>
          <div className="space-y-1.5">
            {checked.map((item) => (
              <ShoppingItemRow
                key={item.id}
                name={item.name}
                category={item.category}
                source={item.source}
                checked={true}
                onToggle={() => handleToggle(item.id, true)}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Clear checked dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear checked items?</DialogTitle>
            <DialogDescription>
              Remove all {checked.length} checked item
              {checked.length !== 1 ? "s" : ""} from the list?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowClearDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleClearChecked}
            >
              Clear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShoppingItemRow({
  name,
  category,
  source,
  checked,
  onToggle,
  onRemove,
}: {
  name: string;
  category?: Category;
  source: string;
  checked: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const categoryMeta = category ? CATEGORY_META[category] : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-all",
        checked && "opacity-50",
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary/50",
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            checked && "line-through text-muted-foreground",
          )}
        >
          {name}
        </p>
        <div className="flex items-center gap-1.5">
          {categoryMeta && (
            <span className="text-[11px] text-muted-foreground">
              {categoryMeta.label}
            </span>
          )}
          {source !== "manual" && (
            <span className="rounded bg-warm/10 px-1 py-0.5 text-[10px] text-warm-foreground">
              {source === "auto_expired" ? "expired" : "low"}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
