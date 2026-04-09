import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ScannedItem = {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedExpirationDays: number;
};

const SCAN_PROMPT = `You are a grocery item scanner. Analyze this image carefully and extract every distinct food or grocery item visible.

RULES:
1. List each item separately. If there are 3 apples, that's one item with quantity 3.
2. Be specific with names: "Organic whole milk" not just "milk", "Boneless chicken thighs" not just "chicken".
3. For receipts: extract each line item. Ignore non-food items (bags, tax, totals).
4. FROZEN DETECTION is critical:
   - If packaging says "frozen", if items are visibly in frozen food packaging, or if the image shows items in a freezer section, categorize as "frozen"
   - Frozen meat/seafood goes in "frozen", NOT "meat-seafood"
   - Fresh/refrigerated meat goes in "meat-seafood"
   - Frozen vegetables, frozen meals, ice cream, etc. all go in "frozen"
5. For estimatedExpirationDays:
   - Frozen items: 90-180 days
   - Fresh produce: 3-14 days depending on type
   - Fresh meat/seafood: 3-5 days
   - Dairy: 7-21 days
   - Pantry items: 180-365 days

CATEGORIES (use exactly one):
- produce (fresh fruits and vegetables)
- dairy-eggs (milk, cheese, yogurt, eggs, butter)
- meat-seafood (fresh/refrigerated meat and fish)
- frozen (ANY frozen item: frozen meat, frozen vegetables, ice cream, frozen meals)
- beverages (drinks, juice, water, soda)
- condiments-sauces (sauces, dressings, spices, oils)
- grains-bread (bread, pasta, rice, cereal, flour)
- snacks (chips, cookies, crackers, candy)
- other (anything that doesn't fit above)

UNITS (use exactly one): item, lb, oz, kg, g, gallon, liter, ml, cup, bunch, bag, box, bottle, can, jar, pack

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences.
Example: [{"name":"Frozen chicken thighs","category":"frozen","quantity":1,"unit":"pack","estimatedExpirationDays":180}]
If no grocery items found: []`;

export async function scanGroceryImage(
  imageBase64: string,
  mimeType: string,
): Promise<ScannedItem[]> {
  const mediaType = mimeType as
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: SCAN_PROMPT,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON array from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const items: ScannedItem[] = JSON.parse(jsonMatch[0]);
    return items;
  } catch {
    console.error("Failed to parse Claude response:", text);
    return [];
  }
}
