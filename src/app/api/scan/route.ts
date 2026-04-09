import { NextRequest, NextResponse } from "next/server";
import { scanGroceryImage } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType } = body as {
      image: string;
      mimeType: string;
    };

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Missing image or mimeType" },
        { status: 400 },
      );
    }

    const items = await scanGroceryImage(image, mimeType);

    return NextResponse.json({ items });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: "Failed to scan image" },
      { status: 500 },
    );
  }
}
