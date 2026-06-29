"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CreditCard, Home, Leaf, MoreHorizontal, Snowflake } from "lucide-react";
import { Brand } from "@/components/brand";
import { ProfileSwitcher } from "@/components/profile-switcher";
import { QuickEntrySheet } from "@/components/quick-entry-sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plants", label: "Plants", icon: Leaf },
  { href: "/ac", label: "AC", icon: Snowflake },
  { href: "/bills", label: "Bills", icon: CreditCard },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-emerald-300 px-4 py-2 font-bold text-[#07110c] transition focus:translate-y-0">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/[0.08] bg-[#09140e]/95 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="px-2"><Brand /></div>
        <nav className="mt-10 space-y-1" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn("nav-item", active && "nav-item-active")} aria-current={active ? "page" : undefined}>
                <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <Link href="/activity" className={cn("nav-item", pathname.startsWith("/activity") && "nav-item-active")}>
            <Activity className="size-5" strokeWidth={1.8} aria-hidden="true" />
            Activity
          </Link>
        </nav>
        <div className="mt-auto rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.05] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">This week</p>
          <p className="mt-2 text-2xl font-bold text-white">8 completed</p>
          <p className="mt-1 text-sm text-slate-400">Small actions, calmer home.</p>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-white/[0.06] bg-[#07110c]/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="lg:hidden"><Brand compact /></div>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">FLAT7 household</p>
            <p className="mt-0.5 text-sm text-slate-400">Asia/Qatar · Shared household</p>
          </div>
          <ProfileSwitcher />
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      <QuickEntrySheet />
      <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation">
        {navigation.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("mobile-nav-item", active && "text-emerald-300")} aria-current={active ? "page" : undefined}>
              <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
