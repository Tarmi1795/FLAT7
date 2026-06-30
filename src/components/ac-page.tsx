"use client";

import { CalendarDays, Check, Snowflake, UserRound, Wind } from "lucide-react";
import { AddACDialog } from "@/components/add-asset-dialogs";
import { DeleteEntryButton, EditACDialog } from "@/components/manage-entry-dialogs";
import { useHomecare } from "@/components/providers";
import { StatusPill } from "@/components/status-pill";
import { acMaintenanceDue, dateStatus, formatDate, formatRelativeDay } from "@/lib/homecare";

export function ACPage() {
  const { data, recordAction, deleteAC } = useHomecare();
  return (
    <div>
      <header className="page-header"><div><p className="eyebrow">Cool & comfortable</p><h1 className="page-title">AC maintenance</h1><p className="page-description">A simple record for every unit in FLAT7.</p></div><AddACDialog /></header>
      {data.acUnits.length === 0 && <section className="panel mt-7 grid min-h-52 place-items-center p-6 text-center"><div><Snowflake className="mx-auto size-8 text-sky-300" /><h2 className="mt-3 font-bold text-white">No AC units yet</h2><p className="mt-1 text-sm text-slate-400">Add a unit to begin maintenance tracking.</p></div></section>}
      <section className="mt-7 grid gap-4 lg:grid-cols-2">
        {data.acUnits.map((unit) => {
          const room = data.rooms.find((item) => item.id === unit.roomId);
          const person = data.profiles.find((item) => item.id === unit.assignedProfileId);
          const due = acMaintenanceDue(unit);
          const status = dateStatus(due);
          return (
            <article key={unit.id} className="panel p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-sky-300/10 text-sky-300"><Snowflake className="size-6" /></span><StatusPill status={status} /></div>
              <h2 className="mt-5 text-xl font-bold text-white">{unit.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2"><span className="chip"><Wind className="size-3.5" />{room?.name}</span><span className="chip"><UserRound className="size-3.5" />{person?.name}</span></div>
              <div className="mt-6 grid grid-cols-2 gap-3"><div className="metric-box"><p className="text-xs text-slate-400">Last maintained</p><p className="mt-2 text-lg font-bold text-white">{formatRelativeDay(unit.lastMaintainedAt)}</p><p className="mt-1 text-xs text-slate-500">{formatDate(unit.lastMaintainedAt)}</p></div><div className="metric-box"><p className="text-xs text-slate-400">Next service</p><p className="mt-2 text-lg font-bold text-white">{formatRelativeDay(due)}</p><p className="mt-1 text-xs text-slate-500">Every {unit.maintenanceEveryMonths} months</p></div></div>
              <button className="primary-button mt-4 w-full" onClick={() => recordAction({ type: "maintenance", entityId: unit.id })}><Check className="size-4" />Mark maintained</button>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3"><EditACDialog unit={unit} /><DeleteEntryButton itemName={unit.name} itemType="AC unit" onDelete={() => deleteAC(unit.id)} /></div>
            </article>
          );
        })}
      </section>
      <section className="panel mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300"><CalendarDays className="size-5" /></span><div><h2 className="font-bold text-white">Standard reminder</h2><p className="mt-1 text-sm text-slate-400">Seven days before and again on the due date.</p></div></div><button className="text-left text-sm font-bold text-emerald-300 sm:text-right">Adjust reminders</button></section>
    </div>
  );
}
