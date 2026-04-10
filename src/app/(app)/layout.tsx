"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HouseholdGate } from "@/components/layout/household-gate";
import { NotificationProvider } from "@/components/providers/notification-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <NotificationProvider>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-20 pt-4">
          <HouseholdGate>{children}</HouseholdGate>
        </main>
      </NotificationProvider>
      <BottomNav />
    </div>
  );
}
