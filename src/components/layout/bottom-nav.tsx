"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Refrigerator,
  Plus,
  ShoppingCart,
  BookOpen,
} from "lucide-react";
import { useInventory } from "@/lib/hooks/use-inventory";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, badge: "expiring" as const },
  { href: "/inventory", label: "Fridge", icon: Refrigerator },
  { href: "/add", label: "Add", icon: Plus, special: true },
  { href: "/shopping", label: "Shop", icon: ShoppingCart },
  { href: "/recipes", label: "Recipes", icon: BookOpen },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useInventory();

  const urgentCount = items.filter(
    (i) =>
      i.expirationStatus === "expired" ||
      i.expirationStatus === "expires_today" ||
      i.expirationStatus === "expiring_soon",
  ).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-lg grid-cols-5 py-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, ...rest }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);
          const isSpecial = "special" in rest && rest.special;
          const showBadge =
            "badge" in rest && rest.badge === "expiring" && urgentCount > 0;

          if (isSpecial) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 py-1"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                    {urgentCount > 99 ? "99+" : urgentCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
