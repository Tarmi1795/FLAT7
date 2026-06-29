"use client";

import { Droplets, Leaf, Scissors, UserRound } from "lucide-react";
import { AddPlantDialog } from "@/components/add-asset-dialogs";
import { useHomecare } from "@/components/providers";
import { StatusPill } from "@/components/status-pill";
import { dateStatus, formatDate, formatRelativeDay, plantTrimDue, plantWaterDue } from "@/lib/homecare";

export function PlantsPage() {
  const { data, recordAction } = useHomecare();
  return (
    <div>
      <header className="page-header">
        <div><p className="eyebrow">Living collection</p><h1 className="page-title">Plants</h1><p className="page-description">Watering and trimming, remembered for every plant.</p></div>
        <AddPlantDialog />
      </header>
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.plants.map((plant, index) => {
          const room = data.rooms.find((item) => item.id === plant.roomId);
          const person = data.profiles.find((item) => item.id === plant.assignedProfileId);
          const waterDue = plantWaterDue(plant);
          const trimDue = plantTrimDue(plant);
          const waterStatus = dateStatus(waterDue);
          return (
            <article key={plant.id} className="panel overflow-hidden">
              <div className={`relative flex h-40 items-end overflow-hidden p-5 ${index % 3 === 0 ? "bg-[radial-gradient(circle_at_70%_30%,#2c785044,transparent_48%),#102a1b]" : index % 3 === 1 ? "bg-[radial-gradient(circle_at_25%_20%,#7ba65735,transparent_50%),#17271c]" : "bg-[radial-gradient(circle_at_70%_25%,#66cdaa2b,transparent_52%),#0e2419]"}`}>
                <Leaf className="absolute right-5 top-5 size-24 rotate-12 text-emerald-300/15" strokeWidth={1.2} aria-hidden="true" />
                <div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/80">{plant.species}</p><h2 className="mt-1 text-2xl font-bold text-white">{plant.name}</h2></div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-2 text-xs text-slate-400"><span className="chip"><Leaf className="size-3.5" />{room?.name}</span><span className="chip"><UserRound className="size-3.5" />{person?.name}</span></div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="metric-box"><div className="flex items-center justify-between"><Droplets className="size-4 text-emerald-300" /><StatusPill status={waterStatus} /></div><p className="mt-3 text-xs text-slate-400">Last watered</p><p className="mt-1 font-bold text-white">{formatRelativeDay(plant.lastWateredAt)}</p><p className="mt-1 text-[11px] text-slate-500">{formatDate(plant.lastWateredAt)}</p></div>
                  <div className="metric-box"><Scissors className="size-4 text-lime-300" /><p className="mt-3 text-xs text-slate-400">Last trimmed</p><p className="mt-1 font-bold text-white">{formatRelativeDay(plant.lastTrimmedAt)}</p><p className="mt-1 text-[11px] text-slate-500">Next {formatRelativeDay(trimDue).toLowerCase()}</p></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="primary-button min-w-0 px-3" onClick={() => recordAction({ type: "water", entityId: plant.id })}><Droplets className="size-4" />Watered</button>
                  <button className="secondary-button min-w-0 px-3" onClick={() => recordAction({ type: "trim", entityId: plant.id })}><Scissors className="size-4" />Trimmed</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
