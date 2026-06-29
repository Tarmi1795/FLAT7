"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, CircleCheck, Droplets, Sparkles, WalletCards } from "lucide-react";
import { ActivityList } from "@/components/activity-list";
import { useHomecare } from "@/components/providers";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { acMaintenanceDue, billStatus, dateStatus, formatQar, formatRelativeDay, plantTrimDue, plantWaterDue } from "@/lib/homecare";

export function Dashboard() {
  const { data, activeProfileId } = useHomecare();
  const profile = data.profiles.find((item) => item.id === activeProfileId) || data.profiles[0];
  const plantTasks = data.plants.flatMap((plant) => [
    { id: `${plant.id}-water`, name: `Water ${plant.name}`, date: plantWaterDue(plant), href: "/plants", icon: Droplets },
    { id: `${plant.id}-trim`, name: `Trim ${plant.name}`, date: plantTrimDue(plant), href: "/plants", icon: Sparkles },
  ]);
  const acTasks = data.acUnits.map((unit) => ({ id: unit.id, name: `Maintain ${unit.name}`, date: acMaintenanceDue(unit), href: "/ac", icon: CalendarDays }));
  const dueTasks = [...plantTasks, ...acTasks].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4);
  const openBills = data.bills.filter((bill) => !bill.paidAt);
  const overdueCount = dueTasks.filter((task) => dateStatus(task.date) === "overdue").length;

  return (
    <div>
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-300/10 bg-[linear-gradient(135deg,#10271a_0%,#0b1a12_55%,#0a1510_100%)] p-5 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-300/[0.08] blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1.4fr_.8fr] lg:items-end">
          <div>
            <p className="eyebrow">Good morning, {profile.name}</p>
            <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">Your home is mostly on track.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">A few small things need attention. Start with the overdue plant, then you are clear for the day.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="hero-stat"><span>Overdue</span><strong className="text-rose-300">{overdueCount}</strong></div>
            <div className="hero-stat"><span>Due soon</span><strong className="text-amber-200">{dueTasks.length - overdueCount}</strong></div>
            <div className="hero-stat"><span>Completed</span><strong className="text-emerald-300">8</strong></div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
        <section>
          <SectionHeading title="Needs attention" description="Sorted by urgency across your home" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dueTasks.map((task) => {
              const Icon = task.icon;
              const status = dateStatus(task.date);
              return (
                <Link key={task.id} href={task.href} className="task-card group">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-white/[0.05] text-emerald-300"><Icon className="size-5" aria-hidden="true" /></span>
                    <StatusPill status={status} label={status === "overdue" ? formatRelativeDay(task.date) : status === "due" ? "Due soon" : "Scheduled"} />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">{task.name}</h3>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                    <span>{formatRelativeDay(task.date)}</span>
                    <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Bills</p>
              <h2 className="mt-2 text-xl font-bold text-white">Upcoming payments</h2>
            </div>
            <span className="grid size-11 place-items-center rounded-2xl bg-amber-200/10 text-amber-200"><WalletCards className="size-5" /></span>
          </div>
          <div className="mt-5 space-y-3">
            {openBills.map((bill) => (
              <Link href="/bills" key={bill.id} className="flex min-h-[72px] items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-emerald-300/20 hover:bg-white/[0.045]">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-slate-300"><WalletCards className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="font-semibold text-white">{bill.name}</p><p className="mt-0.5 text-xs text-slate-400">Due {formatRelativeDay(bill.dueAt).toLowerCase()}</p></div>
                <div className="text-right"><p className="font-bold tabular-nums text-white">{formatQar(bill.amount)}</p><StatusPill status={billStatus(bill)} /></div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="panel mt-6 p-5 sm:p-6">
        <SectionHeading title="Recent activity" description="A shared record of care" href="/activity" />
        <div className="mt-5"><ActivityList items={data.activity.slice(0, 5)} /></div>
      </section>

      <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.045] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-full bg-emerald-300 text-[#07110c]"><CircleCheck className="size-5" /></span><div><h2 className="font-bold text-white">Everything is saved</h2><p className="mt-1 text-sm text-slate-400">Changes sync across household devices.</p></div></div>
        <span className="text-sm font-semibold text-emerald-300">Last synced just now</span>
      </section>
    </div>
  );
}
