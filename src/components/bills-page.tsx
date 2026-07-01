"use client";

import { useMemo, useState } from "react";
import { Check, Clock3, CreditCard, FileText, ReceiptText, Trash2, UserRound } from "lucide-react";
import { AppDialog } from "@/components/app-dialog";
import { BillDialog } from "@/components/manage-entry-dialogs";
import { useHomecare } from "@/components/providers";
import { StatusPill } from "@/components/status-pill";
import { DatedActionButton } from "@/components/transaction-date-dialog";
import { billStatus, formatDate, formatQar, formatRelativeDay, qatarDate } from "@/lib/homecare";
import type { BillOccurrence } from "@/types/homecare";

function DeleteBillSeries({ bill }: { bill: BillOccurrence }) {
  const { deleteBill } = useHomecare();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const remove = async (scope: "month" | "future") => { setLoading(true); setError(""); try { await deleteBill(bill.id, scope); setOpen(false); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete this expense."); } finally { setLoading(false); } };
  return <><button type="button" className="icon-button text-rose-300" onClick={() => setOpen(true)} aria-label={`Delete ${bill.name}`}><Trash2 className="size-4" /></button><AppDialog open={open} title={`Delete ${bill.name}?`} eyebrow="Recurring expense" onClose={() => !loading && setOpen(false)} className="sm:max-w-md"><p className="mt-4 text-sm leading-6 text-slate-300">Choose whether to remove only this unpaid month or stop this expense from this month onward. Paid history remains untouched.</p>{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}<div className="mt-6 grid gap-3"><button className="secondary-button" disabled={loading} onClick={() => remove("month")}>This month only</button><button className="danger-button" disabled={loading} onClick={() => remove("future")}><Trash2 className="size-4" />This and future months</button></div></AppDialog></>;
}

export function BillsPage() {
  const { data, recordAction } = useHomecare();
  const currentMonth = qatarDate().slice(0, 7);
  const months = useMemo(() => Array.from(new Set(data.bills.map((bill) => bill.dueAt.slice(0, 7)))).sort(), [data.bills]);
  const [selectedMonth, setSelectedMonth] = useState(months.includes(currentMonth) ? currentMonth : months[0] || currentMonth);
  const bills = data.bills.filter((bill) => bill.dueAt.startsWith(selectedMonth));
  const outstanding = bills.filter((item) => !item.paidAt).reduce((sum, item) => sum + item.amount, 0);
  const paid = bills.filter((item) => item.paidAt).reduce((sum, item) => sum + item.amount, 0);
  const next = bills.filter((item) => !item.paidAt).sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  const monthLabel = new Intl.DateTimeFormat("en-QA", { month: "long", year: "numeric", timeZone: "Asia/Qatar" }).format(new Date(`${selectedMonth}-01T12:00:00+03:00`));
  return <div>
    <header className="page-header"><div><p className="eyebrow">Monthly overview</p><h1 className="page-title">Recurring expenses</h1><p className="page-description">Rent, internet, and utilities repeat automatically until you stop them.</p></div><div className="flex flex-wrap gap-2"><label><span className="sr-only">Finance month</span><input className="field-input min-h-11 w-40" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} /></label><BillDialog /></div></header>
    <section className="mt-7 grid gap-3 sm:grid-cols-3"><div className="summary-card"><span className="summary-icon bg-amber-200/10 text-amber-200"><CreditCard className="size-5" /></span><div><p>Outstanding</p><strong>{formatQar(outstanding)}</strong></div></div><div className="summary-card"><span className="summary-icon bg-emerald-300/10 text-emerald-300"><Check className="size-5" /></span><div><p>Paid in {monthLabel}</p><strong>{formatQar(paid)}</strong></div></div><div className="summary-card"><span className="summary-icon bg-sky-300/10 text-sky-300"><Clock3 className="size-5" /></span><div><p>Next payment</p><strong>{next ? formatRelativeDay(next.dueAt) : "All paid"}</strong></div></div></section>
    <section className="panel mt-6 overflow-hidden"><div className="border-b border-white/[0.06] p-5 sm:p-6"><h2 className="text-lg font-bold text-white">{monthLabel} expenses</h2><p className="mt-1 text-sm text-slate-400">Variable utility amounts can be changed for one month without changing the series.</p></div><div className="divide-y divide-white/[0.06]">
      {!bills.length && <div className="p-8 text-center"><CreditCard className="mx-auto size-8 text-emerald-300" /><h3 className="mt-3 font-bold text-white">No expenses for this month</h3><p className="mt-1 text-sm text-slate-400">Add a recurring expense to generate the next 12 months.</p></div>}
      {bills.map((bill) => { const status = billStatus(bill); const person = data.profiles.find((item) => item.id === (bill.paidByProfileId || bill.responsibleProfileId)); return <article id={`bill-${bill.id}`} key={bill.id} className="grid scroll-mt-32 gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"><span className="grid size-12 place-items-center rounded-2xl bg-white/[0.04] text-emerald-300">{bill.name === "Rent" ? <FileText className="size-6" /> : <ReceiptText className="size-6" />}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-white">{bill.name}</h3><StatusPill status={status} /><span className="chip text-[10px]">Monthly</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span>Due {formatDate(bill.dueAt)} · {formatRelativeDay(bill.dueAt)}</span><span className="inline-flex items-center gap-1"><UserRound className="size-3.5" />{person?.name || "Everyone"}</span></div></div><div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:text-right"><div><p className="text-xl font-bold tabular-nums text-white">{formatQar(bill.amount)}</p>{status === "paid" && <p className="mt-1 text-xs text-slate-400">Paid {formatRelativeDay(bill.paidAt!)}</p>}</div>{status !== "paid" && <DatedActionButton title={`Pay ${bill.name}`} className="primary-button px-4" onConfirm={(occurredAt) => recordAction({ type: "payment", entityId: bill.id, occurredAt })}><Check className="size-4" />Mark paid</DatedActionButton>}<div className="flex gap-2"><BillDialog bill={bill} />{status !== "paid" && <DeleteBillSeries bill={bill} />}</div></div></article>; })}
    </div></section>
  </div>;
}
