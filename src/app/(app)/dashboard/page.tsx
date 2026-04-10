"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Refrigerator,
  Plus,
  Leaf,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
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
import type { CreateItemInput } from "@/lib/schemas/item";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const { items, loading, updateItem, removeItem } = useInventory();
  const { addExpiredToList } = useShoppingList();
  const [editingItem, setEditingItem] = useState<ItemWithStatus | null>(null);
  const [deletingItem, setDeletingItem] = useState<ItemWithStatus | null>(null);

  const { expired, expiringSoon, totalCount } = useMemo(() => {
    const expired = items.filter((i) => i.expirationStatus === "expired");
    const expiringSoon = items.filter(
      (i) =>
        i.expirationStatus === "expiring_soon" ||
        i.expirationStatus === "expires_today",
    );
    return { expired, expiringSoon, totalCount: items.length };
  }, [items]);

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

  async function handleAddToShoppingList(item: ItemWithStatus) {
    try {
      await addExpiredToList(item.name, item.category);
      toast.success(`Added ${item.name} to shopping list`);
    } catch {
      toast.error("Failed to add to shopping list");
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
    <div className="space-y-8">
      {/* Hero greeting */}
      <div>
        <h1 className="font-heading text-2xl font-semibold italic tracking-tight">
          Your kitchen
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {totalCount === 0
            ? "Nothing tracked yet"
            : `${totalCount} item${totalCount !== 1 ? "s" : ""} in the fridge`}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-primary/5 shadow-none">
          <CardContent className="flex flex-col items-center py-4 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Refrigerator className="h-4.5 w-4.5 text-primary" />
            </div>
            <p className="mt-2 font-heading text-2xl font-semibold tabular-nums">
              {totalCount}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Items
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-[#FDF6EC] shadow-none">
          <CardContent className="flex flex-col items-center py-4 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warm/15">
              <Clock className="h-4.5 w-4.5 text-warm" />
            </div>
            <p className="mt-2 font-heading text-2xl font-semibold tabular-nums">
              {expiringSoon.length}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Expiring
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-destructive/5 shadow-none">
          <CardContent className="flex flex-col items-center py-4 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
            </div>
            <p className="mt-2 font-heading text-2xl font-semibold tabular-nums">
              {expired.length}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Expired
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring soon section */}
      {expiringSoon.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-warm/15">
              <Clock className="h-3.5 w-3.5 text-warm" />
            </div>
            <h2 className="text-sm font-semibold">Expiring soon</h2>
            <span className="rounded-full bg-warm/10 px-2 py-0.5 text-[11px] font-medium text-warm-foreground">
              {expiringSoon.length}
            </span>
          </div>
          <div className="space-y-2">
            {expiringSoon.slice(0, 5).map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={setEditingItem}
                onDelete={setDeletingItem}
                onAddToShoppingList={handleAddToShoppingList}
              />
            ))}
            {expiringSoon.length > 5 && (
              <Link
                href="/inventory"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full text-muted-foreground",
                )}
              >
                View all {expiringSoon.length} expiring items
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Expired section */}
      {expired.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/10">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </div>
            <h2 className="text-sm font-semibold">Expired</h2>
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
              {expired.length}
            </span>
          </div>
          <div className="space-y-2">
            {expired.slice(0, 5).map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={setEditingItem}
                onDelete={setDeletingItem}
                onAddToShoppingList={handleAddToShoppingList}
              />
            ))}
            {expired.length > 5 && (
              <Link
                href="/inventory"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full text-muted-foreground",
                )}
              >
                View all {expired.length} expired items
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/5">
            <Leaf className="h-10 w-10 text-primary/40" />
          </div>
          <p className="mt-6 font-heading text-lg font-semibold italic">
            Your fridge is empty
          </p>
          <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">
            Add items to start tracking what&apos;s fresh and what needs
            replacing
          </p>
          <Link
            href="/add"
            className={cn(buttonVariants(), "mt-6 gap-2 rounded-xl px-6")}
          >
            <Plus className="h-4 w-4" />
            Add your first item
          </Link>
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
}
