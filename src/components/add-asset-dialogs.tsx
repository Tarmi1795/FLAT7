"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Leaf, LoaderCircle, Plus, Snowflake, Trash2 } from "lucide-react";
import { AppDialog } from "@/components/app-dialog";
import { useHomecare } from "@/components/providers";
import { optimizePlantPhoto } from "@/lib/plant-images";

export function AddPlantDialog() {
  const { data, addPlant } = useHomecare();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const previewRef = useRef<string | undefined>(undefined);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const clearPhoto = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = undefined;
    setPreview(undefined);
    setPhoto(undefined);
    setError("");
  };

  const selectPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    setProcessingPhoto(true);
    setError("");
    try {
      const optimized = await optimizePlantPhoto(selected);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      const nextPreview = URL.createObjectURL(optimized);
      previewRef.current = nextPreview;
      setPhoto(optimized);
      setPreview(nextPreview);
    } catch (photoError) {
      setError(photoError instanceof Error ? photoError.message : "Unable to prepare this photo.");
    } finally {
      setProcessingPhoto(false);
    }
  };

  const close = () => {
    clearPhoto();
    setOpen(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await addPlant({
        name: String(form.get("name")),
        species: String(form.get("species") || "House plant"),
        roomId: String(form.get("roomId")),
        waterEveryDays: Number(form.get("waterEveryDays")),
        trimEveryDays: Number(form.get("trimEveryDays")),
        photo,
      });
      close();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to add plant.");
    } finally {
      setLoading(false);
    }
  };

  return <>
    <button className="secondary-button" onClick={() => setOpen(true)}><Plus className="size-4" /> Add plant</button>
    <AppDialog open={open} title="Add a plant" eyebrow="New living thing" onClose={close}>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <fieldset>
          <legend className="field-label">Plant photo <span className="font-normal text-slate-500">(optional)</span></legend>
          {preview ? (
            <div className="relative mt-2 h-44 overflow-hidden rounded-2xl border border-white/10 bg-[#07110c]">
              <Image src={preview} alt="Selected plant preview" fill unoptimized className="object-cover" sizes="480px" />
              <button type="button" className="icon-button absolute right-3 top-3 bg-[#07110c]/90" onClick={clearPhoto} aria-label="Remove selected plant photo"><Trash2 className="size-4" /></button>
            </div>
          ) : (
            <div className="mt-2 flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-emerald-300/25 bg-emerald-300/[0.03] px-4 text-center text-sm text-slate-400">
              Your photo will appear on the plant card.
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="secondary-button min-h-11 cursor-pointer justify-center px-3">
              <Camera className="size-4" /> Take photo
              <input className="sr-only" type="file" accept="image/*" capture="environment" onChange={selectPhoto} disabled={processingPhoto || loading} />
            </label>
            <label className="secondary-button min-h-11 cursor-pointer justify-center px-3">
              {processingPhoto ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Choose photo
              <input className="sr-only" type="file" accept="image/*" onChange={selectPhoto} disabled={processingPhoto || loading} />
            </label>
          </div>
        </fieldset>
        <label className="block"><span className="field-label">Plant name</span><input name="name" className="field-input mt-2" required maxLength={80} placeholder="e.g. Monstera" /></label>
        <label className="block"><span className="field-label">Species</span><input name="species" className="field-input mt-2" maxLength={100} placeholder="Optional" /></label>
        <label className="block"><span className="field-label">Room</span><select name="roomId" className="field-input mt-2" required>{data.rooms.map((room) => <option value={room.id} key={room.id}>{room.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label><span className="field-label">Water every</span><select name="waterEveryDays" className="field-input mt-2" defaultValue="7"><option value="3">3 days</option><option value="7">7 days</option><option value="10">10 days</option><option value="14">14 days</option><option value="21">21 days</option></select></label><label><span className="field-label">Trim every</span><select name="trimEveryDays" className="field-input mt-2" defaultValue="60"><option value="30">30 days</option><option value="45">45 days</option><option value="60">60 days</option><option value="90">90 days</option></select></label></div>
        {error && <p className="text-sm text-rose-300" role="alert">{error}</p>}
        <button className="primary-button w-full" disabled={loading || processingPhoto}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Leaf className="size-4" />}Save plant</button>
      </form>
    </AppDialog>
  </>;
}

export function AddACDialog() {
  const { data, addAC } = useHomecare();
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); try { await addAC({ name: String(form.get("name")), roomId: String(form.get("roomId")), maintenanceEveryMonths: Number(form.get("months")) }); setOpen(false); } catch (e) { setError(e instanceof Error ? e.message : "Unable to add AC."); } finally { setLoading(false); } };
  return <><button className="secondary-button" onClick={() => setOpen(true)}><Plus className="size-4" /> Add AC</button><AppDialog open={open} title="Add an AC" eyebrow="New unit" onClose={() => setOpen(false)}><form className="mt-6 space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Unit name</span><input name="name" className="field-input mt-2" required maxLength={80} placeholder="e.g. Living room AC" /></label><label className="block"><span className="field-label">Room</span><select name="roomId" className="field-input mt-2" required>{data.rooms.map((room) => <option value={room.id} key={room.id}>{room.name}</option>)}</select></label><label className="block"><span className="field-label">Maintenance interval</span><select name="months" className="field-input mt-2" defaultValue="3"><option value="1">Every month</option><option value="2">Every 2 months</option><option value="3">Every 3 months</option><option value="6">Every 6 months</option><option value="12">Every year</option></select></label>{error && <p className="text-sm text-rose-300" role="alert">{error}</p>}<button className="primary-button w-full" disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Snowflake className="size-4" />}Save AC</button></form></AppDialog></>;
}
