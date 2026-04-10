import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase/config";

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // Store subscription keyed by endpoint hash
    const endpoint = subscription.endpoint;
    const id = Buffer.from(endpoint).toString("base64url").slice(0, 64);

    await setDoc(doc(getDb(), "pushSubscriptions", id), {
      ...subscription,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 },
    );
  }
}
