import { z } from "zod";

export const recipeSourceSchema = z.enum(["umami", "manual", "ai_suggested"]);

export const recipeIngredientSchema = z.object({
  name: z.string(),
  amount: z.string().optional(),
  optional: z.boolean().default(false),
});

export const createRecipeSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  ingredients: z.array(recipeIngredientSchema).min(1, "At least one ingredient"),
  instructions: z.string().min(1, "Instructions required"),
  sourceUrl: z.string().url().optional(),
  prepTime: z.coerce.number().int().positive().optional(),
  servings: z.coerce.number().int().positive().optional(),
});

export const recipeSchema = createRecipeSchema.extend({
  id: z.string(),
  source: recipeSourceSchema,
  addedBy: z.string(),
  createdAt: z.coerce.date(),
});

export type RecipeSource = z.infer<typeof recipeSourceSchema>;
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
