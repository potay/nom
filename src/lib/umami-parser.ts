import type { CreateRecipeInput } from "@/lib/schemas/recipe";

/**
 * Parse an Umami recipe book JSON export into CreateRecipeInput[].
 *
 * Umami exports recipes as JSON with varying structures.
 * This parser handles the common formats.
 */
export function parseUmamiExport(jsonData: unknown): CreateRecipeInput[] {
  const recipes: CreateRecipeInput[] = [];

  if (Array.isArray(jsonData)) {
    for (const item of jsonData) {
      const parsed = parseRecipeObject(item);
      if (parsed) recipes.push(parsed);
    }
  } else if (typeof jsonData === "object" && jsonData !== null) {
    // Might be wrapped in a "recipes" key or similar
    const obj = jsonData as Record<string, unknown>;
    const recipeArray =
      obj.recipes ?? obj.items ?? obj.data ?? obj.recipeBooks;

    if (Array.isArray(recipeArray)) {
      for (const item of recipeArray) {
        // Handle recipe book structure (array of books, each with recipes)
        if (
          typeof item === "object" &&
          item !== null &&
          "recipes" in (item as Record<string, unknown>)
        ) {
          const book = item as Record<string, unknown>;
          if (Array.isArray(book.recipes)) {
            for (const recipe of book.recipes) {
              const parsed = parseRecipeObject(recipe);
              if (parsed) recipes.push(parsed);
            }
          }
        } else {
          const parsed = parseRecipeObject(item);
          if (parsed) recipes.push(parsed);
        }
      }
    } else {
      // Single recipe object
      const parsed = parseRecipeObject(jsonData);
      if (parsed) recipes.push(parsed);
    }
  }

  return recipes;
}

function parseRecipeObject(obj: unknown): CreateRecipeInput | null {
  if (typeof obj !== "object" || obj === null) return null;

  const r = obj as Record<string, unknown>;

  const name = String(r.name ?? r.title ?? "").trim();
  if (!name) return null;

  // Parse ingredients
  const rawIngredients = r.ingredients ?? r.recipeIngredient ?? [];
  const ingredients = parseIngredients(rawIngredients);
  if (ingredients.length === 0) return null;

  // Parse instructions
  const instructions = parseInstructions(
    r.instructions ?? r.recipeInstructions ?? r.directions ?? r.steps ?? "",
  );

  return {
    name,
    ingredients,
    instructions: instructions || "See original recipe.",
    sourceUrl: typeof r.url === "string" ? r.url : undefined,
    prepTime:
      typeof r.prepTime === "number"
        ? r.prepTime
        : typeof r.totalTime === "number"
          ? r.totalTime
          : undefined,
    servings:
      typeof r.servings === "number"
        ? r.servings
        : typeof r.recipeYield === "number"
          ? r.recipeYield
          : undefined,
  };
}

function parseIngredients(
  raw: unknown,
): { name: string; amount?: string; optional: boolean }[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") {
          return { name: item.trim(), optional: false };
        }
        if (typeof item === "object" && item !== null) {
          const i = item as Record<string, unknown>;
          const name = String(
            i.name ?? i.ingredient ?? i.text ?? i.food ?? "",
          ).trim();
          const amount = i.amount ?? i.quantity ?? i.measure;
          return {
            name,
            amount: amount ? String(amount) : undefined,
            optional: Boolean(i.optional),
          };
        }
        return null;
      })
      .filter(
        (i): i is { name: string; amount?: string; optional: boolean } =>
          i !== null && i.name.length > 0,
      );
  }

  // String: split by newlines
  if (typeof raw === "string") {
    return raw
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ({ name: line, optional: false }));
  }

  return [];
}

function parseInstructions(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();

  if (Array.isArray(raw)) {
    return raw
      .map((step, i) => {
        if (typeof step === "string") return `${i + 1}. ${step.trim()}`;
        if (typeof step === "object" && step !== null) {
          const s = step as Record<string, unknown>;
          const text = String(s.text ?? s.instruction ?? s.step ?? "").trim();
          return text ? `${i + 1}. ${text}` : "";
        }
        return "";
      })
      .filter((s) => s.length > 0)
      .join("\n");
  }

  return "";
}
