import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { AccessGate } from "@/components/access-gate";
import { Providers } from "@/components/providers";
import { PwaManager } from "@/components/pwa-manager";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "FLAT7 HomeCare", template: "%s · FLAT7 HomeCare" },
  description: "Shared plant care, AC maintenance, and bill reminders for FLAT7.",
  applicationName: "FLAT7 HomeCare",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FLAT7" },
  formatDetection: { telephone: false },
};

export const viewport = { themeColor: "#07110C", colorScheme: "dark" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers><PwaManager /><AccessGate><AppShell>{children}</AppShell></AccessGate></Providers>
      </body>
    </html>
  );
}
