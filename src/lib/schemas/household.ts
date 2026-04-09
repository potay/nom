import { z } from "zod";

export const householdSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  members: z.array(z.string()),
  memberNames: z.record(z.string(), z.string()),
  createdAt: z.coerce.date(),
  inviteCode: z.string().length(8),
});

export const createHouseholdSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

export const joinHouseholdSchema = z.object({
  inviteCode: z
    .string()
    .length(8, "Invite code must be 8 characters")
    .toUpperCase(),
});

export type Household = z.infer<typeof householdSchema>;
export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;
