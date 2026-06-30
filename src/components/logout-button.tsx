"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, LogOut, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({ variant = "default" }: { variant?: "default" | "menu" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [loading, open]);

  const logout = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      }
      window.localStorage.removeItem("flat7-active-profile");
      window.location.assign("/");
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to log out. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={variant === "menu" ? "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-rose-200 transition hover:bg-rose-300/10" : "danger-button min-h-12 w-full sm:w-auto"}
        onClick={() => { setError(""); setOpen(true); }}
      >
        <LogOut className="size-4" aria-hidden="true" />
        Log out
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && setOpen(false)}>
          <section className="w-full rounded-t-[28px] border border-white/10 bg-[#0d1b13] p-5 shadow-2xl sm:max-w-md sm:rounded-[28px] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title" aria-describedby="logout-dialog-description">
            <div className="flex items-start justify-between gap-4">
              <div><p className="eyebrow">Device access</p><h2 id="logout-dialog-title" className="mt-2 text-2xl font-bold text-white">Log out of this household?</h2></div>
              <button type="button" className="icon-button shrink-0" onClick={() => setOpen(false)} disabled={loading} aria-label="Close logout confirmation"><X className="size-5" /></button>
            </div>
            <p id="logout-dialog-description" className="mt-5 text-sm leading-6 text-slate-300">This device will return to the household join screen. Your household, photos, and activity history will not be deleted.</p>
            {error && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-200" role="alert">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" className="secondary-button min-h-12" onClick={() => setOpen(false)} disabled={loading}>Cancel</button>
              <button type="button" className="danger-button min-h-12" onClick={logout} disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}{loading ? "Logging out…" : "Log out"}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
