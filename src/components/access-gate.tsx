"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Leaf, LoaderCircle, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "join" | "setup";

export function AccessGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [authorized, setAuthorized] = useState(!isSupabaseConfigured);
  const [mode, setMode] = useState<Mode>("join");
  const [error, setError] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [householdCode, setHouseholdCode] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const check = async () => {
      const supabase = getSupabaseBrowserClient()!;
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const result = await supabase.auth.signInAnonymously();
        session = result.data.session;
      }
      if (!session) { setError("Anonymous access is not enabled in Supabase."); setLoading(false); return; }
      const { data } = await supabase.from("device_memberships").select("id").eq("auth_user_id", session.user.id).maybeSingle();
      setAuthorized(Boolean(data));
      setLoading(false);
    };
    void check();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true); setError("");
    const values = new FormData(event.currentTarget);
    const supabase = getSupabaseBrowserClient()!;
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`/api/access/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token || ""}` },
      body: JSON.stringify(Object.fromEntries(values)),
    });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error || "Unable to continue."); setLoading(false); return; }
    if (payload.recoveryCode) { setRecoveryCode(payload.recoveryCode); setHouseholdCode(payload.householdCode || ""); setLoading(false); return; }
    setAuthorized(true); setLoading(false);
    window.dispatchEvent(new Event("flat7-access-changed"));
  };

  if (authorized) return children;
  if (loading && !error) return <div className="grid min-h-dvh place-items-center bg-[#07110c]"><LoaderCircle className="size-8 animate-spin text-emerald-300" aria-label="Loading household" /></div>;

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top,#153621_0%,#07110c_48%)] p-4">
      <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#0e1a13]/95 p-6 shadow-2xl sm:p-8">
        <Brand />
        {recoveryCode ? (
          <div className="mt-8"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300"><ShieldCheck /></span><h1 className="mt-5 text-2xl font-bold text-white">Save your household details</h1><p className="mt-2 text-sm leading-6 text-slate-400">Share the household code with trusted members. Keep the recovery code private.</p><p className="field-label mt-5">Household code</p><code className="mt-2 block rounded-2xl border border-emerald-300/20 bg-[#07110c] p-4 text-center text-xl font-black tracking-[.2em] text-white">{householdCode}</code><p className="field-label mt-4">Recovery code</p><code className="mt-2 block break-all rounded-2xl border border-emerald-300/20 bg-[#07110c] p-4 text-center text-base font-bold tracking-[.1em] text-emerald-300">{recoveryCode}</code><button className="primary-button mt-5 w-full" onClick={() => { setAuthorized(true); window.dispatchEvent(new Event("flat7-access-changed")); }}>I saved both codes</button></div>
        ) : (
          <>
            <div className="mt-8"><p className="eyebrow">Private households</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Welcome home.</h1><p className="mt-2 text-sm leading-6 text-slate-400">Create a household or join one using its code and six-digit PIN.</p></div>
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-white/[0.035] p-1"><button className={`min-h-11 rounded-lg text-sm font-bold ${mode === "join" ? "bg-emerald-300 text-[#07110c]" : "text-slate-400"}`} onClick={() => setMode("join")}>Join household</button><button className={`min-h-11 rounded-lg text-sm font-bold ${mode === "setup" ? "bg-emerald-300 text-[#07110c]" : "text-slate-400"}`} onClick={() => setMode("setup")}>First setup</button></div>
            <form className="mt-5 space-y-4" onSubmit={submit}>
              {mode === "setup" ? <><label className="block"><span className="field-label">Household name</span><input className="field-input mt-2" name="householdName" required maxLength={80} placeholder="e.g. Flat 7" /></label><label className="block"><span className="field-label">Your name</span><input className="field-input mt-2" name="profileName" required maxLength={60} autoComplete="name" placeholder="e.g. Tariq" /></label><label className="block"><span className="field-label">First room</span><input className="field-input mt-2" name="roomName" required maxLength={80} placeholder="e.g. Living room" /></label></> : <label className="block"><span className="field-label">Household code</span><input className="field-input mt-2 text-center font-bold uppercase tracking-[.2em]" name="householdCode" required minLength={8} maxLength={8} autoCapitalize="characters" placeholder="A1B2C3D4" /></label>}
              <label className="block"><span className="field-label">Six-digit household PIN</span><div className="relative mt-2"><KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input className="field-input pl-10 text-center text-lg font-bold tracking-[.35em]" name="pin" required inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" placeholder="••••••" /></div></label>
              {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200" role="alert">{error}</p>}
              <button className="primary-button w-full" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Leaf className="size-4" />}{mode === "join" ? "Enter FLAT7" : "Create household"}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
