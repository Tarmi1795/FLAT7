"use client";

import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, CreditCard, Droplets, HandCoins, Home, Leaf, MapPinHouse, Snowflake, Sparkles, UsersRound, WalletCards } from "lucide-react";
import { useHomecare } from "@/components/providers";
import { CollectionPaymentDialog } from "@/components/profit-loss-page";
import { StatusPill } from "@/components/status-pill";
import { TopBar } from "@/components/top-bar";
import { acMaintenanceDue, billStatus, dateStatus, formatQar, formatRelativeDay, plantTrimDue, plantWaterDue, qatarDate } from "@/lib/homecare";

const glassCard = "rounded-[24px] border border-white/[0.12] bg-[#0c1715]/65 shadow-[0_24px_70px_rgba(0,0,0,.26)] backdrop-blur-xl";

export function Dashboard() {
  const { data, activeProfileId } = useHomecare();
  const profile = data.profiles.find((item) => item.id === activeProfileId) || data.profiles[0];
  const plantTasks = data.plants.flatMap((plant) => [
    { id: `${plant.id}-water`, name: `Water ${plant.name}`, date: plantWaterDue(plant), href: "/plants", icon: Droplets },
    { id: `${plant.id}-trim`, name: `Trim ${plant.name}`, date: plantTrimDue(plant), href: "/plants", icon: Sparkles },
  ]);
  const acTasks = data.acUnits.map((unit) => ({ id: unit.id, name: `Maintain ${unit.name}`, date: acMaintenanceDue(unit), href: "/ac", icon: CalendarDays }));
  const allTasks = [...plantTasks, ...acTasks].sort((a, b) => a.date.getTime() - b.date.getTime());
  const overdueCount = allTasks.filter((task) => dateStatus(task.date) === "overdue").length;
  const careScore = allTasks.length ? Math.max(12, Math.round(((allTasks.length - overdueCount) / allTasks.length) * 100)) : 100;
  const nextPlant = [...data.plants].sort((a, b) => plantWaterDue(a).getTime() - plantWaterDue(b).getTime())[0];
  const nextAC = [...data.acUnits].sort((a, b) => acMaintenanceDue(a).getTime() - acMaintenanceDue(b).getTime())[0];
  const openBills = data.bills.filter((bill) => !bill.paidAt).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const outstanding = openBills.reduce((sum, bill) => sum + bill.amount, 0);
  const currentMonth = qatarDate().slice(0, 7);
  const owing = data.collections.filter((item) => item.billingMonth.startsWith(currentMonth) && item.status !== "paid");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const activityCounts = Array.from({ length: 7 }, (_, index) => {
    const target = new Date(); target.setHours(0, 0, 0, 0); target.setDate(target.getDate() - (6 - index));
    return data.activity.filter((item) => { const date = new Date(item.occurredAt); return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth() && date.getDate() === target.getDate(); }).length;
  });
  const maxActivity = Math.max(1, ...activityCounts);
  const activityPoints = activityCounts.map((count, index) => `${index * 100},${86 - (count / maxActivity) * 60}`).join(" ");
  const dayLabels = Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - (6 - index)); return new Intl.DateTimeFormat("en-QA", { weekday: "short" }).format(day); });

  return (
    <section className="dashboard-shell relative min-h-[calc(100dvh-3rem)] overflow-clip rounded-[28px] border border-white/10 bg-[#07110c] shadow-[0_32px_100px_rgba(0,0,0,.45)] sm:rounded-[34px]">
      <Image src="/dashboard-home.webp" alt="" fill priority sizes="100vw" className="object-cover object-[35%_center] sm:object-center" />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(4,12,10,.90)_0%,rgba(6,20,21,.42)_42%,rgba(3,10,13,.77)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,14,13,.62)_0%,transparent_30%,rgba(3,9,8,.5)_100%)]" />
      <nav className="dashboard-rail absolute left-5 top-[58%] z-20 hidden -translate-y-1/2 flex-col gap-2 rounded-full border border-white/10 bg-[#0b1714]/65 p-1.5 shadow-2xl backdrop-blur-xl" aria-label="Dashboard shortcuts">
        {[{ href: "/", label: "Dashboard", icon: Home }, { href: "/plants", label: "Plants", icon: Leaf }, { href: "/ac", label: "AC units", icon: Snowflake }, { href: "/bills", label: "Bills", icon: CreditCard }, { href: "/activity", label: "Activity", icon: Activity }, { href: "/profit-loss", label: "Profit and loss", icon: BarChart3 }].map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => { document.documentElement.dataset.routeMotion = "slide-up"; }} aria-current={item.href === "/" ? "page" : undefined} className={`grid size-11 place-items-center rounded-full transition ${item.href === "/" ? "bg-white text-[#07110c]" : "text-slate-300 hover:bg-white/10 hover:text-white"}`} aria-label={item.label}><Icon className="size-4" /></Link>; })}
      </nav>

      <div className="dashboard-content relative z-10 flex min-h-[calc(100dvh-3rem)] flex-col p-3 sm:p-5 lg:p-6">
        <div className="dashboard-sticky-header"><TopBar /></div>

        <div className="dashboard-grid mt-6 grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.14fr_.72fr_.72fr] xl:grid-rows-[minmax(0,1fr)_190px]">
          <section className="dashboard-hero flex min-h-[430px] flex-col justify-between md:col-span-2 xl:col-span-1 xl:row-span-2">
            <div className="dashboard-hero-message max-w-2xl px-2 pt-3 text-shadow-lg sm:px-3 sm:pt-8 xl:pt-10">
              <p className="text-sm font-semibold text-emerald-200">{greeting}, {profile.name}</p>
              <h1 className="mt-2 text-3xl font-semibold leading-[1.02] tracking-[-.045em] text-white sm:text-4xl xl:text-[3rem]">FLAT7 at a glance.</h1>
            </div>

            <div className={`${glassCard} max-w-xl p-4 sm:p-5`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-300 text-[#07110c]"><UsersRound className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="font-bold text-white">FLAT7 household</p><p className="mt-1 text-sm text-slate-300">{data.rooms.length} rooms · {data.profiles.length} people · shared care</p></div>
                <div className="flex -space-x-2" aria-label={`${data.profiles.length} household people`}>{data.profiles.slice(0, 4).map((person) => <span key={person.id} className="grid size-10 place-items-center rounded-full border-2 border-[#13201d] text-xs font-black text-[#07110c]" style={{ backgroundColor: person.color }} title={person.name}>{person.initials}</span>)}</div>
                <Link href="/more" className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-white transition hover:bg-white/[0.14]" aria-label="Manage household"><ArrowUpRight className="size-4" /></Link>
              </div>
            </div>
          </section>

          <div className="dashboard-care-column grid content-start gap-4">
            <section className={`${glassCard} p-5`} aria-labelledby="care-score-title">
              <div className="flex items-start justify-between gap-3"><div><p id="care-score-title" className="text-sm font-semibold text-slate-200">Care completion</p><p className="mt-3 text-3xl font-light text-white">{careScore}% <span className="text-sm font-medium text-slate-300">{overdueCount ? "Needs attention" : "On track"}</span></p></div><CheckCircle2 className="size-5 text-emerald-300" /></div>
              <div className="mt-4 h-9 overflow-hidden rounded-xl border border-white/10 bg-black/25 p-1"><div className="h-full rounded-lg bg-[linear-gradient(90deg,#bef264,#34d399)] shadow-[0_0_24px_rgba(52,211,153,.55)] transition-[width] duration-500" style={{ width: `${careScore}%` }} /></div>
              <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400"><span>0</span><span>{allTasks.length} care routines</span></div>
            </section>

            <Link href="/plants" className={`${glassCard} group flex min-h-24 items-center gap-4 p-4 transition hover:border-emerald-300/30 hover:bg-[#10221b]/75`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-300/15 text-emerald-200"><Leaf className="size-6" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-300">Next plant care</p><p className="mt-1 truncate text-lg font-bold text-white">{nextPlant?.name || "No plants added"}</p><p className="mt-1 text-xs text-emerald-200">{nextPlant ? `Water ${formatRelativeDay(plantWaterDue(nextPlant)).toLowerCase()}` : "Add a plant to begin"}</p></div>
              <ArrowUpRight className="size-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>

            <Link href="/ac" className={`${glassCard} group flex min-h-24 items-center gap-4 p-4 transition hover:border-sky-300/30 hover:bg-[#10221b]/75`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-300/15 text-sky-200"><Snowflake className="size-6" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-300">AC maintenance</p><p className="mt-1 truncate text-lg font-bold text-white">{nextAC?.name || "No AC units added"}</p><p className="mt-1 text-xs text-sky-200">{nextAC ? `Service ${formatRelativeDay(acMaintenanceDue(nextAC)).toLowerCase()}` : "Add a unit to begin"}</p></div>
              <ArrowUpRight className="size-4 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="dashboard-bills-column grid content-start gap-4">
            <section className={`${glassCard} p-5`}>
              <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-200">Upcoming bills</p><p className="mt-3 text-4xl font-light tabular-nums text-white">{formatQar(outstanding)}</p><p className="mt-1 text-xs text-slate-300">Total outstanding</p></div><span className="grid size-11 place-items-center rounded-2xl bg-amber-200/15 text-amber-100"><WalletCards className="size-5" /></span></div>
              <div className="mt-5 space-y-2">{openBills.slice(0, 2).map((bill) => <Link href="/bills" key={bill.id} className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-3 transition hover:bg-white/[0.09]"><CreditCard className="size-4 text-amber-200" /><div className="min-w-0 flex-1"><p className="font-semibold text-white">{bill.name}</p><p className="text-[11px] text-slate-400">{formatRelativeDay(bill.dueAt)}</p></div><StatusPill status={billStatus(bill)} /></Link>)}</div>
              <Link href="/bills" className="mt-4 flex min-h-11 items-center justify-between rounded-xl px-2 text-sm font-bold text-emerald-200 transition hover:bg-white/[0.06]">Manage payments <ArrowUpRight className="size-4" /></Link>
            </section>

            <section className={`${glassCard} dashboard-room-ownership p-4`}>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><MapPinHouse className="size-4 text-emerald-200" /><h2 className="text-sm font-semibold text-white">Room ownership</h2></div><Link href="/more" className="grid size-11 place-items-center rounded-full text-slate-300 transition hover:bg-white/[0.08] hover:text-white" aria-label="Manage rooms"><ArrowUpRight className="size-4" /></Link></div>
              <div className="mt-2 flex flex-wrap gap-2">{data.rooms.slice(0, 4).map((room) => { const person = data.profiles.find((item) => item.id === room.primaryProfileId); return <span key={room.id} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] px-3 text-xs font-semibold text-slate-200"><span className="size-2 rounded-full" style={{ backgroundColor: person?.color }} />{room.name}</span>; })}</div>
            </section>
            {owing.length > 0 && <section className={`${glassCard} p-4`}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><HandCoins className="size-4 text-violet-200" /><h2 className="text-sm font-semibold text-white">Still to collect</h2></div><Link href="/profit-loss" className="text-xs font-bold text-emerald-200">Open P&amp;L</Link></div><div className="mt-3 space-y-2">{owing.slice(0, 3).map((item) => { const person = data.profiles.find((profile) => profile.id === item.profileId); return <div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] p-2"><span className="grid size-8 place-items-center rounded-full text-[10px] font-black text-[#07110c]" style={{ backgroundColor: person?.color }}>{person?.initials}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{person?.name}</p><p className="text-[10px] text-slate-400">Owes {formatQar(item.remainingAmount)}</p></div><CollectionPaymentDialog item={item} compact /></div>; })}</div></section>}
          </div>

          <section className={`${glassCard} dashboard-activity min-h-44 p-5 md:col-span-2 xl:col-start-2 xl:col-span-2`} aria-labelledby="activity-chart-title">
            <div className="flex items-start justify-between gap-4"><div><p id="activity-chart-title" className="text-sm font-semibold text-slate-200">Household care this week</p><p className="mt-2 text-2xl font-light text-white">{activityCounts.reduce((sum, count) => sum + count, 0)} <span className="text-sm font-medium text-slate-300">completed entries</span></p></div><Link href="/activity" className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.12]" aria-label="Open activity history"><ArrowUpRight className="size-4" /></Link></div>
            <div className="mt-3 h-16" aria-hidden="true"><svg viewBox="0 0 600 100" preserveAspectRatio="none" className="h-full w-full overflow-visible"><defs><linearGradient id="careArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" stopOpacity=".42"/><stop offset="1" stopColor="#34d399" stopOpacity="0"/></linearGradient></defs><polygon points={`0,100 ${activityPoints} 600,100`} fill="url(#careArea)"/><polyline points={activityPoints} fill="none" stroke="#a3e635" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/></svg></div>
            <div className="mt-1 grid grid-cols-7 text-center text-[10px] font-medium text-slate-400">{dayLabels.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          </section>
        </div>
      </div>
    </section>
  );
}
