"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useHousehold } from "@/components/providers/household-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/layout/logo";

export function Header() {
  const { user } = useAuth();
  const { household } = useHousehold();

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" className="text-primary" />
          {household && (
            <>
              <span className="text-border">|</span>
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {household.name}
              </span>
            </>
          )}
        </div>
        <Link href="/settings">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
