import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ title, description, href }: { title: string; description?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {href && <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-emerald-300">View all <ArrowRight className="size-4" /></Link>}
    </div>
  );
}
