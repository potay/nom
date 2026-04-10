"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

function getPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window))
    return "default";
  return Notification.permission;
}

function subscribeToPermission(callback: () => void) {
  const interval = setInterval(callback, 5000);
  return () => clearInterval(interval);
}

async function registerAndSubscribe() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.register("/push-sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        VAPID_PUBLIC_KEY,
      ) as BufferSource,
    });
  }

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const permission = useSyncExternalStore(
    subscribeToPermission,
    getPermission,
    () => "default" as NotificationPermission,
  );

  const registered = useRef(false);

  useEffect(() => {
    if (permission === "granted" && !registered.current) {
      registered.current = true;
      registerAndSubscribe().catch(console.error);
    }
  }, [permission]);

  const handleEnable = useCallback(async () => {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      await registerAndSubscribe();
    }
  }, []);

  if (permission !== "default") {
    return <>{children}</>;
  }

  return (
    <>
      <div className="mx-auto max-w-lg px-4 pt-2">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">Enable notifications</p>
            <p className="text-[11px] text-muted-foreground">
              Get alerts when food is about to expire
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 rounded-lg text-xs"
            onClick={handleEnable}
          >
            Enable
          </Button>
        </div>
      </div>
      {children}
    </>
  );
}
