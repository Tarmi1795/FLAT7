"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { AppDialog } from "@/components/app-dialog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({ variant = "default" }: { variant?: "default" | "menu" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const close = () => { if (!loading) setOpen(false); };

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
      <AppDialog open={open} title="Log out of this household?" eyebrow="Device access" onClose={close} className="sm:max-w-md">
            <p className="mt-5 text-sm leading-6 text-slate-300">This device will return to the household join screen. Your household, photos, and activity history will not be deleted.</p>
            {error && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-200" role="alert">{error}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" className="secondary-button min-h-12" onClick={close} disabled={loading}>Cancel</button>
              <button type="button" className="danger-button min-h-12" onClick={logout} disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}{loading ? "Logging out…" : "Log out"}</button>
            </div>
      </AppDialog>
    </>
  );
}
