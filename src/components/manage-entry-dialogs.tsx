"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { AppDialog } from "@/components/app-dialog";
import { useHomecare } from "@/components/providers";
import type { ACUnit, ActivityItem, BillOccurrence, Plant, Profile, Room } from "@/types/homecare";

const Modal = AppDialog;

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return <button className="primary-button w-full" disabled={loading}>{loading && <LoaderCircle className="size-4 animate-spin" />}{label}</button>;
}

export function DeleteEntryButton({ itemName, itemType, onDelete, compact = false, detail }: { itemName: string; itemType: string; onDelete: () => Promise<void>; compact?: boolean; detail?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const close = () => { if (!loading) { setOpen(false); setError(""); } };
  const remove = async () => {
    setLoading(true); setError("");
    try { await onDelete(); setOpen(false); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : `Unable to delete this ${itemType}.`); }
    finally { setLoading(false); }
  };
  return <>
    <button type="button" className={compact ? "icon-button text-rose-300 hover:border-rose-300/30 hover:bg-rose-300/10" : "danger-button w-full"} onClick={() => setOpen(true)} aria-label={`Delete ${itemName}`}><Trash2 className="size-4" />{!compact && "Delete"}</button>
    <Modal open={open} title={`Delete ${itemName}?`} eyebrow="Please confirm" onClose={close}>
      <p className="mt-5 text-sm leading-6 text-slate-300">{detail || `This ${itemType} will be removed from active household tracking. Its completed history remains available for audit purposes.`}</p>
      {error && <p className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-200" role="alert">{error}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3"><button type="button" className="secondary-button" onClick={close} disabled={loading}>Cancel</button><button type="button" className="danger-button" onClick={remove} disabled={loading}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}Delete</button></div>
    </Modal>
  </>;
}

export function EditPlantDialog({ plant }: { plant: Plant }) {
  const { data, updatePlant } = useHomecare();
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try { await updatePlant(plant.id, { name: String(form.get("name")), species: String(form.get("species")), roomId: String(form.get("roomId")), waterEveryDays: Number(form.get("waterEveryDays")), trimEveryDays: Number(form.get("trimEveryDays")) }); setOpen(false); }
    catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to update this plant."); }
    finally { setLoading(false); }
  };
  return <><button type="button" className="secondary-button w-full" onClick={() => setOpen(true)}><Pencil className="size-4" />Edit</button><Modal open={open} title={`Edit ${plant.name}`} eyebrow="Plant details" onClose={() => setOpen(false)}><form className="mt-6 space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Plant name</span><input name="name" className="field-input mt-2" defaultValue={plant.name} required maxLength={80} /></label><label className="block"><span className="field-label">Species</span><input name="species" className="field-input mt-2" defaultValue={plant.species} maxLength={100} /></label><label className="block"><span className="field-label">Room</span><select name="roomId" className="field-input mt-2" defaultValue={plant.roomId}>{data.rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label><span className="field-label">Water every</span><input name="waterEveryDays" className="field-input mt-2" type="number" min="1" max="365" defaultValue={plant.waterEveryDays} required /></label><label><span className="field-label">Trim every</span><input name="trimEveryDays" className="field-input mt-2" type="number" min="1" max="730" defaultValue={plant.trimEveryDays} required /></label></div>{error && <p className="text-sm text-rose-300" role="alert">{error}</p>}<SubmitButton loading={loading} label="Save changes" /></form></Modal></>;
}

export function EditACDialog({ unit }: { unit: ACUnit }) {
  const { data, updateAC } = useHomecare();
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); try { await updateAC(unit.id, { name: String(form.get("name")), roomId: String(form.get("roomId")), maintenanceEveryMonths: Number(form.get("months")) }); setOpen(false); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to update this AC."); } finally { setLoading(false); } };
  return <><button type="button" className="secondary-button w-full" onClick={() => setOpen(true)}><Pencil className="size-4" />Edit</button><Modal open={open} title={`Edit ${unit.name}`} eyebrow="AC details" onClose={() => setOpen(false)}><form className="mt-6 space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Unit name</span><input name="name" className="field-input mt-2" defaultValue={unit.name} required maxLength={80} /></label><label className="block"><span className="field-label">Room</span><select name="roomId" className="field-input mt-2" defaultValue={unit.roomId}>{data.rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}</select></label><label className="block"><span className="field-label">Maintenance interval</span><input name="months" className="field-input mt-2" type="number" min="1" max="24" defaultValue={unit.maintenanceEveryMonths} required /></label>{error && <p className="text-sm text-rose-300" role="alert">{error}</p>}<SubmitButton loading={loading} label="Save changes" /></form></Modal></>;
}

