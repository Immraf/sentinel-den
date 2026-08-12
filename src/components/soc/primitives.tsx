import type { Severity } from "@/lib/lab-data";
import { cn } from "@/lib/utils";

const map: Record<Severity, string> = {
  critical: "text-sev-critical border-sev-critical/50 bg-sev-critical/10",
  high: "text-sev-high border-sev-high/50 bg-sev-high/10",
  medium: "text-sev-medium border-sev-medium/50 bg-sev-medium/10",
  low: "text-sev-low border-sev-low/50 bg-sev-low/10",
  info: "text-sev-info border-sev-info/50 bg-sev-info/10",
};

export function SeverityTag({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest",
        map[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="panel p-4">
      <p className="label-caps">{label}</p>
      <p className="mt-2 font-mono text-3xl text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Section({
  id,
  title,
  kicker,
  children,
}: {
  id: string;
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="label-caps">{kicker}</p>
      <h2 className="mt-1 mb-5 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
