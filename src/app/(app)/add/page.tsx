"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, PenLine, Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemForm } from "@/components/inventory/item-form";
import { CameraCapture } from "@/components/camera/camera-capture";
import {
  ScannedItemRow,
  type ScannedItemDraft,
} from "@/components/inventory/scanned-item-row";
import { useInventory } from "@/lib/hooks/use-inventory";
import { useHousehold } from "@/components/providers/household-provider";
import { uploadScanImage } from "@/lib/firebase/storage";
import type { CreateItemInput, Category, Unit } from "@/lib/schemas/item";
import { CATEGORIES, UNITS } from "@/lib/schemas/item";
import { toast } from "sonner";

type AddMode = "choose" | "manual" | "camera" | "scanning" | "review";

function addDaysToToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function toValidCategory(raw: string): Category {
  return CATEGORIES.includes(raw as Category) ? (raw as Category) : "other";
}

function toValidUnit(raw: string): Unit {
  return UNITS.includes(raw as Unit) ? (raw as Unit) : "item";
}

type CapturedImage = { base64: string; mimeType: string };

export default function AddPage() {
  const router = useRouter();
  const { addItem, addItems, updateItem } = useInventory();
  const { household } = useHousehold();
  const [mode, setMode] = useState<AddMode>("choose");
  const [scannedItems, setScannedItems] = useState<ScannedItemDraft[]>([]);
  const [capturedImages, setCapturedImages] = useState<Map<string, CapturedImage>>(new Map());
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCapture = useCallback(
    async (imageBase64: string, mimeType: string) => {
      setMode("scanning");
      setScanning(true);

      const batchId = `batch-${Date.now()}`;

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageBase64, mimeType }),
        });

        if (!response.ok) throw new Error("Scan failed");

        const { items } = await response.json();

        if (!items || items.length === 0) {
          toast.error("No items detected. Try a clearer photo.");
          setMode("camera");
          return;
        }

        // Store the image for this batch
        setCapturedImages((prev) => {
          const next = new Map(prev);
          next.set(batchId, { base64: imageBase64, mimeType });
          return next;
        });

        const drafts: ScannedItemDraft[] = items.map(
          (item: {
            name: string;
            category: string;
            quantity: number;
            unit: string;
            estimatedExpirationDays: number;
          }, i: number) => ({
            id: `scanned-${i}-${batchId}`,
            name: item.name,
            category: toValidCategory(item.category),
            quantity: item.quantity || 1,
            unit: toValidUnit(item.unit),
            expirationDate: addDaysToToday(item.estimatedExpirationDays || 7),
            scanBatchId: batchId,
          }),
        );

        setScannedItems((prev) => [...prev, ...drafts]);
        setMode("review");
        toast.success(`Found ${drafts.length} item${drafts.length !== 1 ? "s" : ""}`);
      } catch (err) {
        console.error("Scan error:", err);
        toast.error("Failed to scan image. Try again.");
        setMode("camera");
      } finally {
        setScanning(false);
      }
    },
    [],
  );

  async function handleManualAdd(data: CreateItemInput) {
    try {
      await addItem(data);
      toast.success(`Added ${data.name}`);
      router.push("/inventory");
    } catch {
      toast.error("Failed to add item");
    }
  }

  async function handleSaveScanned() {
    const validItems = scannedItems.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      toast.error("No items to save");
      return;
    }

    setSaving(true);
    try {
      // Save items immediately without waiting for image upload
      const inputs: CreateItemInput[] = validItems.map((item) => ({
        name: item.name.trim(),
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expirationDate: new Date(item.expirationDate + "T00:00:00"),
        notes: "",
        imageUrl: null,
      }));

      const docIds = await addItems(inputs);
      toast.success(
        `Added ${inputs.length} item${inputs.length !== 1 ? "s" : ""} to your fridge`,
      );
      router.push("/inventory");

      // Upload images in background, then update items with the URL
      if (household) {
        const batchIds = new Set(
          validItems.map((item) => item.scanBatchId).filter(Boolean) as string[],
        );
        for (const batchId of batchIds) {
          const img = capturedImages.get(batchId);
          if (!img) continue;
          uploadScanImage(household.id, img.base64, img.mimeType)
            .then((url) => {
              // Update all items from this batch with the image URL
              validItems.forEach((item, i) => {
                if (item.scanBatchId === batchId && docIds[i]) {
                  updateItem(docIds[i], { imageUrl: url }).catch(() => {});
                }
              });
            })
            .catch((err) =>
              console.error("Background image upload failed:", err),
            );
        }
      }
    } catch {
      toast.error("Failed to save items");
    } finally {
      setSaving(false);
    }
  }

  function updateScannedItem(id: string, updated: ScannedItemDraft) {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
  }

  function removeScannedItem(id: string) {
    setScannedItems((prev) => prev.filter((item) => item.id !== id));
  }

  // Mode: choose
  if (mode === "choose") {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold italic tracking-tight">
          Add items
        </h1>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("camera")}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Scan</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Photo or receipt
              </p>
            </div>
          </button>
          <button
            onClick={() => setMode("manual")}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <PenLine className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Manual</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Type it in
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Mode: manual
  if (mode === "manual") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("choose")}
            className="text-muted-foreground"
          >
            Back
          </Button>
          <h1 className="font-heading text-xl font-semibold italic tracking-tight">
            Add manually
          </h1>
        </div>
        <ItemForm onSubmit={handleManualAdd} />
      </div>
    );
  }

  // Mode: camera
  if (mode === "camera") {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-xl font-semibold italic tracking-tight">
          Scan groceries
        </h1>
        <p className="text-sm text-muted-foreground">
          Take a photo of your groceries or receipt
        </p>
        <CameraCapture
          onCapture={handleCapture}
          onCancel={() => setMode("choose")}
        />
      </div>
    );
  }

  // Mode: scanning (loading)
  if (mode === "scanning" || scanning) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium">Analyzing your groceries...</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This usually takes a few seconds
          </p>
        </div>
      </div>
    );
  }

  // Mode: review
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold italic tracking-tight">
            Review items
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {scannedItems.length} item{scannedItems.length !== 1 ? "s" : ""}{" "}
            detected. Edit or remove before saving.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {scannedItems.map((item) => (
          <ScannedItemRow
            key={item.id}
            item={item}
            onChange={(updated) => updateScannedItem(item.id, updated)}
            onRemove={() => removeScannedItem(item.id)}
          />
        ))}
      </div>

      {scannedItems.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          All items removed. Scan again or add manually.
        </p>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={() => setMode("camera")}
        >
          <Camera className="mr-2 h-4 w-4" />
          Scan more
        </Button>
        <Button
          className="flex-1 rounded-xl"
          onClick={handleSaveScanned}
          disabled={scannedItems.length === 0 || saving}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PackageCheck className="mr-2 h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save all"}
        </Button>
      </div>
    </div>
  );
}
