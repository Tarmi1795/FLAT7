"use client";

import Link from "next/link";
import { Activity, Bell, ChevronRight, KeyRound, MapPinHouse, Settings, ShieldCheck, UsersRound, Wifi } from "lucide-react";
import { useHomecare } from "@/components/providers";
import { PushControl } from "@/components/push-control";
import { ExportButton } from "@/components/export-button";
import { DeleteEntryButton, ProfileDialog, RoomDialog } from "@/components/manage-entry-dialogs";

const items = [
  { href: "/activity", title: "Activity history", detail: "Review, correct, or archive entries", icon: Activity },
  { href: "/more", title: "Notifications", detail: "Category defaults and per-item reminders", icon: Bell },
  { href: "/more", title: "Access & recovery", detail: "Change the shared PIN or recovery code", icon: KeyRound },
  { href: "/more", title: "Settings", detail: "Timezone, currency, and app preferences", icon: Settings },
];

export function MorePage() {
  const { data, deleteProfile, deleteRoom } = useHomecare();
  return (
    <div>
      <header><p className="eyebrow">Household settings</p><h1 className="page-title">More</h1><p className="page-description">People, rooms, notifications, and data controls.</p></header>
      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <section className="panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300"><UsersRound className="size-5" /></span><div><h2 className="text-lg font-bold text-white">People & rooms</h2><p className="mt-0.5 text-sm text-slate-400">Every room has a primary person.</p></div></div>
            <div className="flex flex-wrap gap-2"><ProfileDialog /><RoomDialog /></div>
          </div>
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">People</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {data.profiles.map((profile) => <div key={profile.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><span className="grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold text-[#07110c]" style={{ backgroundColor: profile.color }}>{profile.initials}</span><p className="min-w-0 flex-1 truncate font-semibold text-white">{profile.name}</p><div className="flex shrink-0 gap-2"><ProfileDialog profile={profile} /><DeleteEntryButton compact itemName={profile.name} itemType="person" onDelete={() => deleteProfile(profile.id)} /></div></div>)}
            </div>
          </div>
          <div className="mt-6 border-t border-white/[0.06] pt-6">
            <h3 className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Rooms</h3>
            <div className="mt-3 space-y-3">
              {data.rooms.map((room) => { const person = data.profiles.find((item) => item.id === room.primaryProfileId); return <div key={room.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-slate-300"><MapPinHouse className="size-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-white">{room.name}</p><p className="mt-0.5 text-xs text-slate-400">Primary person · {person?.name}</p></div><div className="flex shrink-0 gap-2"><RoomDialog room={room} /><DeleteEntryButton compact itemName={room.name} itemType="room" onDelete={() => deleteRoom(room.id)} /></div></div>; })}
            </div>
          </div>
        </section>
        <section className="space-y-3">{items.map((item) => { const Icon = item.icon; return <Link key={item.title} href={item.href} className="group flex min-h-[78px] items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0e1a13] p-4 transition hover:border-emerald-300/20 hover:bg-[#122219]"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-emerald-300"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><strong className="block text-sm text-white">{item.title}</strong><span className="mt-1 block text-xs text-slate-400">{item.detail}</span></span><ChevronRight className="size-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-emerald-300" /></Link>; })}</section>
      </div>
      <section className="mt-6 grid gap-3 sm:grid-cols-3"><div className="security-card"><ShieldCheck className="size-5 text-emerald-300" /><div><p>Private household</p><strong>RLS protected</strong></div></div><div className="security-card"><Wifi className="size-5 text-sky-300" /><div><p>Offline queue</p><strong>Ready to sync</strong></div></div><div className="security-card"><Bell className="size-5 text-amber-200" /><div><p>Push reminders</p><strong>Assigned people</strong></div></div></section>
      <section className="panel mt-6 grid gap-5 p-5 sm:grid-cols-2 sm:p-6"><div><h2 className="font-bold text-white">Device reminders</h2><p className="mb-4 mt-1 text-sm text-slate-400">Push alerts follow the person selected on this device.</p><PushControl /></div><div><h2 className="font-bold text-white">Household export</h2><p className="mb-4 mt-1 text-sm text-slate-400">Download CSV records in one ZIP archive.</p><ExportButton /></div></section>
    </div>
  );
}
