import { z } from "zod";

export const CATEGORIES = [
  "produce",
  "dairy-eggs",
  "meat-seafood",
  "frozen",
  "beverages",
  "condiments-sauces",
  "grains-bread",
  "snacks",
  "leftovers",
  "other",
] as const;

export const categorySchema = z.enum(CATEGORIES);

export const UNITS = [
  "item",
  "lb",
  "oz",
  "kg",
  "g",
  "gallon",
  "liter",
  "ml",
  "cup",
  "bunch",
  "bag",
  "box",
  "bottle",
  "can",
  "jar",
  "pack",
] as const;

export const unitSchema = z.enum(UNITS);

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: categorySchema,
  quantity: z.coerce.number().positive("Must be positive"),
  unit: unitSchema.default("item"),
  expirationDate: z.coerce.date(),
  notes: z.string().max(500).default(""),
  imageUrl: z.string().url().nullable().optional(),
});

export const itemSchema = createItemSchema.extend({
  id: z.string(),
  addedBy: z.string(),
  addedByName: z.string(),
  imageUrl: z.string().url().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;
export type Unit = z.infer<typeof unitSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type Item = z.infer<typeof itemSchema>;
