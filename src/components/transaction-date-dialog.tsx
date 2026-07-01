"use client";

import { CalendarDays, Check, Clock3 } from "lucide-react";
import { useState } from "react";
import { AppDialog } from "@/components/app-dialog";
import { qatarDate, qatarDateWithCurrentTime } from "@/lib/homecare";

export function TransactionDateDialog({ open, title, onClose, onConfirm }: { open: boolean; title: string; onClose: () => void; onConfirm: (occurredAt: string) => unknown | Promise<unknown> }) {
  const [mode, setMode] = useState<"today" | "pick">("today");
  const [date, setDate] = useState(qatarDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const confirm = async () => {
    setLoading(true); setError("");
    try { await onConfirm(mode === "today" ? new Date().toISOString() : qatarDateWithCurrentTime(date)); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to record this entry."); }
    finally { setLoading(false); }
  };
  return <AppDialog open={open} title="When?" eyebrow={title} onClose={() => { if (!loading) onClose(); }} className="sm:max-w-md">
    <div className="mt-5 grid grid-cols-2 gap-3">
      <button type="button" className={`entry-option ${mode === "today" ? "entry-option-selected" : ""}`} onClick={() => setMode("today")}><span className="grid size-9 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><Clock3 className="size-4" /></span><span>Today</span></button>
      <button type="button" className={`entry-option ${mode === "pick" ? "entry-option-selected" : ""}`} onClick={() => setMode("pick")}><span className="grid size-9 place-items-center rounded-xl bg-sky-300/10 text-sky-200"><CalendarDays className="size-4" /></span><span>Pick a date</span></button>
    </div>
    {mode === "pick" && <label className="mt-5 block"><span className="field-label">Transaction date</span><input className="field-input mt-2" type="date" value={date} max={qatarDate()} onChange={(event) => setDate(event.target.value)} required /></label>}
    <p className="mt-4 text-xs leading-5 text-slate-400">Past dates use the current Qatar time. Future entries are blocked.</p>
    {error && <p className="mt-3 text-sm text-rose-300" role="alert">{error}</p>}
    <button type="button" className="primary-button mt-5 w-full" onClick={confirm} disabled={loading || (mode === "pick" && !date)}><Check className="size-4" />{loading ? "Recording…" : "Record entry"}</button>
  </AppDialog>;
}

export function DatedActionButton({ title, className, children, onConfirm }: { title: string; className: string; children: React.ReactNode; onConfirm: (occurredAt: string) => unknown | Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className={className} onClick={() => setOpen(true)}>{children}</button><TransactionDateDialog open={open} title={title} onClose={() => setOpen(false)} onConfirm={onConfirm} /></>;
}
