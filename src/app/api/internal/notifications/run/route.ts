import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) return apiError("Unauthorized.", 401);
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) return apiError("VAPID is not configured.", 503);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const admin = createAdminClient();
  const now = new Date();
  const since = new Date(now.getTime() - 20 * 60_000).toISOString();
  const { data: jobs, error } = await admin.from("pending_notification_jobs").select("*").gte("scheduled_for", since).lte("scheduled_for", now.toISOString());
  if (error) return apiError(error.message, 500);
  let sent = 0;
  for (const job of jobs || []) {
    let query = admin.from("push_subscriptions").select("*").eq("household_id", job.household_id).is("disabled_at", null);
    if (job.profile_id) query = query.eq("profile_id", job.profile_id);
    const { data: subscriptions } = await query;
    for (const subscription of subscriptions || []) {
      const { error: claimError } = await admin.from("notification_deliveries").insert({ job_key: job.job_key, subscription_id: subscription.id, household_id: job.household_id, scheduled_for: job.scheduled_for });
      if (claimError) continue;
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth_key } }, JSON.stringify({ title: job.title, body: job.body, url: job.url, tag: job.job_key }));
        await admin.from("notification_deliveries").update({ delivered_at: new Date().toISOString() }).eq("job_key", job.job_key).eq("subscription_id", subscription.id);
        sent++;
      } catch (pushError) {
        const statusCode = (pushError as { statusCode?: number }).statusCode;
        await admin.from("notification_deliveries").update({ error: pushError instanceof Error ? pushError.message : "Push failed" }).eq("job_key", job.job_key).eq("subscription_id", subscription.id);
        if (statusCode === 404 || statusCode === 410) await admin.from("push_subscriptions").update({ disabled_at: new Date().toISOString() }).eq("id", subscription.id);
      }
    }
  }
  return Response.json({ jobs: jobs?.length || 0, sent });
}
