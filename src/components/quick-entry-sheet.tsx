"use client";

import { useMemo, useState } from "react";
import { Check, CreditCard, HandCoins, Leaf, Plus, Scissors, Snowflake } from "lucide-react";
import { AppDialog } from "@/components/app-dialog";
import { useHomecare } from "@/components/providers";
import type { ActivityType } from "@/types/homecare";
import { qatarDate, qatarDateWithCurrentTime } from "@/lib/homecare";

const options: Array<{ type: ActivityType; label: string; icon: typeof Leaf; color: string }> = [
  { type: "water", label: "Water plant", icon: Leaf, color: "text-emerald-300 bg-emerald-300/10" },
  { type: "trim", label: "Trim plant", icon: Scissors, color: "text-lime-300 bg-lime-300/10" },
  { type: "maintenance", label: "Maintain AC", icon: Snowflake, color: "text-sky-300 bg-sky-300/10" },
  { type: "payment", label: "Pay bill", icon: CreditCard, color: "text-amber-200 bg-amber-200/10" },
  { type: "collection", label: "Receive contribution", icon: HandCoins, color: "text-violet-200 bg-violet-300/10" },
];

export function QuickEntrySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data, recordAction, undoLast } = useHomecare();
  const [selectedType, setSelectedType] = useState<ActivityType>("water");
  const [entityId, setEntityId] = useState(data.plants[0]?.id || "");
  const [success, setSuccess] = useState<string | null>(null);
  const [when, setWhen] = useState<"today" | "pick">("today");
  const [date, setDate] = useState(qatarDate());
  const [amount, setAmount] = useState("");

  const entities = useMemo(() => {
    if (selectedType === "water" || selectedType === "trim") return data.plants.map((item) => ({ id: item.id, name: item.name }));
    if (selectedType === "maintenance") return data.acUnits.map((item) => ({ id: item.id, name: item.name }));
    if (selectedType === "payment") return data.bills.filter((item) => !item.paidAt).map((item) => ({ id: item.id, name: `${item.name} bill` }));
    return data.collections.filter((item) => item.status !== "paid").map((item) => ({ id: item.id, name: `${data.profiles.find((profile) => profile.id === item.profileId)?.name || "Housemate"} · QAR ${item.remainingAmount}` }));
  }, [data, selectedType]);

  const effectiveEntityId = entities.some((entity) => entity.id === entityId) ? entityId : entities[0]?.id || "";
  const submit = () => {
    if (!effectiveEntityId) return;
    const selectedCollection = data.collections.find((item) => item.id === effectiveEntityId);
    const receivedAmount = selectedType === "collection" ? Number(amount || selectedCollection?.remainingAmount || 0) : undefined;
    if (selectedType === "collection" && (!receivedAmount || receivedAmount > (selectedCollection?.remainingAmount || 0))) return;
    const activity = recordAction({ type: selectedType, entityId: effectiveEntityId, amount: receivedAmount, occurredAt: when === "today" ? new Date().toISOString() : qatarDateWithCurrentTime(date) });
    onOpenChange(false);
    setSuccess(activity.title);
    window.setTimeout(() => setSuccess(null), 10000);
  };

  return (
    <>
      <button className="quick-fab" onClick={() => onOpenChange(true)} aria-label="Create quick entry">
        <Plus className="size-5" aria-hidden="true" />
        <span>Quick entry</span>
      </button>
      <AppDialog open={open} title="Quick entry" eyebrow="Add in seconds" onClose={() => onOpenChange(false)}>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {options.map((option) => {
                const Icon = option.icon;
                const selected = selectedType === option.type;
                return (
                  <button key={option.type} onClick={() => setSelectedType(option.type)} className={`entry-option ${selected ? "entry-option-selected" : ""}`} aria-pressed={selected}>
                    <span className={`grid size-9 place-items-center rounded-xl ${option.color}`}><Icon className="size-5" aria-hidden="true" /></span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
            <label className="mt-5 block">
              <span className="field-label">Choose item</span>
              <select className="field-input mt-2" value={effectiveEntityId} onChange={(event) => setEntityId(event.target.value)}>
                {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
              </select>
            </label>
            {selectedType === "collection" && <label className="mt-4 block"><span className="field-label">Amount received (QAR)</span><input className="field-input mt-2" type="number" min="0.01" step="0.01" value={amount} placeholder={String(data.collections.find((item) => item.id === effectiveEntityId)?.remainingAmount || "")} onChange={(event) => setAmount(event.target.value)} /></label>}
            <fieldset className="mt-4"><legend className="field-label">When?</legend><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" className={`chip min-h-11 justify-center ${when === "today" ? "border-emerald-300/30 text-emerald-200" : ""}`} onClick={() => setWhen("today")}>Today</button><button type="button" className={`chip min-h-11 justify-center ${when === "pick" ? "border-emerald-300/30 text-emerald-200" : ""}`} onClick={() => setWhen("pick")}>Pick a date</button></div></fieldset>
            {when === "pick" && <label className="mt-3 block"><span className="field-label">Transaction date</span><input className="field-input mt-2" type="date" max={qatarDate()} value={date} onChange={(event) => setDate(event.target.value)} /></label>}
            <button className="primary-button mt-5 w-full" onClick={submit} disabled={!effectiveEntityId}>
              <Check className="size-5" aria-hidden="true" /> Record entry
            </button>
      </AppDialog>
      {success && (
        <div className="fixed bottom-24 left-4 right-4 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-emerald-300/20 bg-[#12241a] p-3 shadow-2xl lg:bottom-6" role="status" aria-live="polite">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-300 text-[#07110c]"><Check className="size-5" /></span>
          <span className="min-w-0 flex-1 text-sm font-semibold text-white">{success}</span>
          <button className="min-h-11 px-2 text-sm font-bold text-emerald-300" onClick={() => { undoLast(); setSuccess(null); }}>Undo</button>
        </div>
      )}
    </>
  );
}
