"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Home, Leaf, MoreHorizontal, Snowflake } from "lucide-react";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === "/";
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-emerald-300 px-4 py-2 font-bold text-[#07110c] transition focus:translate-y-0">Skip to content</a>
      {isDashboard ? (
        <main id="main-content" className="dashboard-tablet-scroll tablet-scroll-container mx-auto w-full max-w-[1680px] px-2 pb-28 pt-2 sm:px-4 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-6">{children}</main>
      ) : (
        <div className="tablet-app-frame relative min-h-dvh overflow-hidden">
          <div className="app-ambient-bg" aria-hidden="true" />
          <div className="tablet-header-shell relative z-20 mx-auto w-full max-w-[1540px] px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">
            <div className="tablet-header-panel rounded-[26px] border border-white/[0.09] bg-[#07110c]/72 p-3 shadow-[0_28px_90px_rgba(0,0,0,.38)] backdrop-blur-xl sm:rounded-[32px] sm:p-5 lg:p-6"><TopBar /></div>
          </div>
          <main key={pathname} id="main-content" className="tablet-content tablet-scroll-container route-enter relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-28 pt-7 sm:px-6 sm:pt-9 lg:px-8 lg:pb-12 lg:pt-10">{children}</main>
        </div>
      )}
      <QuickEntrySheet />
      <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation">
        {navigation.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} className={cn("mobile-nav-item", active && "text-emerald-300")} aria-current={active ? "page" : undefined}><Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" /><span>{item.label}</span></Link>; })}
      </nav>
    </div>
  );
}
