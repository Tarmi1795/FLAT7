import { authenticateRequest, createAdminClient } from "@/lib/supabase/server";
import { apiError, validationError } from "@/lib/api";
import { quickEntriesSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return apiError("A valid device session is required.", 401);
  const parsed = quickEntriesSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);
  const admin = createAdminClient();
  const { data: membership } = await admin.from("device_memberships").select("household_id").eq("auth_user_id", user.id).single();
  if (!membership) return apiError("Join the household before recording activity.", 403);

  const results: Array<{ clientMutationId: string; ok: boolean; error?: string }> = [];
  for (const entry of parsed.data.entries) {
    let error: { message: string } | null = null;
    if (entry.type === "water" || entry.type === "trim") {
      ({ error } = await admin.from("plant_care_logs").upsert({ household_id: membership.household_id, plant_id: entry.entityId, action: entry.type, occurred_at: entry.occurredAt, performed_by_profile_id: entry.profileId, note: entry.note, client_mutation_id: entry.clientMutationId, created_by_auth_user_id: user.id }, { onConflict: "client_mutation_id", ignoreDuplicates: true }));
    } else if (entry.type === "maintenance") {
      ({ error } = await admin.from("ac_maintenance_logs").upsert({ household_id: membership.household_id, ac_unit_id: entry.entityId, occurred_at: entry.occurredAt, performed_by_profile_id: entry.profileId, note: entry.note, client_mutation_id: entry.clientMutationId, created_by_auth_user_id: user.id }, { onConflict: "client_mutation_id", ignoreDuplicates: true }));
    } else if (entry.type === "payment") {
      ({ error } = await admin.from("bill_payments").upsert({ household_id: membership.household_id, bill_occurrence_id: entry.entityId, paid_at: entry.occurredAt, paid_by_profile_id: entry.profileId, note: entry.note, client_mutation_id: entry.clientMutationId, created_by_auth_user_id: user.id }, { onConflict: "client_mutation_id", ignoreDuplicates: true }));
    } else {
      ({ error } = await admin.from("collection_payments").upsert({ household_id: membership.household_id, collection_occurrence_id: entry.entityId, amount: entry.amount, received_at: entry.occurredAt, received_by_profile_id: entry.profileId, note: entry.note, client_mutation_id: entry.clientMutationId, created_by_auth_user_id: user.id }, { onConflict: "client_mutation_id", ignoreDuplicates: true }));
    }
    results.push({ clientMutationId: entry.clientMutationId, ok: !error, error: error?.message });
  }
  return Response.json({ results }, { status: results.every((item) => item.ok) ? 200 : 207 });
}
