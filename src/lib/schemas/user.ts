import { z } from "zod";

export const notificationPrefsSchema = z.object({
  dailyDigest: z.boolean().default(true),
  digestTime: z.string().default("09:00"),
  expirationWarningDays: z.number().int().min(1).max(14).default(3),
});

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  householdId: z.string().nullable(),
  fcmTokens: z.array(z.string()).default([]),
  notificationPrefs: notificationPrefsSchema.default({
    dailyDigest: true,
    digestTime: "09:00",
    expirationWarningDays: 3,
  }),
  createdAt: z.coerce.date(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;
