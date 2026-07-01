export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3" aria-label="FLAT7 HomeCare">
    <svg className="size-11 shrink-0 drop-shadow-[0_8px_24px_rgba(52,211,153,.18)]" viewBox="0 0 48 48" role="img" aria-label="FLAT7 home logo">
      <path d="M5 22.2 24 6l19 16.2v18.3a3.5 3.5 0 0 1-3.5 3.5h-31A3.5 3.5 0 0 1 5 40.5V22.2Z" fill="#34D399" />
      <path d="M10.3 23.9 24 12.1l13.7 11.8v14.4H10.3V23.9Z" fill="#07110C" opacity=".94" />
      <text x="24" y="32.2" textAnchor="middle" fill="#F0FDF4" fontSize="12" fontWeight="900" letterSpacing="-.6">F7</text>
      <path d="M33.5 9.2c4.4-.2 7 2.1 7.4 6.7-4.8.5-7.4-1.9-7.4-6.7Z" fill="#BEF264" />
      <path d="m33.9 10 5.4 4.6" stroke="#07110C" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
    {!compact && <span className="leading-none"><span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300">FLAT7</span><span className="mt-1 block text-sm font-semibold text-white">HomeCare</span></span>}
  </div>;
}
