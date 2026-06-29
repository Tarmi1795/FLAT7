import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return <section className="mx-auto max-w-lg py-20 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-300/10 text-amber-200"><WifiOff /></span><h1 className="mt-5 text-2xl font-bold text-white">You are offline</h1><p className="mt-2 text-slate-400">Recent screens stay available, and quick entries will sync when your connection returns.</p></section>;
}
