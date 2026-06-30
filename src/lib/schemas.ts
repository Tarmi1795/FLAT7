import { z } from "zod";

export const pinSchema = z.string().regex(/^\d{6}$/, "Enter a six-digit PIN.");
export const householdCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8}$/, "Enter the eight-character household code.");
export const setupSchema = z.object({ householdName: z.string().trim().min(1).max(80), pin: pinSchema, profileName: z.string().trim().min(1).max(60), roomName: z.string().trim().min(1).max(80) });
export const joinSchema = z.object({ householdCode: householdCodeSchema, pin: pinSchema });
export const recoverSchema = z.object({ householdCode: householdCodeSchema, recoveryCode: z.string().trim().min(12).max(80), pin: pinSchema });
export const quickEntrySchema = z.object({
  clientMutationId: z.string().uuid(),
  type: z.enum(["water", "trim", "maintenance", "payment"]),
  entityId: z.string().uuid(),
  profileId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  note: z.string().trim().max(500).optional(),
});
export const quickEntriesSchema = z.object({ entries: z.array(quickEntrySchema).min(1).max(50) });
export const pushSubscriptionSchema = z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }) });
