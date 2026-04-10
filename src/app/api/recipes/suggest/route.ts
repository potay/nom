import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { items } = (await request.json()) as {
      items: { name: string; category: string; quantity: number }[];
    };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No inventory items provided" },
        { status: 400 },
      );
    }

    const inventoryList = items
      .map((i) => `- ${i.name} (${i.quantity}, ${i.category})`)
      .join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `I have these items in my fridge:

${inventoryList}

Suggest 4-5 meals I can make using primarily these ingredients. For each meal:
- Focus on practical, everyday meals (not gourmet)
- It's okay to assume basic pantry staples (salt, pepper, oil, garlic, onion)
- Prioritize using items that expire soon

Respond with ONLY a JSON array:
[{"name":"Meal name","description":"One sentence description","ingredients":["ingredient 1","ingredient 2"],"instructions":"Brief cooking instructions (2-3 sentences)","matchedItems":["items from my fridge used"]}]`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ recipes: [] });
    }

    const recipes = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ recipes });
  } catch (err) {
    console.error("Recipe suggestion error:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 },
    );
  }
}
