import type { CreateRecipeInput } from "@/lib/schemas/recipe";

/**
 * Parse Umami recipe exports into CreateRecipeInput[].
 *
 * Umami exports as a ZIP of individual JSON files, each using Schema.org
 * Recipe format (@type: "Recipe").
 */
export function parseUmamiExport(jsonData: unknown): CreateRecipeInput[] {
  // Single recipe object (most common - one JSON per file)
  if (isSchemaOrgRecipe(jsonData)) {
    const parsed = parseSchemaOrgRecipe(jsonData);
    return parsed ? [parsed] : [];
  }

  // Array of recipes
  if (Array.isArray(jsonData)) {
    return jsonData
      .map((item) => {
        if (isSchemaOrgRecipe(item)) return parseSchemaOrgRecipe(item);
        return parseGenericRecipe(item);
      })
      .filter((r): r is CreateRecipeInput => r !== null);
  }

  // Wrapped in a container object
  if (typeof jsonData === "object" && jsonData !== null) {
    const obj = jsonData as Record<string, unknown>;
    const recipeArray =
      obj.recipes ?? obj.items ?? obj.data ?? obj.recipeBooks;

    if (Array.isArray(recipeArray)) {
      return recipeArray.flatMap((item) => {
        // Recipe book with nested recipes
        if (hasNestedRecipes(item)) {
          return (item as { recipes: unknown[] }).recipes
            .map((r) => parseSchemaOrgRecipe(r) ?? parseGenericRecipe(r))
            .filter((r): r is CreateRecipeInput => r !== null);
        }
        const parsed =
          parseSchemaOrgRecipe(item) ?? parseGenericRecipe(item);
        return parsed ? [parsed] : [];
      });
    }
  }

  return [];
}

function isSchemaOrgRecipe(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return r["@type"] === "Recipe";
}

function hasNestedRecipes(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  return Array.isArray((obj as Record<string, unknown>).recipes);
}

/** Parse Schema.org Recipe format (what Umami actually exports). */
function parseSchemaOrgRecipe(obj: unknown): CreateRecipeInput | null {
  if (typeof obj !== "object" || obj === null) return null;

  const r = obj as Record<string, unknown>;
  const name = String(r.name ?? r.title ?? "").trim();
  if (!name) return null;

  // Parse ingredients from recipeIngredient (array of strings)
  const rawIngredients = r.recipeIngredient ?? r.ingredients ?? [];
  const ingredients = parseIngredientStrings(rawIngredients);
  if (ingredients.length === 0) return null;

  // Parse instructions from recipeInstructions (array of HowToStep objects or strings)
  const instructions = parseSchemaInstructions(
    r.recipeInstructions ?? r.instructions ?? [],
  );

  // Parse duration from ISO 8601 (e.g. "P0Y0M0DT1H2M0S")
  const prepTime = parseIsoDuration(r.totalTime ?? r.cookTime ?? r.prepTime);

  // Parse servings from recipeYield (e.g. "Serves 4")
  const servings = parseServings(r.recipeYield);

  // Source URL
  const sourceUrl = typeof r.url === "string" ? r.url : undefined;

  return {
    name,
    ingredients,
    instructions: instructions || "See original recipe.",
    sourceUrl,
    prepTime: prepTime || undefined,
    servings: servings || undefined,
  };
}

/** Fallback parser for non-Schema.org formats. */
function parseGenericRecipe(obj: unknown): CreateRecipeInput | null {
  if (typeof obj !== "object" || obj === null) return null;

  const r = obj as Record<string, unknown>;
  const name = String(r.name ?? r.title ?? "").trim();
  if (!name) return null;

  const rawIngredients =
    r.ingredients ?? r.recipeIngredient ?? r.ingredient ?? [];
  const ingredients = parseIngredientStrings(rawIngredients);
  if (ingredients.length === 0) return null;

  const rawInstructions =
    r.instructions ?? r.recipeInstructions ?? r.directions ?? r.steps ?? "";
  const instructions =
    typeof rawInstructions === "string"
      ? rawInstructions.trim()
      : parseSchemaInstructions(rawInstructions);

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

/**
 * Parse ingredient strings. Filters out non-ingredient text like
 * notes, descriptions, and promotional content.
 */
function parseIngredientStrings(
  raw: unknown,
): { name: string; amount?: string; optional: boolean }[] {
  if (!Array.isArray(raw)) {
    if (typeof raw === "string") {
      return raw
        .split(/\n/)
        .map((line) => line.trim())
        .filter(isLikelyIngredient)
        .map((line) => parseIngredientLine(line));
    }
    return [];
  }

  return raw
    .map((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!isLikelyIngredient(trimmed)) return null;
        return parseIngredientLine(trimmed);
      }
      if (typeof item === "object" && item !== null) {
        const i = item as Record<string, unknown>;
        const name = String(
          i.name ?? i.ingredient ?? i.text ?? i.food ?? "",
        ).trim();
        if (!name || !isLikelyIngredient(name)) return null;
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
        i !== null,
    );
}

/** Heuristic: is this string likely an ingredient (vs a note/description)? */
function isLikelyIngredient(text: string): boolean {
  // Too long to be an ingredient
  if (text.length > 150) return false;
  // Section headers like "For the sauce:"
  if (/^(for the|note:|tip:|shopping)/i.test(text)) return false;
  // Contains URLs or emojis-heavy promotional text
  if (/https?:\/\//.test(text)) return false;
  // Mostly emojis or special chars
  if (text.replace(/[\p{Emoji}\s]/gu, "").length < 3) return false;
  // Very short non-ingredient text
  if (text.length < 2) return false;
  return true;
}

/** Parse an ingredient line like "750g pork belly" into name + amount. */
function parseIngredientLine(line: string): {
  name: string;
  amount?: string;
  optional: boolean;
} {
  // Match patterns like "750g thing", "3 tbsp thing", "1 1/2 cups thing"
  const match = line.match(
    /^(\d+[\d./\s]*(?:g|kg|ml|l|oz|lb|tsp|tbsp|cup|cups|handful|pinch|bunch)?)\s+(.+)$/i,
  );

  if (match) {
    return {
      amount: match[1].trim(),
      name: match[2].trim(),
      optional: /optional/i.test(line),
    };
  }

  return {
    name: line,
    optional: /optional/i.test(line),
  };
}

/** Parse Schema.org HowToStep instructions. */
function parseSchemaInstructions(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();

  if (Array.isArray(raw)) {
    return raw
      .map((step, i) => {
        if (typeof step === "string") return `${i + 1}. ${step.trim()}`;
        if (typeof step === "object" && step !== null) {
          const s = step as Record<string, unknown>;
          const text = String(
            s.text ?? s.instruction ?? s.step ?? "",
          ).trim();
          return text ? `${i + 1}. ${text}` : "";
        }
        return "";
      })
      .filter((s) => s.length > 0)
      .join("\n");
  }

  return "";
}

/** Parse ISO 8601 duration to minutes. e.g. "P0Y0M0DT1H2M0S" -> 62 */
function parseIsoDuration(raw: unknown): number | null {
  if (typeof raw !== "string") return null;

  const match = raw.match(
    /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/,
  );
  if (!match) return null;

  const hours = parseInt(match[4] || "0", 10);
  const minutes = parseInt(match[5] || "0", 10);
  const total = hours * 60 + minutes;

  return total > 0 ? total : null;
}

/** Parse servings from strings like "Serves 4", "4 servings", "4". */
function parseServings(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string") return null;

  const match = raw.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
