import { z } from "zod";
import { categorySchema, unitSchema } from "@/lib/schemas/item";

export const shoppingItemSourceSchema = z.enum([
  "auto_expired",
  "auto_low",
  "manual",
]);

export const createShoppingItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: categorySchema.optional(),
  quantity: z.coerce.number().positive().default(1),
  unit: unitSchema.default("item"),
});

export const shoppingItemSchema = createShoppingItemSchema.extend({
  id: z.string(),
  source: shoppingItemSourceSchema,
  checked: z.boolean().default(false),
  addedBy: z.string(),
  createdAt: z.coerce.date(),
});

export type ShoppingItemSource = z.infer<typeof shoppingItemSourceSchema>;
export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
