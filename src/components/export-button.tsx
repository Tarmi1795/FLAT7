"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function ExportButton() {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    const session = (await getSupabaseBrowserClient()!.auth.getSession()).data.session;
    const response = await fetch("/api/export", { headers: { authorization: `Bearer ${session?.access_token || ""}` } });
    if (response.ok) {
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = "flat7-homecare-export.zip"; anchor.click();
      URL.revokeObjectURL(url);
    }
    setLoading(false);
  };
  return <button className="secondary-button w-full" onClick={download} disabled={!isSupabaseConfigured || loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}Export household data</button>;
}
