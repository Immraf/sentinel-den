import { metrics } from "@/lib/lab-data";

export function Timeline() {
  const max = Math.max(...metrics.timeline);
  return (
    <div className="panel p-4">
      <p className="label-caps">Detected activity timeline (09:00 - 10:00, 5 min buckets)</p>
      <div className="mt-4 flex h-32 items-end gap-1.5">
        {metrics.timeline.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
            style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
            title={`${v} events`}
          />
        ))}
      </div>
    </div>
  );
}

export function HttpCodes() {
  const total = metrics.httpCodes.reduce((a, b) => a + b.count, 0);
  return (
    <div className="panel p-4">
      <p className="label-caps">HTTP status codes (web server)</p>
      <ul className="mt-4 space-y-3">
        {metrics.httpCodes.map((c) => (
          <li key={c.code} className="flex items-center gap-3">
            <span className="w-10 font-mono text-sm">{c.code}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={c.code.startsWith("2") ? "h-full bg-primary" : "h-full bg-accent"}
                style={{ width: `${(c.count / total) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono text-xs text-muted-foreground">{c.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TopSources() {
  return (
    <div className="panel p-4">
      <p className="label-caps">Top source addresses</p>
      <ul className="mt-4 space-y-3">
        {metrics.topSources.map((s) => (
          <li key={s.ip} className="flex items-center justify-between font-mono text-sm">
            <span>{s.ip}</span>
            <span className="text-muted-foreground">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
