import { randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { createAdminClient } from "@/lib/supabase/server";
import { apiError, validationError } from "@/lib/api";
import { recoverSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = recoverSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const admin = createAdminClient();
  const { data: secret } = await admin.from("household_secrets").select("household_id,recovery_hash").limit(1).single();
  if (!secret || !(await verify(secret.recovery_hash, parsed.data.recoveryCode.toUpperCase()))) return apiError("Recovery code is not valid.", 401);
  const recoveryCode = randomBytes(12).toString("base64url").toUpperCase();
  const [pinHash, recoveryHash] = await Promise.all([hash(parsed.data.pin), hash(recoveryCode)]);
  const { error } = await admin.from("household_secrets").update({ pin_hash: pinHash, recovery_hash: recoveryHash, updated_at: new Date().toISOString() }).eq("household_id", secret.household_id);
  if (error) return apiError(error.message, 500);
  return Response.json({ recoveryCode });
}
