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

export async function scanGroceryImage(
  imageBase64: string,
  mimeType: string,
): Promise<ScannedItem[]> {
  const mediaType = mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
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
            text: `Analyze this image of groceries or a grocery receipt. Extract each food/grocery item you can identify.

For each item, return:
- name: the item name (e.g. "Whole milk", "Chicken breast", "Bananas")
- category: one of: produce, dairy-eggs, meat-seafood, frozen, beverages, condiments-sauces, grains-bread, snacks, leftovers, other
- quantity: estimated quantity (number)
- unit: one of: item, lb, oz, kg, g, gallon, liter, ml, cup, bunch, bag, box, bottle, can, jar, pack
- estimatedExpirationDays: typical days until expiration from purchase date

Respond with ONLY a JSON array, no other text. Example:
[{"name":"Whole milk","category":"dairy-eggs","quantity":1,"unit":"gallon","estimatedExpirationDays":10}]

If you cannot identify any grocery items, return an empty array: []`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
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
