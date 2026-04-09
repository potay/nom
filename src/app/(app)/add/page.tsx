"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/inventory/item-form";
import { useInventory } from "@/lib/hooks/use-inventory";
import type { CreateItemInput } from "@/lib/schemas/item";
import { toast } from "sonner";

export default function AddPage() {
  const router = useRouter();
  const { addItem } = useInventory();
  const [mode, setMode] = useState<"manual" | "camera">("manual");

  async function handleAdd(data: CreateItemInput) {
    try {
      await addItem(data);
      toast.success(`Added ${data.name}`);
      router.push("/inventory");
    } catch {
      toast.error("Failed to add item");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Add items</h1>

      <div className="flex gap-2">
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("manual")}
        >
          Manual entry
        </Button>
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("camera")}
        >
          <Camera className="mr-2 h-4 w-4" />
          Scan
        </Button>
      </div>

      {mode === "manual" ? (
        <ItemForm onSubmit={handleAdd} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground">
          <Camera className="h-12 w-12" />
          <p className="text-sm">Camera scanning coming soon!</p>
          <p className="text-xs">
            Take a photo of your groceries or receipt and AI will detect the
            items.
          </p>
        </div>
      )}
    </div>
  );
}
