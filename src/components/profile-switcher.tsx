"use client";

import { ChevronDown } from "lucide-react";
import { useHomecare } from "@/components/providers";

export function ProfileSwitcher() {
  const { data, activeProfileId, setActiveProfileId } = useHomecare();
  const active = data.profiles.find((profile) => profile.id === activeProfileId) || data.profiles[0];
  return (
    <label className="group relative flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 transition hover:border-emerald-300/30 hover:bg-white/[0.07]">
      <span className="grid size-8 place-items-center rounded-full text-xs font-bold text-[#07110c]" style={{ backgroundColor: active.color }}>
        {active.initials}
      </span>
      <span className="hidden text-sm font-semibold text-white sm:inline">{active.name}</span>
      <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
      <span className="sr-only">Active person</span>
      <select
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Choose active person"
        value={activeProfileId}
        onChange={(event) => setActiveProfileId(event.target.value)}
      >
        {data.profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>{profile.name}</option>
        ))}
      </select>
    </label>
  );
}
