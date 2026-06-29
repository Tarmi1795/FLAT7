import { Leaf } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="FLAT7 HomeCare">
      <span className="relative grid size-10 shrink-0 place-items-center rounded-[14px] border border-emerald-300/20 bg-emerald-400 text-[#07110c] shadow-[0_8px_30px_rgba(52,211,153,.18)]">
        <span className="text-sm font-black tracking-[-0.08em]">F7</span>
        <Leaf className="absolute -right-1 -top-1 size-4 rounded-full bg-[#07110c] p-0.5 text-emerald-300" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">FLAT7</span>
          <span className="mt-1 block text-sm font-semibold text-white">HomeCare</span>
        </span>
      )}
    </div>
  );
}
