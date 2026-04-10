"use client";

import { useState, useMemo } from "react";
import { Search, ArrowDownAZ, Clock, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useInventory, type ItemWithStatus } from "@/lib/hooks/use-inventory";
import { useShoppingList } from "@/lib/hooks/use-shopping-list";
import { ItemCard } from "@/components/inventory/item-card";
import { ItemForm } from "@/components/inventory/item-form";
import { CategoryFilter } from "@/components/inventory/category-filter";
import { CATEGORY_META } from "@/lib/utils/categories";
import type { Category, CreateItemInput } from "@/lib/schemas/item";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SortMode = "name" | "expiration" | "category";

const SORT_OPTIONS: { value: SortMode; label: string; icon: typeof ArrowDownAZ }[] = [
  { value: "name", label: "Name", icon: ArrowDownAZ },
  { value: "expiration", label: "Expiry", icon: Clock },
  { value: "category", label: "Category", icon: Tag },
];

function sortItems(items: ItemWithStatus[], mode: SortMode): ItemWithStatus[] {
  const sorted = [...items];
  switch (mode) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "expiration":
      return sorted.sort(
        (a, b) => a.expirationDate.getTime() - b.expirationDate.getTime(),
      );
    case "category":
      return sorted.sort((a, b) => {
        const cmp = a.category.localeCompare(b.category);
        return cmp !== 0 ? cmp : a.name.localeCompare(b.name);
      });
  }
}

/** Find items with similar names (potential duplicates). */
function findDuplicateGroups(items: ItemWithStatus[]): Map<string, ItemWithStatus[]> {
  const groups = new Map<string, ItemWithStatus[]>();
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  // Only return groups with 2+ items
  const dupes = new Map<string, ItemWithStatus[]>();
  for (const [key, group] of groups) {
    if (group.length > 1) {
      dupes.set(key, group);
    }
  }
  return dupes;
}

export default function InventoryPage() {
  const { items, loading, updateItem, removeItem } = useInventory();
  const { addExpiredToList } = useShoppingList();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [editingItem, setEditingItem] = useState<ItemWithStatus | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemWithStatus | null>(null);

  const duplicateGroups = useMemo(() => findDuplicateGroups(items), [items]);
  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    for (const group of duplicateGroups.values()) {
      for (const item of group) {
        ids.add(item.id);
      }
    }
    return ids;
  }, [duplicateGroups]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    return sortItems(result, sortMode);
  }, [items, selectedCategory, searchQuery, sortMode]);

  async function handleAddToShoppingList(item: ItemWithStatus) {
    try {
      await addExpiredToList(item.name, item.category);
      toast.success(`Added ${item.name} to shopping list`);
    } catch {
      toast.error("Failed to add to shopping list");
    }
  }

  async function handleEdit(data: CreateItemInput) {
    if (!editingItem) return;
    try {
      await updateItem(editingItem.id, data);
      setEditingItem(null);
      toast.success("Item updated");
    } catch {
      toast.error("Failed to update item");
    }
  }

  async function confirmDelete() {
    if (!deletingItem) return;
    try {
      await removeItem(deletingItem.id);
      setDeletingItem(null);
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
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
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold italic tracking-tight">
        Fridge inventory
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-xl pl-9"
        />
      </div>

      {/* Sort + category row */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Sort:</span>
          {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSortMode(value)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all",
                sortMode === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Duplicate warning */}
      {duplicateGroups.size > 0 && !searchQuery && !selectedCategory && (
        <div className="rounded-xl border border-warm/30 bg-warm/5 px-3 py-2 text-xs text-warm-foreground">
          <span className="font-medium">
            {duplicateGroups.size} potential duplicate{duplicateGroups.size !== 1 ? "s" : ""}
          </span>
          {" found. Items with the same name are highlighted."}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm">
            {items.length === 0
              ? "Your fridge is empty. Add some items!"
              : "No items match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortMode === "category"
            ? renderGroupedByCategory(filteredItems, duplicateIds)
            : filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onEdit={setEditingItem}
                  onDelete={setDeletingItem}
                  onAddToShoppingList={handleAddToShoppingList}
                  isDuplicate={duplicateIds.has(item.id)}
                />
              ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ItemForm
              defaultValues={editingItem}
              onSubmit={handleEdit}
              submitLabel="Save changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deletingItem !== null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove item?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {deletingItem?.name}
              </span>{" "}
              from your fridge?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setDeletingItem(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={confirmDelete}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderGroupedByCategory(
    sortedItems: ItemWithStatus[],
    dupeIds: Set<string>,
  ) {
    const groups = new Map<Category, ItemWithStatus[]>();
    for (const item of sortedItems) {
      const existing = groups.get(item.category);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(item.category, [item]);
      }
    }

    return Array.from(groups.entries()).map(([category, categoryItems]) => (
      <div key={category}>
        <p className="mb-1.5 mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground first:mt-0">
          {(() => {
            const Icon = CATEGORY_META[category].icon;
            return <Icon className="h-3.5 w-3.5" />;
          })()}
          {CATEGORY_META[category].label}
          <span className="text-border">({categoryItems.length})</span>
        </p>
        <div className="space-y-2">
          {categoryItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
              onAddToShoppingList={handleAddToShoppingList}
              isDuplicate={dupeIds.has(item.id)}
            />
          ))}
        </div>
      </div>
    ));
  }
}
