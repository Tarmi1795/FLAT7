"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoData } from "@/lib/demo-data";
import { enqueueQuickEntry, flushQuickEntries } from "@/lib/offline-queue";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ActivityItem, ActivityType, HouseholdData } from "@/types/homecare";

type ProfileRow = { id: string; name: string; initials: string; color: string };
type RoomRow = { id: string; name: string; primary_profile_id: string };
type PlantRow = { id: string; name: string; species: string | null; room_id: string; assigned_profile_id: string | null; water_every_days: number; trim_every_days: number; last_watered_at: string | null; last_trimmed_at: string | null; created_at: string; photo_path: string | null };
type ACRow = { id: string; name: string; room_id: string; assigned_profile_id: string | null; maintenance_every_months: number; last_maintained_at: string | null; created_at: string };
type BillRow = { id: string; amount: number | string; due_on: string; paid_at: string | null; paid_by_profile_id: string | null; bills: { kind: "Internet" | "Rent"; responsible_profile_id: string | null } | Array<{ kind: "Internet" | "Rent"; responsible_profile_id: string | null }> };
type ActivityRow = { id: string; type: ActivityType; occurred_at: string; profile_id: string; entity_id: string; note: string | null };

type RecordActionInput = {
  type: ActivityType;
  entityId: string;
  occurredAt?: string;
  note?: string;
};

type HomecareContextValue = {
  data: HouseholdData;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  recordAction: (input: RecordActionInput) => ActivityItem;
  undoLast: () => void;
  addPlant: (input: { name: string; species: string; roomId: string; waterEveryDays: number; trimEveryDays: number }) => Promise<void>;
  addAC: (input: { name: string; roomId: string; maintenanceEveryMonths: number }) => Promise<void>;
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
    const [profilesResult, roomsResult, plantsResult, acResult, billsResult, activityResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("household_id", householdId).eq("is_active", true).order("created_at"),
      supabase.from("rooms").select("*").eq("household_id", householdId).is("archived_at", null).order("name"),
      supabase.from("plants").select("*").eq("household_id", householdId).is("archived_at", null).order("name"),
      supabase.from("ac_units").select("*").eq("household_id", householdId).is("archived_at", null).order("name"),
      supabase.from("bill_occurrences").select("*,bills!inner(kind,responsible_profile_id)").eq("household_id", householdId).gte("due_on", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)).order("due_on"),
      supabase.from("activity_feed").select("*").eq("household_id", householdId).is("archived_at", null).order("occurred_at", { ascending: false }).limit(100),
    ]);
    const profiles = ((profilesResult.data || []) as ProfileRow[]).map((row) => ({ id: row.id, name: row.name, initials: row.initials, color: row.color }));
    const rooms = ((roomsResult.data || []) as RoomRow[]).map((row) => ({ id: row.id, name: row.name, primaryProfileId: row.primary_profile_id }));
    const fallbackDate = new Date().toISOString();
    const plants = ((plantsResult.data || []) as PlantRow[]).map((row) => ({ id: row.id, name: row.name, species: row.species || "House plant", roomId: row.room_id, assignedProfileId: row.assigned_profile_id || rooms.find((room) => room.id === row.room_id)?.primaryProfileId || profiles[0]?.id, waterEveryDays: row.water_every_days, trimEveryDays: row.trim_every_days, lastWateredAt: row.last_watered_at || row.created_at || fallbackDate, lastTrimmedAt: row.last_trimmed_at || row.created_at || fallbackDate, image: row.photo_path || undefined }));
    const acUnits = ((acResult.data || []) as ACRow[]).map((row) => ({ id: row.id, name: row.name, roomId: row.room_id, assignedProfileId: row.assigned_profile_id || rooms.find((room) => room.id === row.room_id)?.primaryProfileId || profiles[0]?.id, maintenanceEveryMonths: row.maintenance_every_months, lastMaintainedAt: row.last_maintained_at || row.created_at || fallbackDate }));
    const bills = ((billsResult.data || []) as BillRow[]).map((row) => { const bill = Array.isArray(row.bills) ? row.bills[0] : row.bills; return { id: row.id, name: bill.kind, amount: Number(row.amount), dueAt: row.due_on, paidAt: row.paid_at || undefined, paidByProfileId: row.paid_by_profile_id || undefined, responsibleProfileId: bill.responsible_profile_id || undefined }; });
    const activity = ((activityResult.data || []) as ActivityRow[]).map((row) => { const entity = row.type === "maintenance" ? acUnits.find((item) => item.id === row.entity_id) : row.type === "payment" ? bills.find((item) => item.id === row.entity_id) : plants.find((item) => item.id === row.entity_id); const verb = row.type === "water" ? "watered" : row.type === "trim" ? "trimmed" : row.type === "maintenance" ? "maintained" : "paid"; return { id: row.id, type: row.type, title: `${entity?.name || "Household item"} ${verb}`, detail: row.note || "Completed", occurredAt: row.occurred_at, profileId: row.profile_id }; });
    setData({ profiles, rooms, plants, acUnits, bills, activity });
    if (membership.selected_profile_id) setProfile(membership.selected_profile_id as string);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
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
    ({ type, entityId, occurredAt = new Date().toISOString(), note }: RecordActionInput) => {
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
        } else {
          const bill = next.bills.find((item) => item.id === entityId);
          if (bill) {
            bill.paidAt = occurredAt;
            bill.paidByProfileId = activeProfileId;
            title = `${bill.name} marked paid`;
            detail = note || `Payment recorded`;
          }
        }
        const activity: ActivityItem = {
          id,
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
      if (isSupabaseConfigured) {
        const entry = { clientMutationId: id, type, entityId, profileId: activeProfileId, occurredAt, note };
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

  const addPlant = useCallback(async (input: { name: string; species: string; roomId: string; waterEveryDays: number; trimEveryDays: number }) => {
    const room = data.rooms.find((item) => item.id === input.roomId);
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const user = (await supabase.auth.getUser()).data.user;
      const membership = user ? (await supabase.from("device_memberships").select("household_id").eq("auth_user_id", user.id).single()).data : null;
      if (!membership) throw new Error("Household membership was not found.");
      const { error } = await supabase.from("plants").insert({ household_id: membership.household_id, name: input.name, species: input.species, room_id: input.roomId, assigned_profile_id: room?.primaryProfileId, water_every_days: input.waterEveryDays, trim_every_days: input.trimEveryDays });
      if (error) throw error;
      await loadRemote();
      return;
    }
    setData((current) => ({ ...current, plants: [...current.plants, { id: crypto.randomUUID(), ...input, assignedProfileId: room?.primaryProfileId || current.profiles[0].id, lastWateredAt: new Date().toISOString(), lastTrimmedAt: new Date().toISOString() }] }));
  }, [data.rooms, loadRemote]);

  const addAC = useCallback(async (input: { name: string; roomId: string; maintenanceEveryMonths: number }) => {
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

  const value = useMemo(
    () => ({ data, activeProfileId, setActiveProfileId, recordAction, undoLast, addPlant, addAC }),
    [data, activeProfileId, setActiveProfileId, recordAction, undoLast, addPlant, addAC],
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
