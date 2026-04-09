"use client";

import { ShoppingCart } from "lucide-react";

export default function ShoppingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Shopping list</h1>
      <div className="py-12 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">Coming soon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-populated shopping lists based on what&apos;s expired or running
          low
        </p>
      </div>
    </div>
  );
}
