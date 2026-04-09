import {
  Apple,
  Egg,
  Beef,
  Snowflake,
  GlassWater,
  Droplets,
  Wheat,
  Cookie,
  UtensilsCrossed,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "@/lib/schemas/item";

type CategoryMeta = {
  label: string;
  icon: LucideIcon;
};

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  produce: { label: "Produce", icon: Apple },
  "dairy-eggs": { label: "Dairy & Eggs", icon: Egg },
  "meat-seafood": { label: "Meat & Seafood", icon: Beef },
  frozen: { label: "Frozen", icon: Snowflake },
  beverages: { label: "Beverages", icon: GlassWater },
  "condiments-sauces": { label: "Condiments & Sauces", icon: Droplets },
  "grains-bread": { label: "Grains & Bread", icon: Wheat },
  snacks: { label: "Snacks", icon: Cookie },
  leftovers: { label: "Leftovers", icon: UtensilsCrossed },
  other: { label: "Other", icon: Package },
};

export function getCategoryLabel(category: Category): string {
  return CATEGORY_META[category].label;
}

export function getCategoryIcon(category: Category): LucideIcon {
  return CATEGORY_META[category].icon;
}
