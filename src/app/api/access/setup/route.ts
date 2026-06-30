import { randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { authenticateRequest, createAdminClient } from "@/lib/supabase/server";
import { apiError, validationError } from "@/lib/api";
import { setupSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return apiError("A valid device session is required.", 401);
  const parsed = setupSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const admin = createAdminClient();

  const recoveryCode = randomBytes(12).toString("base64url").toUpperCase();
  const householdCode = randomBytes(4).toString("hex").toUpperCase();
  const [pinHash, recoveryHash] = await Promise.all([hash(parsed.data.pin), hash(recoveryCode)]);
  const { error } = await admin.rpc("initialize_household", {
    p_auth_user_id: user.id,
    p_household_name: parsed.data.householdName,
    p_household_code: householdCode,
    p_profile_name: parsed.data.profileName,
    p_room_name: parsed.data.roomName,
    p_pin_hash: pinHash,
    p_recovery_hash: recoveryHash,
  });
  if (error) return apiError(error.message, 500);
  return Response.json({ householdCode, recoveryCode }, { status: 201 });
}
