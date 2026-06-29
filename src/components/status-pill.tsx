import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusPill({ status, label }: { status: "healthy" | "due" | "overdue" | "paid"; label?: string }) {
  const Icon = status === "overdue" ? AlertCircle : status === "due" ? Clock3 : CheckCircle2;
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold",
        status === "overdue" && "border-rose-400/20 bg-rose-400/10 text-rose-300",
        status === "due" && "border-amber-300/20 bg-amber-300/10 text-amber-200",
        (status === "healthy" || status === "paid") && "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label || status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}
