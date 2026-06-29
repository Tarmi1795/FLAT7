import type { Metadata } from "next";
import { PlantsPage } from "@/components/plants-page";

export const metadata: Metadata = { title: "Plants" };
export default function Page() { return <PlantsPage />; }
