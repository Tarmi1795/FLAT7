"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreditCard, Home, Keyboard, Leaf, MoreHorizontal, Snowflake } from "lucide-react";
import { AppDialog } from "@/components/app-dialog";
import { QuickEntrySheet } from "@/components/quick-entry-sheet";
import { TopBar } from "@/components/top-bar";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plants", label: "Plants", icon: Leaf },
  { href: "/ac", label: "AC", icon: Snowflake },
  { href: "/bills", label: "Bills", icon: CreditCard },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

const shortcuts = [
  { keys: "Alt + 1", label: "Dashboard", href: "/" },
  { keys: "Alt + 2", label: "Plants", href: "/plants" },
  { keys: "Alt + 3", label: "AC units", href: "/ac" },
  { keys: "Alt + 4", label: "Bills", href: "/bills" },
  { keys: "Alt + 5", label: "Activity", href: "/activity" },
  { keys: "Alt + 6", label: "Household", href: "/more" },
] as const;

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/";
  const mainRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const updateHeaderClearance = () => {
      const bottom = headerRef.current?.getBoundingClientRect().bottom;
      const minimum = isDashboard ? 100 : 68;
      document.documentElement.style.setProperty("--app-header-clearance", `${Math.max(minimum, bottom || minimum)}px`);
    };
    updateHeaderClearance();
    const observer = new ResizeObserver(updateHeaderClearance);
    if (headerRef.current) observer.observe(headerRef.current);
    window.addEventListener("resize", updateHeaderClearance);
    return () => { observer.disconnect(); window.removeEventListener("resize", updateHeaderClearance); };
  }, [isDashboard]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.repeat || isTypingTarget(event.target)) return;
      if (!event.altKey && !event.ctrlKey && !event.metaKey && event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        setQuickEntryOpen(true);
        return;
      }
      const destination = shortcuts[Number(key) - 1];
      if (!destination) return;
      event.preventDefault();
      setShortcutsOpen(false);
      router.push(destination.href);
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (window.location.hash) {
        document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" });
        return;
      }
      if (mainRef.current) mainRef.current.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: "auto" });
      mainRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-emerald-300 px-4 py-2 font-bold text-[#07110c] transition focus:translate-y-0">Skip to content</a>
      {isDashboard ? (
        <main ref={mainRef} tabIndex={-1} id="main-content" className="dashboard-tablet-scroll tablet-scroll-container mx-auto w-full max-w-[1680px] px-2 pb-28 pt-2 sm:px-4 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-6">{children}</main>
      ) : (
        <div className="tablet-app-frame relative min-h-dvh overflow-hidden">
          <div className="app-ambient-bg" aria-hidden="true" />
          <div ref={headerRef} className="tablet-header-shell relative z-20 mx-auto w-full max-w-[1540px] px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">
            <div className="tablet-header-panel rounded-[26px] border border-white/[0.09] bg-[#07110c]/72 p-3 shadow-[0_28px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:rounded-[32px] sm:p-5 lg:p-6"><TopBar /></div>
          </div>
          <main ref={mainRef} tabIndex={-1} key={pathname} id="main-content" className="tablet-content tablet-scroll-container route-enter relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-28 pt-7 sm:px-6 sm:pt-9 lg:px-8 lg:pb-12 lg:pt-10">{children}</main>
        </div>
      )}
      <QuickEntrySheet open={quickEntryOpen} onOpenChange={setQuickEntryOpen} />
      <AppDialog open={shortcutsOpen} title="Keyboard shortcuts" eyebrow="Move faster" onClose={() => setShortcutsOpen(false)} className="sm:max-w-md">
        <div className="mt-5 space-y-2">
          {shortcuts.map((shortcut) => <div key={shortcut.keys} className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3"><span className="text-sm font-semibold text-slate-200">{shortcut.label}</span><kbd className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-xs font-bold text-emerald-200">{shortcut.keys}</kbd></div>)}
          <div className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3"><span className="text-sm font-semibold text-slate-200">Quick entry</span><kbd className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-xs font-bold text-emerald-200">Alt + N</kbd></div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-400"><Keyboard className="size-4" />Shortcuts pause while you type in a form.</p>
      </AppDialog>
      <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation">
        {navigation.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} className={cn("mobile-nav-item", active && "text-emerald-300")} aria-current={active ? "page" : undefined}><Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" /><span>{item.label}</span></Link>; })}
      </nav>
    </div>
  );
}
