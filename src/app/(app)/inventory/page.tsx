"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInventory, type ItemWithStatus } from "@/lib/hooks/use-inventory";
import { ItemCard } from "@/components/inventory/item-card";
import { ItemForm } from "@/components/inventory/item-form";
import { CategoryFilter } from "@/components/inventory/category-filter";
import type { Category, CreateItemInput } from "@/lib/schemas/item";
import { toast } from "sonner";

export default function InventoryPage() {
  const { items, loading, updateItem, removeItem } = useInventory();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<ItemWithStatus | null>(null);

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    return result;
  }, [items, selectedCategory, searchQuery]);

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

  async function handleDelete(id: string) {
    try {
      await removeItem(id);
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
    <div className="space-y-5">
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

      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

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
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

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
    </div>
  );
}
