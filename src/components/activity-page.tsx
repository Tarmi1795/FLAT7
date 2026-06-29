"use client";

import { Activity, Download, Search } from "lucide-react";
import { ActivityList } from "@/components/activity-list";
import { useHomecare } from "@/components/providers";

export function ActivityPage() {
  const { data } = useHomecare();
  return (
    <div>
      <header className="page-header"><div><p className="eyebrow">Shared history</p><h1 className="page-title">Activity</h1><p className="page-description">An auditable record of everything cared for and paid.</p></div><button className="secondary-button"><Download className="size-4" /> Export</button></header>
      <section className="panel mt-7 p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><Activity className="size-5" /></span><div><h2 className="font-bold text-white">All activity</h2><p className="text-xs text-slate-400">Newest first</p></div></div><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><span className="sr-only">Search activity</span><input className="field-input min-h-11 pl-10 sm:w-64" placeholder="Search activity" /></label></div>
        <div className="mt-5"><ActivityList items={data.activity} /></div>
      </section>
    </div>
  );
}
