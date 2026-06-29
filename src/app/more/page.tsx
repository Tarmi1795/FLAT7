import type { Metadata } from "next";
import { MorePage } from "@/components/more-page";

export const metadata: Metadata = { title: "More" };
export default function Page() { return <MorePage />; }
