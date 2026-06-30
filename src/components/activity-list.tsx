"use client";

import { CreditCard, Leaf, Scissors, Snowflake } from "lucide-react";
import { useHomecare } from "@/components/providers";
import { DeleteEntryButton, EditActivityDialog } from "@/components/manage-entry-dialogs";
import { formatRelativeDay } from "@/lib/homecare";
import type { ActivityItem } from "@/types/homecare";

const icons = { water: Leaf, trim: Scissors, maintenance: Snowflake, payment: CreditCard };
const colors = {
  water: "bg-emerald-300/10 text-emerald-300",
  trim: "bg-lime-300/10 text-lime-300",
  maintenance: "bg-sky-300/10 text-sky-300",
  payment: "bg-amber-200/10 text-amber-200",
};

export function ActivityList({ items, manageable = false }: { items: ActivityItem[]; manageable?: boolean }) {
  const { data, deleteActivity } = useHomecare();
  if (items.length === 0) return <div className="py-8 text-center text-sm text-slate-400">No activity entries yet.</div>;
  return (
    <div className="divide-y divide-white/[0.06]">
      {items.map((item) => {
        const Icon = icons[item.type];
        const profile = data.profiles.find((person) => person.id === item.profileId);
        return (
          <article key={item.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${colors[item.type]}`}><Icon className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-white">{item.title}</h3>
                {item.pending && <span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">Pending sync</span>}
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-400">{item.detail} · by {profile?.name || "Household"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2"><time className="text-xs font-medium text-slate-500" dateTime={item.occurredAt}>{formatRelativeDay(item.occurredAt)}</time>{manageable && <><EditActivityDialog activity={item} /><DeleteEntryButton compact itemName={item.title} itemType="activity entry" detail="This history entry will be archived. The related last-service or payment date will be recalculated from the remaining history." onDelete={() => deleteActivity(item.id)} /></>}</div>
          </article>
        );
      })}
    </div>
  );
}
