import JSZip from "jszip";
import { authenticateRequest, createAdminClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api";

const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return `${headers.map(escape).join(",")}\n${rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n")}`;
};

export async function GET(request: Request) {
  const user = await authenticateRequest(request);
  if (!user) return apiError("A valid device session is required.", 401);
  const admin = createAdminClient();
  const { data: membership } = await admin.from("device_memberships").select("household_id").eq("auth_user_id", user.id).single();
  if (!membership) return apiError("Join the household before exporting data.", 403);
  const tables = ["profiles", "rooms", "plants", "plant_care_logs", "ac_units", "ac_maintenance_logs", "bills", "bill_occurrences", "bill_payments"] as const;
  const zip = new JSZip();
  for (const table of tables) {
    const { data } = await admin.from(table).select("*").eq("household_id", membership.household_id);
    zip.file(`${table}.csv`, csv((data || []) as Record<string, unknown>[]));
  }
  const output = await zip.generateAsync({ type: "uint8array" });
  const body = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
  return new Response(body, { headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="flat7-homecare-export.zip"`, "cache-control": "no-store" } });
}
