import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FLAT7 HomeCare",
    short_name: "FLAT7",
    description: "Shared plant care, AC maintenance, and bill reminders.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#07110C",
    theme_color: "#07110C",
    categories: ["lifestyle", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