export function EditActivityDialog({ activity }: { activity: ActivityItem }) {
  const { data, updateActivity } = useHomecare();
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); try { await updateActivity(activity.id, { occurredAt: new Date(String(form.get("occurredAt"))).toISOString(), note: String(form.get("note") || "") || undefined, profileId: String(form.get("profileId")) }); setOpen(false); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to update this activity."); } finally { setLoading(false); } };
  const localDate = new Date(new Date(activity.occurredAt).getTime() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  return <><button type="button" className="icon-button" onClick={() => setOpen(true)} aria-label={`Edit ${activity.title}`}><Pencil className="size-4" /></button><Modal open={open} title="Edit activity" eyebrow={activity.title} onClose={() => setOpen(false)}><form className="mt-6 space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Date and time</span><input name="occurredAt" className="field-input mt-2" type="datetime-local" defaultValue={localDate} required /></label><label className="block"><span className="field-label">Person</span><select name="profileId" className="field-input mt-2" defaultValue={activity.profileId}>{data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label><label className="block"><span className="field-label">Note</span><textarea name="note" className="field-input mt-2 min-h-24 py-3" defaultValue={activity.detail === "Completed" ? "" : activity.detail} maxLength={500} /></label>{error && <p className="text-sm text-rose-300" role="alert">{error}</p>}<SubmitButton loading={loading} label="Save changes" /></form></Modal></>;
}

export function BillDialog({ bill }: { bill?: BillOccurrence }) {
  const { data, addBill, updateBill } = useHomecare();
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); const input = { name: (bill?.name || String(form.get("name"))) as "Internet" | "Rent", amount: Number(form.get("amount")), dueAt: String(form.get("dueAt")), responsibleProfileId: String(form.get("profileId") || "") || undefined }; try { if (bill) await updateBill(bill.id, input); else await addBill(input); setOpen(false); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to save this bill."); } finally { setLoading(false); } };
  return <><button type="button" className={bill ? "icon-button" : "secondary-button"} onClick={() => { setError(""); setOpen(true); }} aria-label={bill ? `Edit ${bill.name} bill` : undefined}>{bill ? <Pencil className="size-4" /> : <><Plus className="size-4" />Add bill</>}</button><Modal open={open} title={bill ? `Edit ${bill.name}` : "Add a bill"} eyebrow="Monthly payment" onClose={() => setOpen(false)}><form className="mt-6 space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Bill type</span>{bill ? <div className="field-input mt-2 flex items-center text-slate-300" aria-readonly="true">{bill.name}</div> : <select name="name" className="field-input mt-2"><option>Internet</option><option>Rent</option></select>}</label><label className="block"><span className="field-label">Amount (QAR)</span><input name="amount" className="field-input mt-2" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={bill?.amount} required /></label><label className="block"><span className="field-label">Due date</span><input name="dueAt" className="field-input mt-2" type="date" defaultValue={bill?.dueAt.slice(0, 10)} required /></label><label className="block"><span className="field-label">Responsible person</span><select name="profileId" className="field-input mt-2" defaultValue={bill?.responsibleProfileId || ""}><option value="">Everyone</option>{data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>{error && <p className="text-sm text-rose-300" role="alert">{error}</p>}<SubmitButton loading={loading} label={bill ? "Save changes" : "Add bill"} /></form></Modal></>;
}

export function RoomDialog({ room }: { room?: Room }) {
  const { data, addRoom, updateRoom } = useHomecare();
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); const input = { name: String(form.get("name")), primaryProfileId: String(form.get("profileId")) }; try { if (room) await updateRoom(room.id, input); else await addRoom(input); setOpen(false); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to save this room."); } finally { setLoading(false); } };
  return <><button type="button" className={room ? "icon-button" : "secondary-button"} onClick={() => setOpen(true)} aria-label={room ? `Edit ${room.name}` : undefined}>{room ? <Pencil className="size-4" /> : <><Plus className="size-4" />Add room</>}</button><Modal open={open} title={room ? `Edit ${room.name}` : "Add a room"} eyebrow="Household space" onClose={() => setOpen(false)}><form className="mt-6 space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Room name</span><input name="name" className="field-input mt-2" defaultValue={room?.name} required maxLength={80} /></label><label className="block"><span className="field-label">Primary person</span><select name="profileId" className="field-input mt-2" defaultValue={room?.primaryProfileId} required>{data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>{error && <p className="text-sm text-rose-300" role="alert">{error}</p>}<SubmitButton loading={loading} label={room ? "Save changes" : "Add room"} /></form></Modal></>;
}

export function ProfileDialog({ profile }: { profile?: Profile }) {
  const { addProfile, updateProfile } = useHomecare();
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget); const input = { name: String(form.get("name")), color: String(form.get("color")) }; try { if (profile) await updateProfile(profile.id, input); else await addProfile(input); setOpen(false); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Unable to save this person."); } finally { setLoading(false); } };
  return <><button type="button" className={profile ? "icon-button" : "secondary-button"} onClick={() => setOpen(true)} aria-label={profile ? `Edit ${profile.name}` : undefined}>{profile ? <Pencil className="size-4" /> : <><Plus className="size-4" />Add person</>}</button><Modal open={open} title={profile ? `Edit ${profile.name}` : "Add a person"} eyebrow="Household profile" onClose={() => setOpen(false)}><form className="mt-6 space-y-4" onSubmit={submit}><label className="block"><span className="field-label">Person name</span><input name="name" className="field-input mt-2" defaultValue={profile?.name} required maxLength={60} /></label><label className="block"><span className="field-label">Profile color</span><span className="mt-2 flex items-center gap-3 rounded-[.875rem] border border-white/10 bg-[#0a160f] p-2"><input name="color" type="color" className="size-11 cursor-pointer rounded-lg border-0 bg-transparent" defaultValue={profile?.color || "#34D399"} aria-label="Profile color" /><span className="text-sm text-slate-400">Used for initials and profile switching</span></span></label>{error && <p className="text-sm text-rose-300" role="alert">{error}</p>}<SubmitButton loading={loading} label={profile ? "Save changes" : "Add person"} /></form></Modal></>;
}
