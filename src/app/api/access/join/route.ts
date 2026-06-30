import { verify } from "@node-rs/argon2";
import { authenticateRequest, createAdminClient } from "@/lib/supabase/server";
import { apiError, requestFingerprint, validationError } from "@/lib/api";
import { joinSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return apiError("A valid device session is required.", 401);
  const parsed = joinSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const admin = createAdminClient();
  const fingerprint = requestFingerprint(request);
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const { count } = await admin.from("access_attempts").select("id", { count: "exact", head: true }).eq("fingerprint", fingerprint).gte("created_at", cutoff);
  if ((count || 0) >= 5) return apiError("Too many attempts. Try again in 15 minutes.", 429);

  const householdCode = parsed.data.householdCode.toUpperCase();
  const { data: household } = await admin.from("households").select("id").eq("join_code", householdCode).maybeSingle();
  if (!household) {
    await admin.from("access_attempts").insert({ fingerprint, auth_user_id: user.id });
    return apiError("Household code or PIN is not correct.", 401);
  }
  const { data: secret } = await admin.from("household_secrets").select("pin_hash").eq("household_id", household.id).single();
  const valid = secret ? await verify(secret.pin_hash, parsed.data.pin) : false;
  if (!valid) {
    await admin.from("access_attempts").insert({ fingerprint, auth_user_id: user.id });
    return apiError("Household code or PIN is not correct.", 401);
  }
  const { data: profile } = await admin.from("profiles").select("id").eq("household_id", household.id).eq("is_active", true).order("created_at").limit(1).single();
  const { error } = await admin.from("device_memberships").upsert({ auth_user_id: user.id, household_id: household.id, selected_profile_id: profile?.id }, { onConflict: "auth_user_id" });
  if (error) return apiError(error.message, 500);
  await admin.from("access_attempts").delete().eq("fingerprint", fingerprint);
  return Response.json({ ok: true });
}
