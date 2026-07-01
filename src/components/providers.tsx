"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoData } from "@/lib/demo-data";
import { enqueueQuickEntry, flushQuickEntries } from "@/lib/offline-queue";
import { getSupabaseBrowserClient as getConfiguredSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ACInput, ActivityItem, ActivityType, BillInput, CollectionTemplateInput, ExpenseKind, HouseholdData, PlantInput, ProfileInput, RoomInput } from "@/types/homecare";

type ProfileRow = { id: string; name: string; initials: string; color: string };
type RoomRow = { id: string; name: string; primary_profile_id: string };
type PlantRow = { id: string; name: string; species: string | null; room_id: string; assigned_profile_id: string | null; water_every_days: number; trim_every_days: number; last_watered_at: string | null; last_trimmed_at: string | null; created_at: string; photo_path: string | null };
type ACRow = { id: string; name: string; room_id: string; assigned_profile_id: string | null; maintenance_every_months: number; last_maintained_at: string | null; created_at: string };
type BillRow = { id: string; bill_id: string; amount: number | string; due_on: string; paid_at: string | null; paid_by_profile_id: string | null; bills: { kind: ExpenseKind; responsible_profile_id: string | null } | Array<{ kind: ExpenseKind; responsible_profile_id: string | null }> };
type BillTemplateRow = { id: string; kind: ExpenseKind; default_amount: number | string; due_day: number; start_month: string; responsible_profile_id: string | null; is_active: boolean };
type CollectionTemplateRow = { id: string; profile_id: string; amount: number | string; due_day: number; start_month: string; is_active: boolean };
type CollectionRow = { id: string; template_id: string; profile_id: string; billing_month: string; due_on: string; expected_amount: number | string; received_amount: number | string; remaining_amount: number | string; status: "unpaid" | "partial" | "paid"; settled_at: string | null };
type FinanceSummaryRow = { month: string; expected_collections: number | string; actual_collections: number | string; expected_expenses: number | string; actual_expenses: number | string };
type ActivityRow = { id: string; type: ActivityType; occurred_at: string; profile_id: string; entity_id: string; note: string | null };

const makeInitials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
const isHomecareRemoteEnabled = isSupabaseConfigured && process.env.NEXT_PUBLIC_E2E_MODE !== "1";
const getSupabaseBrowserClient = () => isHomecareRemoteEnabled ? getConfiguredSupabaseClient() : null;

type RecordActionInput = {
  type: ActivityType;
  entityId: string;
  occurredAt?: string;
  note?: string;
  amount?: number;
};

type HomecareContextValue = {
  data: HouseholdData;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  recordAction: (input: RecordActionInput) => ActivityItem;
  undoLast: () => void;
  addPlant: (input: PlantInput) => Promise<void>;
  updatePlant: (id: string, input: PlantInput) => Promise<void>;
  updatePlantWaterSchedule: (id: string, everyDays: number) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  addAC: (input: ACInput) => Promise<void>;
  updateAC: (id: string, input: ACInput) => Promise<void>;
  deleteAC: (id: string) => Promise<void>;
  addBill: (input: BillInput) => Promise<void>;
  updateBill: (id: string, input: BillInput, scope?: "month" | "future") => Promise<void>;
  deleteBill: (id: string, scope?: "month" | "future") => Promise<void>;
  saveCollectionTemplate: (input: CollectionTemplateInput) => Promise<void>;
  addRoom: (input: RoomInput) => Promise<void>;
  updateRoom: (id: string, input: RoomInput) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addProfile: (input: ProfileInput) => Promise<void>;
  updateProfile: (id: string, input: ProfileInput) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  updateActivity: (id: string, input: { occurredAt: string; note?: string; profileId: string }) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  updatePlantPhoto: (plantId: string, photo: File) => Promise<void>;
};

const HomecareContext = createContext<HomecareContextValue | null>(null);

function HomecareProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<HouseholdData>(demoData);
  const [activeProfileId, setProfile] = useState(demoData.profiles[0].id);
  const [previousData, setPreviousData] = useState<HouseholdData | null>(null);

  const loadRemote = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: membership } = await supabase.from("device_memberships").select("household_id,selected_profile_id").eq("auth_user_id", session.user.id).maybeSingle();
    if (!membership) return;
    const householdId = membership.household_id as string;
    const historyStart = new Date();
    historyStart.setMonth(historyStart.getMonth() - 11, 1);
    const [profilesResult, roomsResult, plantsResult, acResult, billTemplatesResult, billsResult, collectionTemplatesResult, collectionsResult, financeResult, activityResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("household_id", householdId).eq("is_active", true).order("created_at"),
      supabase.from("rooms").select("*").eq("household_id", householdId).is("archived_at", null).order("name"),
      supabase.from("plants").select("*").eq("household_id", householdId).is("archived_at", null).order("name"),
      supabase.from("ac_units").select("*").eq("household_id", householdId).is("archived_at", null).order("name"),
      supabase.from("bills").select("*").eq("household_id", householdId).order("kind"),
      supabase.from("bill_occurrences").select("*,bills!inner(kind,responsible_profile_id)").eq("household_id", householdId).gte("billing_month", historyStart.toISOString().slice(0, 10)).order("due_on"),
      supabase.from("collection_templates").select("*").eq("household_id", householdId).order("created_at"),
      supabase.from("collection_balances").select("*").eq("household_id", householdId).gte("billing_month", historyStart.toISOString().slice(0, 10)).order("due_on"),
      supabase.from("monthly_financial_summary").select("*").eq("household_id", householdId).gte("month", historyStart.toISOString().slice(0, 10)).order("month"),
      supabase.from("activity_feed").select("*").eq("household_id", householdId).is("archived_at", null).order("occurred_at", { ascending: false }).limit(100),
    ]);
    const profiles = ((profilesResult.data || []) as ProfileRow[]).map((row) => ({ id: row.id, name: row.name, initials: row.initials, color: row.color }));
    const rooms = ((roomsResult.data || []) as RoomRow[]).map((row) => ({ id: row.id, name: row.name, primaryProfileId: row.primary_profile_id }));
    const fallbackDate = new Date().toISOString();
    const plantRows = (plantsResult.data || []) as PlantRow[];
    const signedPlantImages = await Promise.all(plantRows.map(async (row) => {
      if (!row.photo_path) return undefined;
      const { data: signed } = await supabase.storage.from("plant-photos").createSignedUrl(row.photo_path, 3600);
      return signed?.signedUrl;
    }));
    const plants = plantRows.map((row, index) => ({ id: row.id, name: row.name, species: row.species || "House plant", roomId: row.room_id, assignedProfileId: row.assigned_profile_id || rooms.find((room) => room.id === row.room_id)?.primaryProfileId || profiles[0]?.id, waterEveryDays: row.water_every_days, trimEveryDays: row.trim_every_days, lastWateredAt: row.last_watered_at || row.created_at || fallbackDate, lastTrimmedAt: row.last_trimmed_at || row.created_at || fallbackDate, image: signedPlantImages[index], photoPath: row.photo_path || undefined }));
    const acUnits = ((acResult.data || []) as ACRow[]).map((row) => ({ id: row.id, name: row.name, roomId: row.room_id, assignedProfileId: row.assigned_profile_id || rooms.find((room) => room.id === row.room_id)?.primaryProfileId || profiles[0]?.id, maintenanceEveryMonths: row.maintenance_every_months, lastMaintainedAt: row.last_maintained_at || row.created_at || fallbackDate }));
    const billTemplates = ((billTemplatesResult.data || []) as BillTemplateRow[]).map((row) => ({ id: row.id, name: row.kind, defaultAmount: Number(row.default_amount), dueDay: row.due_day, startMonth: row.start_month, responsibleProfileId: row.responsible_profile_id || undefined, isActive: row.is_active }));
    const bills = ((billsResult.data || []) as BillRow[]).map((row) => { const bill = Array.isArray(row.bills) ? row.bills[0] : row.bills; return { id: row.id, billId: row.bill_id, name: bill.kind, amount: Number(row.amount), dueAt: row.due_on, paidAt: row.paid_at || undefined, paidByProfileId: row.paid_by_profile_id || undefined, responsibleProfileId: bill.responsible_profile_id || undefined }; });
    const collectionTemplates = ((collectionTemplatesResult.data || []) as CollectionTemplateRow[]).map((row) => ({ id: row.id, profileId: row.profile_id, amount: Number(row.amount), dueDay: row.due_day, startMonth: row.start_month, isActive: row.is_active }));
    const collections = ((collectionsResult.data || []) as CollectionRow[]).map((row) => ({ id: row.id, templateId: row.template_id, profileId: row.profile_id, billingMonth: row.billing_month, dueAt: row.due_on, expectedAmount: Number(row.expected_amount), receivedAmount: Number(row.received_amount), remainingAmount: Number(row.remaining_amount), status: row.status, settledAt: row.settled_at || undefined }));
    const financeSummaries = ((financeResult.data || []) as FinanceSummaryRow[]).map((row) => ({ month: row.month, expectedCollections: Number(row.expected_collections), actualCollections: Number(row.actual_collections), expectedExpenses: Number(row.expected_expenses), actualExpenses: Number(row.actual_expenses) }));
    const activity = ((activityResult.data || []) as ActivityRow[]).map((row) => { const entity = row.type === "maintenance" ? acUnits.find((item) => item.id === row.entity_id) : row.type === "payment" ? bills.find((item) => item.id === row.entity_id) : row.type === "collection" ? collections.find((item) => item.id === row.entity_id) : plants.find((item) => item.id === row.entity_id); const collectionProfile = row.type === "collection" && entity && "profileId" in entity ? profiles.find((item) => item.id === entity.profileId) : undefined; const verb = row.type === "water" ? "watered" : row.type === "trim" ? "trimmed" : row.type === "maintenance" ? "maintained" : row.type === "payment" ? "paid" : "contribution received"; const entityName = collectionProfile?.name || (entity && "name" in entity ? entity.name : undefined) || "Household item"; return { id: row.id, entityId: row.entity_id, type: row.type, title: `${entityName} ${verb}`, detail: row.note || "Completed", occurredAt: row.occurred_at, profileId: row.profile_id }; });
    setData({ profiles, rooms, plants, acUnits, billTemplates, bills, collectionTemplates, collections, financeSummaries, activity });
    if (membership.selected_profile_id) setProfile(membership.selected_profile_id as string);
  }, []);

  useEffect(() => {
    if (!isHomecareRemoteEnabled) return;
    const supabase = getSupabaseBrowserClient()!;
    const reload = () => void loadRemote();
    window.addEventListener("flat7-access-changed", reload);
    const channel = supabase.channel("flat7-household-changes").on("postgres_changes", { event: "*", schema: "public" }, reload).subscribe();
    queueMicrotask(reload);
    return () => { window.removeEventListener("flat7-access-changed", reload); void supabase.removeChannel(channel); };
  }, [loadRemote]);

  const setActiveProfileId = useCallback((id: string) => {
    setProfile(id);
    window.localStorage.setItem("flat7-active-profile", id);
    const supabase = getSupabaseBrowserClient();
    if (supabase) void (async () => { const { data: { user } } = await supabase.auth.getUser(); if (user) await supabase.from("device_memberships").update({ selected_profile_id: id, last_seen_at: new Date().toISOString() }).eq("auth_user_id", user.id); })();
  }, []);

  const recordAction = useCallback(
    ({ type, entityId, occurredAt = new Date().toISOString(), note, amount }: RecordActionInput) => {
      const id = crypto.randomUUID();
      let title = "Activity recorded";
      let detail = note || "Completed just now";
      setData((current) => {
        setPreviousData(current);
        const next: HouseholdData = structuredClone(current);
        if (type === "water" || type === "trim") {
          const plant = next.plants.find((item) => item.id === entityId);
          if (plant) {
            if (type === "water") plant.lastWateredAt = occurredAt;
            else plant.lastTrimmedAt = occurredAt;
            title = `${plant.name} ${type === "water" ? "watered" : "trimmed"}`;
            detail = next.rooms.find((room) => room.id === plant.roomId)?.name || detail;
          }
        } else if (type === "maintenance") {
          const unit = next.acUnits.find((item) => item.id === entityId);
          if (unit) {
            unit.lastMaintainedAt = occurredAt;
            title = `${unit.name} maintained`;
            detail = note || "Routine maintenance";
          }
        } else if (type === "payment") {
          const bill = next.bills.find((item) => item.id === entityId);
          if (bill) {
            bill.paidAt = occurredAt;
            bill.paidByProfileId = activeProfileId;
            title = `${bill.name} marked paid`;
            detail = note || `Payment recorded`;
          }
        } else {
          const contribution = next.collections.find((item) => item.id === entityId);
          if (contribution) {
            const received = Math.min(amount || contribution.remainingAmount, contribution.remainingAmount);
            contribution.receivedAmount += received;
            contribution.remainingAmount = Math.max(0, contribution.expectedAmount - contribution.receivedAmount);
            contribution.status = contribution.remainingAmount === 0 ? "paid" : "partial";
            if (contribution.status === "paid") contribution.settledAt = occurredAt;
            const person = next.profiles.find((item) => item.id === contribution.profileId);
            title = `${person?.name || "Housemate"} contribution received`;
            detail = note || `QAR ${received.toLocaleString("en-QA")} received`;
          }
        }
        const activity: ActivityItem = {
          id,
          entityId,
          type,
          title,
          detail,
          occurredAt,
          profileId: activeProfileId,
          pending: !navigator.onLine,
        };
        next.activity.unshift(activity);
        return next;
      });
      if (isHomecareRemoteEnabled) {
        const entry = { clientMutationId: id, type, entityId, profileId: activeProfileId, occurredAt, note, amount };
        void enqueueQuickEntry(entry).then(() => flushQuickEntries()).then(() => loadRemote());
      }
      return { id, type, title, detail, occurredAt, profileId: activeProfileId };
    },
    [activeProfileId, loadRemote],
  );

  const undoLast = useCallback(() => {
    if (previousData) {
      setData(previousData);
      setPreviousData(null);
    }
  }, [previousData]);

  const getHouseholdId = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;
    const user = (await supabase.auth.getUser()).data.user;
    const membership = user ? (await supabase.from("device_memberships").select("household_id").eq("auth_user_id", user.id).single()).data : null;
    if (!membership) throw new Error("Household membership was not found.");
    return membership.household_id as string;
  }, []);

  const uploadPlantPhoto = useCallback(async (plantId: string, householdId: string, photo: File) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    if (!navigator.onLine) throw new Error("Connect to the internet before uploading a photo.");
    const path = `${householdId}/${plantId}/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from("plant-photos").upload(path, photo, { contentType: "image/webp", cacheControl: "3600", upsert: false });
    if (uploadError) throw uploadError;
    const { error: updateError } = await supabase.from("plants").update({ photo_path: path }).eq("id", plantId).eq("household_id", householdId);
    if (updateError) {
      await supabase.storage.from("plant-photos").remove([path]);
      throw updateError;
    }
    return path;
  }, []);

  const addPlant = useCallback(async (input: PlantInput) => {
    const room = data.rooms.find((item) => item.id === input.roomId);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const user = (await supabase.auth.getUser()).data.user;
      const membership = user ? (await supabase.from("device_memberships").select("household_id").eq("auth_user_id", user.id).single()).data : null;
      if (!membership) throw new Error("Household membership was not found.");
      const { data: plant, error } = await supabase.from("plants").insert({ household_id: membership.household_id, name: input.name, species: input.species, room_id: input.roomId, assigned_profile_id: room?.primaryProfileId, water_every_days: input.waterEveryDays, trim_every_days: input.trimEveryDays }).select("id").single();
      if (error) throw error;
      if (input.photo) {
        try { await uploadPlantPhoto(plant.id, membership.household_id, input.photo); }
        catch (photoError) { await supabase.from("plants").delete().eq("id", plant.id); throw photoError; }
      }
      await loadRemote();
      return;
    }
    const { photo, ...plantInput } = input;
    setData((current) => ({ ...current, plants: [...current.plants, { id: crypto.randomUUID(), ...plantInput, image: photo ? URL.createObjectURL(photo) : undefined, assignedProfileId: room?.primaryProfileId || current.profiles[0].id, lastWateredAt: new Date().toISOString(), lastTrimmedAt: new Date().toISOString() }] }));
  }, [data.rooms, loadRemote, uploadPlantPhoto]);

  const deletePlant = useCallback(async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("plants").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, plants: current.plants.filter((plant) => plant.id !== id) }));
  }, [getHouseholdId, loadRemote]);

  const updatePlantPhoto = useCallback(async (plantId: string, photo: File) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const user = (await supabase.auth.getUser()).data.user;
      const membership = user ? (await supabase.from("device_memberships").select("household_id").eq("auth_user_id", user.id).single()).data : null;
      if (!membership) throw new Error("Household membership was not found.");
      const previousPath = data.plants.find((plant) => plant.id === plantId)?.photoPath;
      const newPath = await uploadPlantPhoto(plantId, membership.household_id, photo);
      if (previousPath && previousPath !== newPath) await supabase.storage.from("plant-photos").remove([previousPath]);
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, plants: current.plants.map((plant) => plant.id === plantId ? { ...plant, image: URL.createObjectURL(photo) } : plant) }));
  }, [data.plants, loadRemote, uploadPlantPhoto]);

  const updatePlant = useCallback(async (id: string, input: PlantInput) => {
    const room = data.rooms.find((item) => item.id === input.roomId);
    const currentPlant = data.plants.find((item) => item.id === id);
    const nextWaterDueOn = currentPlant ? new Date(new Date(currentPlant.lastWateredAt).getTime() + input.waterEveryDays * 86_400_000).toISOString().slice(0, 10) : null;
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("plants").update({ name: input.name, species: input.species, room_id: input.roomId, assigned_profile_id: room?.primaryProfileId, water_every_days: input.waterEveryDays, next_water_due_on: nextWaterDueOn, trim_every_days: input.trimEveryDays }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      if (input.photo) await updatePlantPhoto(id, input.photo);
      else await loadRemote();
      return;
    }
    setData((current) => ({ ...current, plants: current.plants.map((plant) => plant.id === id ? { ...plant, ...input, assignedProfileId: room?.primaryProfileId || plant.assignedProfileId, image: input.photo ? URL.createObjectURL(input.photo) : plant.image } : plant) }));
  }, [data.plants, data.rooms, getHouseholdId, loadRemote, updatePlantPhoto]);

  const updatePlantWaterSchedule = useCallback(async (id: string, everyDays: number) => {
    const plant = data.plants.find((item) => item.id === id);
    if (!plant) throw new Error("Plant was not found.");
    const nextWaterDueOn = new Date(new Date(plant.lastWateredAt).getTime() + everyDays * 86_400_000).toISOString().slice(0, 10);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("plants").update({ water_every_days: everyDays, next_water_due_on: nextWaterDueOn }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, plants: current.plants.map((item) => item.id === id ? { ...item, waterEveryDays: everyDays } : item) }));
  }, [data.plants, getHouseholdId, loadRemote]);

  const addAC = useCallback(async (input: ACInput) => {
    const room = data.rooms.find((item) => item.id === input.roomId);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const user = (await supabase.auth.getUser()).data.user;
      const membership = user ? (await supabase.from("device_memberships").select("household_id").eq("auth_user_id", user.id).single()).data : null;
      if (!membership) throw new Error("Household membership was not found.");
      const { error } = await supabase.from("ac_units").insert({ household_id: membership.household_id, name: input.name, room_id: input.roomId, assigned_profile_id: room?.primaryProfileId, maintenance_every_months: input.maintenanceEveryMonths });
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, acUnits: [...current.acUnits, { id: crypto.randomUUID(), ...input, assignedProfileId: room?.primaryProfileId || current.profiles[0].id, lastMaintainedAt: new Date().toISOString() }] }));
  }, [data.rooms, loadRemote]);

  const updateAC = useCallback(async (id: string, input: ACInput) => {
    const room = data.rooms.find((item) => item.id === input.roomId);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("ac_units").update({ name: input.name, room_id: input.roomId, assigned_profile_id: room?.primaryProfileId, maintenance_every_months: input.maintenanceEveryMonths }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, acUnits: current.acUnits.map((unit) => unit.id === id ? { ...unit, ...input, assignedProfileId: room?.primaryProfileId || unit.assignedProfileId } : unit) }));
  }, [data.rooms, getHouseholdId, loadRemote]);

  const deleteAC = useCallback(async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("ac_units").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, acUnits: current.acUnits.filter((unit) => unit.id !== id) }));
  }, [getHouseholdId, loadRemote]);

  const addBill = useCallback(async (input: BillInput) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const dueDay = Number(input.dueAt.slice(8, 10));
      const { data: existing } = await supabase.from("bills").select("id").eq("household_id", householdId).eq("kind", input.name).maybeSingle();
      if (existing?.id) {
        const { error } = await supabase.from("bills").update({ responsible_profile_id: input.responsibleProfileId || null, default_amount: input.amount, due_day: dueDay, start_month: `${input.dueAt.slice(0, 7)}-01`, is_active: true }).eq("id", existing.id).eq("household_id", householdId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bills").insert({ household_id: householdId, kind: input.name, responsible_profile_id: input.responsibleProfileId || null, default_amount: input.amount, due_day: dueDay, start_month: `${input.dueAt.slice(0, 7)}-01` });
        if (error) throw error;
      }
      await loadRemote();
      return;
    }
    if (data.bills.some((bill) => bill.name === input.name && bill.dueAt.slice(0, 7) === input.dueAt.slice(0, 7))) throw new Error(`${input.name} already has a bill for this month.`);
    setData((current) => ({ ...current, bills: [...current.bills, { id: crypto.randomUUID(), ...input }] }));
  }, [data.bills, getHouseholdId, loadRemote]);

  const updateBill = useCallback(async (id: string, input: BillInput, scope: "month" | "future" = "month") => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.rpc("update_bill_series", { occurrence_id: id, next_amount: input.amount, next_due_day: Number(input.dueAt.slice(8, 10)), next_responsible_profile_id: input.responsibleProfileId || null, change_scope: scope });
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, bills: current.bills.map((item) => item.id === id ? { ...item, ...input } : item) }));
  }, [loadRemote]);

  const deleteBill = useCallback(async (id: string, scope: "month" | "future" = "month") => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.rpc("delete_bill_series", { occurrence_id: id, change_scope: scope });
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, bills: current.bills.filter((bill) => bill.id !== id) }));
  }, [loadRemote]);

  const saveCollectionTemplate = useCallback(async (input: CollectionTemplateInput) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.rpc("save_collection_template", { target_profile_id: input.profileId, next_amount: input.amount, next_due_day: input.dueDay, next_start_month: input.startMonth, next_is_active: input.isActive });
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, collectionTemplates: current.collectionTemplates.some((item) => item.profileId === input.profileId) ? current.collectionTemplates.map((item) => item.profileId === input.profileId ? { ...item, ...input } : item) : [...current.collectionTemplates, { id: crypto.randomUUID(), ...input }] }));
  }, [loadRemote]);

  const addRoom = useCallback(async (input: RoomInput) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("rooms").insert({ household_id: householdId, name: input.name, primary_profile_id: input.primaryProfileId });
      if (error) throw error;
      await loadRemote();
      return;
    }
    if (data.rooms.some((room) => room.name.toLowerCase() === input.name.toLowerCase())) throw new Error("A room with this name already exists.");
    setData((current) => ({ ...current, rooms: [...current.rooms, { id: crypto.randomUUID(), ...input }] }));
  }, [data.rooms, getHouseholdId, loadRemote]);

  const updateRoom = useCallback(async (id: string, input: RoomInput) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("rooms").update({ name: input.name, primary_profile_id: input.primaryProfileId }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, rooms: current.rooms.map((room) => room.id === id ? { ...room, ...input } : room), plants: current.plants.map((plant) => plant.roomId === id ? { ...plant, assignedProfileId: input.primaryProfileId } : plant), acUnits: current.acUnits.map((unit) => unit.roomId === id ? { ...unit, assignedProfileId: input.primaryProfileId } : unit) }));
  }, [getHouseholdId, loadRemote]);

  const deleteRoom = useCallback(async (id: string) => {
    const room = data.rooms.find((item) => item.id === id);
    if (data.plants.some((plant) => plant.roomId === id) || data.acUnits.some((unit) => unit.roomId === id)) throw new Error(`Move or delete the plants and AC units in ${room?.name || "this room"} first.`);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("rooms").update({ archived_at: new Date().toISOString() }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, rooms: current.rooms.filter((item) => item.id !== id) }));
  }, [data.acUnits, data.plants, data.rooms, getHouseholdId, loadRemote]);

  const addProfile = useCallback(async (input: ProfileInput) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("profiles").insert({ household_id: householdId, name: input.name, initials: makeInitials(input.name), color: input.color });
      if (error) throw error;
      await loadRemote();
      return;
    }
    if (data.profiles.some((profile) => profile.name.toLowerCase() === input.name.toLowerCase())) throw new Error("A person with this name already exists.");
    setData((current) => ({ ...current, profiles: [...current.profiles, { id: crypto.randomUUID(), name: input.name, initials: makeInitials(input.name), color: input.color }] }));
  }, [data.profiles, getHouseholdId, loadRemote]);

  const updateProfile = useCallback(async (id: string, input: ProfileInput) => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("profiles").update({ name: input.name, initials: makeInitials(input.name), color: input.color }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, profiles: current.profiles.map((profile) => profile.id === id ? { ...profile, name: input.name, initials: makeInitials(input.name), color: input.color } : profile) }));
  }, [getHouseholdId, loadRemote]);

  const deleteProfile = useCallback(async (id: string) => {
    const profile = data.profiles.find((item) => item.id === id);
    if (data.profiles.length <= 1) throw new Error("Keep at least one person in the household.");
    const linked = data.rooms.some((room) => room.primaryProfileId === id) || data.plants.some((plant) => plant.assignedProfileId === id) || data.acUnits.some((unit) => unit.assignedProfileId === id) || data.bills.some((bill) => bill.responsibleProfileId === id) || data.collectionTemplates.some((template) => template.profileId === id && template.isActive && template.amount > 0);
    if (linked) throw new Error(`Reassign ${profile?.name || "this person"}'s rooms and tracked items before deleting them.`);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, profiles: current.profiles.filter((item) => item.id !== id) }));
  }, [data.acUnits, data.bills, data.collectionTemplates, data.plants, data.profiles, data.rooms, getHouseholdId, loadRemote]);

  const updateActivity = useCallback(async (id: string, input: { occurredAt: string; note?: string; profileId: string }) => {
    const activity = data.activity.find((item) => item.id === id);
    if (!activity) throw new Error("Activity entry was not found.");
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const table = activity.type === "maintenance" ? "ac_maintenance_logs" : activity.type === "payment" ? "bill_payments" : activity.type === "collection" ? "collection_payments" : "plant_care_logs";
      const payload = activity.type === "payment" ? { paid_at: input.occurredAt, paid_by_profile_id: input.profileId, note: input.note || null } : activity.type === "collection" ? { received_at: input.occurredAt, received_by_profile_id: input.profileId, note: input.note || null } : { occurred_at: input.occurredAt, performed_by_profile_id: input.profileId, note: input.note || null };
      const { error } = await supabase.from(table).update(payload).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => {
      const next = structuredClone(current);
      const target = next.activity.find((item) => item.id === id);
      if (target) { target.occurredAt = input.occurredAt; target.profileId = input.profileId; target.detail = input.note || "Completed"; }
      if (activity.entityId && activity.type === "water") { const plant = next.plants.find((item) => item.id === activity.entityId); if (plant) plant.lastWateredAt = input.occurredAt; }
      if (activity.entityId && activity.type === "trim") { const plant = next.plants.find((item) => item.id === activity.entityId); if (plant) plant.lastTrimmedAt = input.occurredAt; }
      if (activity.entityId && activity.type === "maintenance") { const unit = next.acUnits.find((item) => item.id === activity.entityId); if (unit) unit.lastMaintainedAt = input.occurredAt; }
      if (activity.entityId && activity.type === "payment") { const bill = next.bills.find((item) => item.id === activity.entityId); if (bill) { bill.paidAt = input.occurredAt; bill.paidByProfileId = input.profileId; } }
      return next;
    });
  }, [data.activity, getHouseholdId, loadRemote]);

  const deleteActivity = useCallback(async (id: string) => {
    const activity = data.activity.find((item) => item.id === id);
    if (!activity) throw new Error("Activity entry was not found.");
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const householdId = await getHouseholdId();
      const table = activity.type === "maintenance" ? "ac_maintenance_logs" : activity.type === "payment" ? "bill_payments" : activity.type === "collection" ? "collection_payments" : "plant_care_logs";
      const { error } = await supabase.from(table).update({ archived_at: new Date().toISOString() }).eq("id", id).eq("household_id", householdId);
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, activity: current.activity.filter((item) => item.id !== id) }));
  }, [data.activity, getHouseholdId, loadRemote]);

  const value = useMemo(
    () => ({ data, activeProfileId, setActiveProfileId, recordAction, undoLast, addPlant, updatePlant, updatePlantWaterSchedule, deletePlant, addAC, updateAC, deleteAC, addBill, updateBill, deleteBill, saveCollectionTemplate, addRoom, updateRoom, deleteRoom, addProfile, updateProfile, deleteProfile, updateActivity, deleteActivity, updatePlantPhoto }),
    [data, activeProfileId, setActiveProfileId, recordAction, undoLast, addPlant, updatePlant, updatePlantWaterSchedule, deletePlant, addAC, updateAC, deleteAC, addBill, updateBill, deleteBill, saveCollectionTemplate, addRoom, updateRoom, deleteRoom, addProfile, updateProfile, deleteProfile, updateActivity, deleteActivity, updatePlantPhoto],
  );

  return <HomecareContext.Provider value={value}>{children}</HomecareContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <HomecareProvider>{children}</HomecareProvider>
    </QueryClientProvider>
  );
}

export function useHomecare() {
  const value = useContext(HomecareContext);
  if (!value) throw new Error("useHomecare must be used inside Providers");
  return value;
}
