"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Check, ChevronDown, CreditCard, Leaf, Settings, Snowflake, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { useHomecare } from "@/components/providers";
import { acMaintenanceDue, billStatus, dateStatus, formatRelativeDay, plantWaterDue } from "@/lib/homecare";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Dashboard" }, { href: "/plants", label: "Plants", menuKey: "plants" as const },
  { href: "/ac", label: "AC units", menuKey: "ac" as const }, { href: "/bills", label: "Bills", menuKey: "bills" as const },
  { href: "/activity", label: "Activity" }, { href: "/more", label: "Household" },
];

export function TopBar() {
  const pathname = usePathname() || "/";
  const { data, activeProfileId, setActiveProfileId } = useHomecare();
  const [openMenu, setOpenMenu] = useState<"notifications" | "profile" | "plants" | "ac" | "bills" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = data.profiles.find((profile) => profile.id === activeProfileId) || data.profiles[0];
  const notifications = useMemo(() => [
    ...data.plants.filter((plant) => dateStatus(plantWaterDue(plant)) !== "healthy").map((plant) => ({ id: `plant-${plant.id}`, href: "/plants", title: `Water ${plant.name}`, detail: formatRelativeDay(plantWaterDue(plant)), icon: Leaf, color: "text-emerald-200 bg-emerald-300/10" })),
    ...data.acUnits.filter((unit) => dateStatus(acMaintenanceDue(unit)) !== "healthy").map((unit) => ({ id: `ac-${unit.id}`, href: "/ac", title: `Maintain ${unit.name}`, detail: formatRelativeDay(acMaintenanceDue(unit)), icon: Snowflake, color: "text-sky-200 bg-sky-300/10" })),
    ...data.bills.filter((bill) => billStatus(bill) !== "paid" && billStatus(bill) !== "healthy").map((bill) => ({ id: `bill-${bill.id}`, href: "/bills", title: `${bill.name} payment`, detail: formatRelativeDay(bill.dueAt), icon: CreditCard, color: "text-amber-100 bg-amber-200/10" })),
  ].slice(0, 5), [data]);
  const assetMenus = {
    plants: data.plants.map((plant) => ({ id: plant.id, href: `/plants#plant-${plant.id}`, name: plant.name, detail: plant.species || "Plant", icon: Leaf, color: "text-emerald-200 bg-emerald-300/10" })),
    ac: data.acUnits.map((unit) => ({ id: unit.id, href: `/ac#ac-${unit.id}`, name: unit.name, detail: data.rooms.find((room) => room.id === unit.roomId)?.name || "AC unit", icon: Snowflake, color: "text-sky-200 bg-sky-300/10" })),
    bills: data.bills.map((bill) => ({ id: bill.id, href: `/bills#bill-${bill.id}`, name: bill.name, detail: formatRelativeDay(bill.dueAt), icon: CreditCard, color: "text-amber-100 bg-amber-200/10" })),
  };

  useEffect(() => {
    const dismiss = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null); };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpenMenu(null);
    window.addEventListener("mousedown", dismiss); window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("mousedown", dismiss); window.removeEventListener("keydown", escape); };
  }, []);

  return <header className="relative z-40" ref={rootRef}>
    <div className="flex min-h-14 items-center justify-between gap-3">
      <Brand />
      <nav className="hidden items-center rounded-full border border-white/[0.1] bg-[#0a1714]/60 p-1 shadow-[0_16px_45px_rgba(0,0,0,.2)] backdrop-blur-xl lg:flex" aria-label="Primary navigation">
        {navigation.map((item) => {
          const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          if (!("menuKey" in item) || !item.menuKey) return <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className={cn("top-nav-link", current && "top-nav-link-active")}>{item.label}</Link>;
          const entries = assetMenus[item.menuKey];
          const expanded = openMenu === item.menuKey;
          return <div key={item.href} className={cn("top-nav-group", current && "top-nav-link-active")}>
            <Link href={item.href} aria-current={current ? "page" : undefined} className="top-nav-parent">{item.label}</Link>
            <button type="button" className="top-nav-chevron" onClick={() => setOpenMenu((menu) => menu === item.menuKey ? null : item.menuKey)} aria-label={`Show registered ${item.label.toLowerCase()}`} aria-expanded={expanded} aria-haspopup="menu"><ChevronDown className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")} /></button>
            {expanded && <div className="asset-nav-popover" role="menu" aria-label={`Registered ${item.label}`}>
              <div className="border-b border-white/[0.08] px-3 py-2.5"><p className="text-xs font-bold text-white">Registered {item.label.toLowerCase()}</p><p className="mt-0.5 text-[10px] text-slate-400">Jump directly to an item</p></div>
              <div className="max-h-72 overflow-y-auto p-1.5">{entries.length ? entries.map((entry) => { const Icon = entry.icon; return <Link role="menuitem" key={entry.id} href={entry.href} onClick={() => setOpenMenu(null)} className="flex min-h-12 items-center gap-2.5 rounded-xl px-2.5 transition hover:bg-white/[0.06]"><span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", entry.color)}><Icon className="size-3.5" /></span><span className="min-w-0"><strong className="block truncate text-xs text-white">{entry.name}</strong><span className="mt-0.5 block truncate text-[10px] text-slate-400">{entry.detail}</span></span></Link>; }) : <p className="px-3 py-5 text-center text-xs text-slate-400">No registered items yet.</p>}</div>
              <Link href={item.href} onClick={() => setOpenMenu(null)} className="flex min-h-10 items-center justify-center border-t border-white/[0.08] text-[11px] font-bold text-emerald-200 transition hover:bg-white/[0.04]">View all {item.label.toLowerCase()}</Link>
            </div>}
          </div>;
        })}
      </nav>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button type="button" className={cn("header-action", openMenu === "notifications" && "header-action-active")} onClick={() => setOpenMenu((menu) => menu === "notifications" ? null : "notifications")} aria-label="Notifications" aria-expanded={openMenu === "notifications"} aria-haspopup="dialog"><Bell className="size-4" aria-hidden="true" />{notifications.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-400 ring-2 ring-[#0b1714]" />}</button>
          {openMenu === "notifications" && <section className="header-popover right-0 w-[min(22rem,calc(100vw-2rem))]" role="dialog" aria-label="Notifications">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3"><div><p className="font-bold text-white">Notifications</p><p className="mt-0.5 text-xs text-slate-400">Items that need attention</p></div><button type="button" className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.07] hover:text-white" onClick={() => setOpenMenu(null)} aria-label="Close notifications"><X className="size-4" /></button></div>
            <div className="p-2">{notifications.length ? notifications.map((item) => { const Icon = item.icon; return <Link key={item.id} href={item.href} className="flex min-h-16 items-center gap-3 rounded-2xl px-3 transition hover:bg-white/[0.06]"><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", item.color)}><Icon className="size-4" /></span><span className="min-w-0"><strong className="block truncate text-sm text-white">{item.title}</strong><span className="mt-1 block text-xs text-slate-400">{item.detail}</span></span></Link>; }) : <div className="grid min-h-32 place-items-center px-5 text-center"><div><span className="mx-auto grid size-10 place-items-center rounded-full bg-emerald-300/10 text-emerald-300"><Check className="size-4" /></span><p className="mt-3 text-sm font-semibold text-white">You’re all caught up</p><p className="mt-1 text-xs text-slate-400">Nothing needs attention right now.</p></div></div>}</div>
            <Link href="/activity" className="flex min-h-11 items-center justify-center border-t border-white/[0.08] text-xs font-bold text-emerald-200 transition hover:bg-white/[0.04]">View activity history</Link>
          </section>}
        </div>
        <div className="relative">
          <button type="button" className={cn("profile-trigger", openMenu === "profile" && "header-action-active")} onClick={() => setOpenMenu((menu) => menu === "profile" ? null : "profile")} aria-label="Open profile menu" aria-expanded={openMenu === "profile"} aria-haspopup="dialog"><span className="grid size-8 place-items-center rounded-full text-xs font-black text-[#07110c]" style={{ backgroundColor: active?.color || "#34D399" }}>{active?.initials || "?"}</span><span className="hidden min-w-0 sm:block"><span className="block max-w-24 truncate text-sm font-semibold text-white">{active?.name || "Profile"}</span><span className="block text-[10px] text-slate-400">Active person</span></span><ChevronDown className={cn("size-4 text-slate-400 transition-transform duration-200", openMenu === "profile" && "rotate-180")} aria-hidden="true" /></button>
          {openMenu === "profile" && <section className="header-popover right-0 w-[min(20rem,calc(100vw-2rem))]" role="dialog" aria-label="Profile menu">
            <div className="border-b border-white/[0.08] px-4 py-3"><p className="font-bold text-white">Who’s using this device?</p><p className="mt-1 text-xs text-slate-400">Reminders and quick entries use this profile.</p></div>
            <div className="p-2">{data.profiles.map((profile) => <button key={profile.id} type="button" className={cn("flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition hover:bg-white/[0.06]", profile.id === activeProfileId && "bg-emerald-300/[0.08]")} onClick={() => { setActiveProfileId(profile.id); setOpenMenu(null); }}><span className="grid size-8 place-items-center rounded-full text-[11px] font-black text-[#07110c]" style={{ backgroundColor: profile.color }}>{profile.initials}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{profile.name}</span>{profile.id === activeProfileId && <Check className="size-4 text-emerald-300" />}</button>)}</div>
            <div className="grid grid-cols-2 gap-2 border-t border-white/[0.08] p-2"><Link href="/more" className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-200 transition hover:bg-white/[0.06]"><UserRound className="size-4" />People</Link><Link href="/more" className="flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold text-slate-200 transition hover:bg-white/[0.06]"><Settings className="size-4" />Settings</Link><div className="col-span-2 border-t border-white/[0.08] pt-2"><LogoutButton variant="menu" /></div></div>
          </section>}
        </div>
      </div>
    </div>
  </header>;
}
