import { openDB } from "idb";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { QuickEntry } from "@/types/homecare";

const database = () => openDB("flat7-homecare", 1, { upgrade(db) { if (!db.objectStoreNames.contains("mutations")) db.createObjectStore("mutations", { keyPath: "clientMutationId" }); } });

export async function enqueueQuickEntry(entry: QuickEntry) {
  const db = await database();
  await db.put("mutations", entry);
}

export async function queuedCount() {
  const db = await database();
  return db.count("mutations");
}

export async function flushQuickEntries() {
  const db = await database();
  const entries = await db.getAll("mutations") as QuickEntry[];
  if (!entries.length || !navigator.onLine) return 0;
  const supabase = getSupabaseBrowserClient();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (!session) return 0;
  const response = await fetch("/api/sync/quick-entries", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ entries }) });
  const result = await response.json();
  let flushed = 0;
  for (const item of result.results || []) if (item.ok) { await db.delete("mutations", item.clientMutationId); flushed++; }
  return flushed;
}
