"use client";

import { Check, Clock3, CreditCard, FileText, ReceiptText, UserRound } from "lucide-react";
import { useHomecare } from "@/components/providers";
import { StatusPill } from "@/components/status-pill";
import { billStatus, formatDate, formatQar, formatRelativeDay } from "@/lib/homecare";

export function BillsPage() {
  const { data, recordAction } = useHomecare();
  const total = data.bills.filter((item) => !item.paidAt).reduce((sum, item) => sum + item.amount, 0);
  return (
    <div>
      <header className="page-header"><div><p className="eyebrow">Monthly overview</p><h1 className="page-title">Bills</h1><p className="page-description">Internet and rent, clearly tracked and never forgotten.</p></div></header>
      <section className="mt-7 grid gap-3 sm:grid-cols-3"><div className="summary-card"><span className="summary-icon bg-amber-200/10 text-amber-200"><CreditCard className="size-5" /></span><div><p>Outstanding</p><strong>{formatQar(total)}</strong></div></div><div className="summary-card"><span className="summary-icon bg-emerald-300/10 text-emerald-300"><Check className="size-5" /></span><div><p>Paid this month</p><strong>{formatQar(365)}</strong></div></div><div className="summary-card"><span className="summary-icon bg-sky-300/10 text-sky-300"><Clock3 className="size-5" /></span><div><p>Next payment</p><strong>In 2 days</strong></div></div></section>
      <section className="panel mt-6 overflow-hidden">
        <div className="border-b border-white/[0.06] p-5 sm:p-6"><h2 className="text-lg font-bold text-white">June payments</h2><p className="mt-1 text-sm text-slate-400">Every payment keeps a receipt and payer record.</p></div>
        <div className="divide-y divide-white/[0.06]">
          {data.bills.map((bill) => {
            const status = billStatus(bill);
            const personId = bill.paidByProfileId || bill.responsibleProfileId;
            const person = data.profiles.find((item) => item.id === personId);
            return (
              <article key={bill.id} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/[0.04] text-emerald-300">{bill.name === "Rent" ? <FileText className="size-6" /> : <ReceiptText className="size-6" />}</span>
                <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-white">{bill.name}</h3><StatusPill status={status} /></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span>Due {formatDate(bill.dueAt)} · {formatRelativeDay(bill.dueAt)}</span><span className="inline-flex items-center gap-1"><UserRound className="size-3.5" />{person?.name || "Everyone"}</span></div></div>
                <div className="flex items-center justify-between gap-4 sm:block sm:text-right"><p className="text-xl font-bold tabular-nums text-white">{formatQar(bill.amount)}</p>{status !== "paid" ? <button className="primary-button mt-0 px-4 sm:mt-3" onClick={() => recordAction({ type: "payment", entityId: bill.id })}><Check className="size-4" />Mark paid</button> : <p className="mt-1 text-xs text-slate-400">Paid {formatRelativeDay(bill.paidAt!)}</p>}</div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
