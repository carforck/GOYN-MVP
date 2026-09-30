import { InfoIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { cn } from "@/lib/utils";

// KPI con definición y fuente visibles: "Confianza visible" (PRD §8.3).
export function KpiCard({
  label,
  value,
  hint,
  source,
  color = "#9B00FF",
  className,
}: {
  label: string;
  value: number;
  hint?: string;
  source?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg", className)}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
      <span aria-hidden className="absolute -top-14 -right-14 size-36 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30" style={{ backgroundColor: color }} />
      <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{label}</p>
      <AnimatedNumber value={value} className="mt-2 block font-heading text-4xl font-bold tracking-tight text-foreground" />
      {source && <p className="mt-2 text-[11px] font-semibold text-muted-foreground">{source}</p>}
      {hint && (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {hint}
        </p>
      )}
    </div>
  );
}
