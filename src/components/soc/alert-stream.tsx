import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Pause, Play } from "lucide-react";
import { LAB, scenarios, type Severity } from "@/lib/lab-data";
import { SeverityTag } from "@/components/soc/primitives";

export interface LiveAlert {
  id: string;
  scenarioId: string;
  title: string;
  rule: string;
  severity: Severity;
  host: string;
  sourceIp: string;
  time: string;
}

const scenarioMeta: Record<string, { severity: Severity; host: string; sourceIp: string }> = {
  S1: { severity: "high", host: "target-01", sourceIp: LAB.analystIp },
  S2: { severity: "info", host: "target-01", sourceIp: LAB.analystIp },
  S3: { severity: "medium", host: "target-01", sourceIp: LAB.analystIp },
  S4: { severity: "medium", host: "target-01", sourceIp: LAB.analystIp },
  S5: { severity: "high", host: "target-01", sourceIp: "127.0.0.1" },
  S6: { severity: "low", host: "target-01", sourceIp: "127.0.0.1" },
};

function clock(d: Date) {
  return d.toISOString().replace("T", " ").slice(0, 19);
}

let seq = 1;

export function useAlertStream() {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [live, setLive] = useState(true);
  const [muted, setMuted] = useState(false);
  const cursor = useRef(0);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const emit = useCallback((scenarioId?: string) => {
    const s =
      (scenarioId ? scenarios.find((x) => x.id === scenarioId) : undefined) ??
      scenarios[cursor.current++ % scenarios.length]!;
    const meta = scenarioMeta[s.id] ?? { severity: "info" as Severity, host: "target-01", sourceIp: LAB.analystIp };
    const alert: LiveAlert = {
      id: `ALR-${String(seq++).padStart(4, "0")}`,
      scenarioId: s.id,
      title: s.title,
      rule: s.detection,
      severity: meta.severity,
      host: meta.host,
      sourceIp: meta.sourceIp,
      time: clock(new Date()),
    };
    setAlerts((prev) => [alert, ...prev].slice(0, 25));

    if (!mutedRef.current) {
      const body = `${alert.id} · ${alert.host} ← ${alert.sourceIp} · ${alert.rule}`;
      if (alert.severity === "high" || alert.severity === "critical") {
        toast.error(`[${s.id}] ${alert.title}`, { description: body });
      } else if (alert.severity === "medium") {
        toast.warning(`[${s.id}] ${alert.title}`, { description: body });
      } else {
        toast(`[${s.id}] ${alert.title}`, { description: body });
      }
    }
    return alert;
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => emit(), 7000);
    return () => window.clearInterval(t);
  }, [live, emit]);

  return { alerts, live, setLive, muted, setMuted, emit };
}

export function LiveAlertFeed({
  alerts,
  live,
  setLive,
  muted,
  setMuted,
}: {
  alerts: LiveAlert[];
  live: boolean;
  setLive: (v: boolean) => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
}) {
  return (
    <div className="panel flex h-full flex-col p-4">
      <div className="flex items-center gap-2">
        <p className="label-caps">Real-time alerts</p>
        <span
          className={`ml-1 size-2 rounded-full ${live ? "animate-pulse bg-sev-critical" : "bg-muted-foreground"}`}
        />
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setLive(!live)}
            aria-label={live ? "Pause alert stream" : "Resume alert stream"}
            className="rounded border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {live ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute notifications" : "Mute notifications"}
            className="rounded border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {muted ? <BellOff className="size-3.5" /> : <Bell className="size-3.5" />}
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-72 flex-1 space-y-2 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">
            Waiting for detections from siem-01…
          </p>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="rounded border border-border/70 bg-secondary/40 p-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.7rem] text-accent">{a.scenarioId}</span>
                <span className="truncate text-xs font-medium">{a.title}</span>
                <SeverityTag severity={a.severity} className="ml-auto shrink-0" />
              </div>
              <p className="mt-1 font-mono text-[0.68rem] text-muted-foreground">
                {a.time} · {a.id} · {a.host} ← {a.sourceIp}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
