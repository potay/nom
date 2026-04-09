"use client";

import { CATEGORIES, type Category } from "@/lib/schemas/item";
import { CATEGORY_META } from "@/lib/utils/categories";
import { cn } from "@/lib/utils";

type CategoryFilterProps = {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
};

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
          selected === null
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary text-muted-foreground hover:text-foreground",
        )}
      >
        All
      </button>
      {CATEGORIES.map((cat) => {
        const meta = CATEGORY_META[cat];
        const Icon = meta.icon;
        return (
          <button
            key={cat}
            onClick={() => onSelect(selected === cat ? null : cat)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              selected === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3 w-3" />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
