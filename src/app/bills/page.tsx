import type { Metadata } from "next";
import { BillsPage } from "@/components/bills-page";

export const metadata: Metadata = { title: "Bills" };
export default function Page() { return <BillsPage />; }
