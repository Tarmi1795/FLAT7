"use client";

import { useEffect } from "react";
import { flushQuickEntries } from "@/lib/offline-queue";

export function PwaManager() {
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const sync = () => void flushQuickEntries();
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => { window.removeEventListener("online", sync); document.removeEventListener("visibilitychange", sync); };
  }, []);
  return null;
}
