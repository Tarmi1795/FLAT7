"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { Camera, Droplets, ImagePlus, Leaf, LoaderCircle, Scissors, UserRound, X } from "lucide-react";
import { AddPlantDialog } from "@/components/add-asset-dialogs";
import { DeleteEntryButton, EditPlantDialog } from "@/components/manage-entry-dialogs";
import { useHomecare } from "@/components/providers";
import { StatusPill } from "@/components/status-pill";
import { dateStatus, formatDate, formatRelativeDay, plantTrimDue, plantWaterDue } from "@/lib/homecare";
import { optimizePlantPhoto } from "@/lib/plant-images";

function PlantPhotoControl({ plantId, plantName, hasPhoto }: { plantId: string; plantName: string; hasPhoto: boolean }) {
  const { updatePlantPhoto } = useHomecare();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      await updatePlantPhoto(plantId, await optimizePlantPhoto(selected));
      setOpen(false);
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : "Unable to save this photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute right-3 top-3 z-20">
      <button
        type="button"
        className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-[#07110c]/85 px-3 text-xs font-semibold text-white shadow-lg backdrop-blur transition-colors hover:bg-[#0e1a13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        onClick={() => { setOpen((current) => !current); setError(""); }}
        aria-expanded={open}
        aria-label={`${hasPhoto ? "Change" : "Add"} photo for ${plantName}`}
      >
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
        {hasPhoto ? "Change" : "Add photo"}
      </button>
      {open && (
        <div className="absolute right-0 top-0 w-52 rounded-2xl border border-white/10 bg-[#0e1a13] p-2 shadow-2xl" role="group" aria-label={`Photo options for ${plantName}`}>
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <span className="text-xs font-semibold text-slate-300">Plant photo</span>
            <button type="button" className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white" onClick={() => setOpen(false)} aria-label="Close photo options"><X className="size-4" /></button>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-200 hover:bg-white/5">
            <Camera className="size-4 text-emerald-300" /> Take photo
            <input className="sr-only" type="file" accept="image/*" capture="environment" onChange={selectPhoto} disabled={loading} />
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-200 hover:bg-white/5">
            <ImagePlus className="size-4 text-emerald-300" /> Choose photo
            <input className="sr-only" type="file" accept="image/*" onChange={selectPhoto} disabled={loading} />
          </label>
          {error && <p className="px-3 py-2 text-xs text-rose-300" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function PlantsPage() {
  const { data, recordAction, deletePlant } = useHomecare();
  return (
    <div>
      <header className="page-header">
        <div><p className="eyebrow">Living collection</p><h1 className="page-title">Plants</h1><p className="page-description">Watering and trimming, remembered for every plant.</p></div>
        <AddPlantDialog />
      </header>
      {data.plants.length === 0 && <section className="panel mt-7 grid min-h-52 place-items-center p-6 text-center"><div><Leaf className="mx-auto size-8 text-emerald-300" /><h2 className="mt-3 font-bold text-white">No plants yet</h2><p className="mt-1 text-sm text-slate-400">Add your first plant to start tracking its care.</p></div></section>}
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
                {plant.image ? <><Image src={plant.image} alt={`${plant.name} plant`} fill unoptimized className="object-cover" sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw" /><div className="absolute inset-0 bg-gradient-to-t from-[#07110c]/90 via-[#07110c]/20 to-[#07110c]/15" /></> : <Leaf className="absolute right-5 top-5 size-24 rotate-12 text-emerald-300/15" strokeWidth={1.2} aria-hidden="true" />}
                <PlantPhotoControl plantId={plant.id} plantName={plant.name} hasPhoto={Boolean(plant.image)} />
                <div className="relative z-10 pr-20"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200/90">{plant.species}</p><h2 className="mt-1 text-2xl font-bold text-white">{plant.name}</h2></div>
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
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
                  <EditPlantDialog plant={plant} />
                  <DeleteEntryButton itemName={plant.name} itemType="plant" onDelete={() => deletePlant(plant.id)} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
