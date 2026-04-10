import { NextResponse } from "next/server";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";
import { getWebPush } from "@/lib/web-push";

/**
 * GET /api/push/check
 * Check for expiring items and send push notifications to all subscribers.
 * Call this from a Cloud Scheduler job daily.
 */
export async function GET() {
  try {
    const db = getDb();
    const webpush = getWebPush();

    // Find items expiring within 2 days across all households
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const householdsSnap = await getDocs(collection(db, "households"));
    const notifications: { householdName: string; expiringItems: string[] }[] =
      [];

    for (const householdDoc of householdsSnap.docs) {
      const householdData = householdDoc.data();
      const itemsSnap = await getDocs(
        query(
          collection(db, `households/${householdDoc.id}/items`),
          where("expirationDate", "<=", Timestamp.fromDate(twoDaysFromNow)),
          where("expirationDate", ">=", Timestamp.fromDate(now)),
        ),
      );

      if (itemsSnap.size > 0) {
        const itemNames = itemsSnap.docs.map((d) => d.data().name);
        notifications.push({
          householdName: householdData.name,
          expiringItems: itemNames,
        });
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json({ sent: 0, message: "No expiring items" });
    }

    // Get all push subscriptions
    const subsSnap = await getDocs(collection(db, "pushSubscriptions"));
    let sent = 0;

    for (const subDoc of subsSnap.docs) {
      const sub = subDoc.data();
      for (const notif of notifications) {
        const count = notif.expiringItems.length;
        const body =
          count === 1
            ? `${notif.expiringItems[0]} expires soon`
            : `${count} items expiring soon: ${notif.expiringItems.slice(0, 3).join(", ")}${count > 3 ? "..." : ""}`;

        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            JSON.stringify({
              title: `Nom - ${notif.householdName}`,
              body,
              tag: "expiring-items",
              url: "/dashboard",
            }),
          );
          sent++;
        } catch (err) {
          console.error("Push send failed:", err);
          // If subscription is expired/invalid, could delete it here
        }
      }
    }

    return NextResponse.json({ sent, notifications: notifications.length });
  } catch (err) {
    console.error("Push check error:", err);
    return NextResponse.json(
      { error: "Failed to check and send notifications" },
      { status: 500 },
    );
  }
}
