"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const toBytes = (value: string) => {
  const padded = value.padEnd(value.length + (4 - value.length % 4) % 4, "=").replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

export function PushControl() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  useEffect(() => { if (supported) navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription()).then((value) => setEnabled(Boolean(value))); }, [supported]);
  const toggle = async () => {
    if (!supported || !isSupabaseConfigured) return;
    setLoading(true);
    const registration = await navigator.serviceWorker.ready;
    const supabase = getSupabaseBrowserClient()!;
    const session = (await supabase.auth.getSession()).data.session;
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token || ""}` }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
      await subscription.unsubscribe(); setEnabled(false);
    } else {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setLoading(false); return; }
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "") });
      await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token || ""}` }, body: JSON.stringify(subscription.toJSON()) });
      setEnabled(true);
    }
    setLoading(false);
  };
  return <button className="secondary-button w-full" onClick={toggle} disabled={!supported || !isSupabaseConfigured || loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : enabled ? <BellOff className="size-4" /> : <Bell className="size-4" />}{enabled ? "Disable push reminders" : "Enable push reminders"}</button>;
}
