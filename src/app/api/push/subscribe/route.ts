import { authenticateRequest, createAdminClient } from "@/lib/supabase/server";
import { apiError, validationError } from "@/lib/api";
import { pushSubscriptionSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return apiError("A valid device session is required.", 401);
  const parsed = pushSubscriptionSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const admin = createAdminClient();
  const { data: membership } = await admin.from("device_memberships").select("id,household_id,selected_profile_id").eq("auth_user_id", user.id).single();
  if (!membership) return apiError("Join the household before enabling reminders.", 403);
  const { error } = await admin.from("push_subscriptions").upsert({ membership_id: membership.id, household_id: membership.household_id, profile_id: membership.selected_profile_id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth_key: parsed.data.keys.auth, user_agent: request.headers.get("user-agent") }, { onConflict: "endpoint" });
  if (error) return apiError(error.message, 500);
  return Response.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return apiError("A valid device session is required.", 401);
  const { endpoint } = await request.json();
  if (typeof endpoint !== "string") return apiError("Subscription endpoint is required.", 422);
  const admin = createAdminClient();
  const { data: membership } = await admin.from("device_memberships").select("id").eq("auth_user_id", user.id).single();
  if (!membership) return apiError("Membership was not found.", 403);
  await admin.from("push_subscriptions").delete().eq("membership_id", membership.id).eq("endpoint", endpoint);
  return Response.json({ ok: true });
}
