import { createFileRoute } from "@tanstack/react-router";
import { Section, SeverityTag, Stat } from "@/components/soc/primitives";
import { HttpCodes, Timeline, TopSources } from "@/components/soc/charts";
import { LiveAlertFeed, useAlertStream } from "@/components/soc/alert-stream";
import { LAB, events, findings, metrics, remediation, scenarios, vms } from "@/lib/lab-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Basic SIEM & Log Monitoring Lab | SOC Console" },
      {
        name: "description",
        content:
          "Isolated VirtualBox SIEM lab: centralized log collection, six detection scenarios, Nmap/Wireshark/ZAP evidence, findings and hardening plan.",
      },
      { property: "og:title", content: "Basic SIEM & Log Monitoring Lab | SOC Console" },
      {
        property: "og:description",
        content:
          "Detection scenarios, SOC dashboard, investigation workflow and remediation plan for an isolated VirtualBox monitoring lab.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const nav = [
  ["overview", "Overview"],
  ["architecture", "Architecture"],
  ["dashboard", "Dashboard"],
  ["scenarios", "Scenarios"],
  ["investigation", "Investigation"],
  ["findings", "Findings"],
  ["remediation", "Remediation"],
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <span className="font-mono text-sm tracking-tight">
            <span className="text-primary">soc</span>://basic-siem-lab
          </span>
          <nav className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {nav.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="transition-colors hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>
          <span className="ml-auto flex items-center gap-2 font-mono text-[0.7rem] text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            ISOLATED LAB · NO INTERNET EGRESS
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-6 py-12">
        <Section
          id="overview"
          kicker="Project"
          title="Basic SIEM and Log Monitoring System for Security Event Detection"
        >
          <div className="panel p-6">
            <h1 className="sr-only">Basic SIEM and Log Monitoring Lab</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The lab starts from zero monitoring visibility. Three VirtualBox virtual machines on an
              isolated host-only network generate, collect and correlate security-relevant logs: Linux
              authentication, sudo, systemd service events, kernel firewall drops and Apache access logs are
              shipped to a single-node Wazuh manager. Six reproducible scenarios prove the pipeline detects
              real activity, and every test is confined to systems owned by the lab.
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["Lab network", LAB.network],
                ["SIEM manager", `${LAB.siemIp} (siem-01)`],
                ["Monitored target", `${LAB.targetIp} (target-01)`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="label-caps">{k}</dt>
                  <dd className="mt-1 font-mono text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

        <Section id="architecture" kicker="Section 5" title="Lab architecture and topology">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <pre className="panel overflow-x-auto p-5 font-mono text-xs leading-relaxed text-muted-foreground">
{`  analyst-01  (Kali)      ${LAB.analystIp}
        |
        |  vboxnet0 — Host-Only, isolated
        |  ${LAB.network}
        |
  target-01   (Debian)    ${LAB.targetIp}
        |  agent 1514/udp + syslog 514
        |
  siem-01     (Ubuntu)    ${LAB.siemIp}
                dashboard :443`}
            </pre>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {vms.map((vm) => (
                <div key={vm.name} className="panel p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-sm text-primary">{vm.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{vm.ip}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {vm.os} · {vm.role}
                  </p>
                  <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground">
                    {vm.services.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="dashboard" kicker="Section 9" title="SOC dashboard">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total security events" value={metrics.totalEvents} hint="last 24h, all hosts" />
            <Stat label="Failed authentication" value={metrics.failedAuth} hint="sshd + sudo" />
            <Stat label="Successful logins" value={metrics.successfulLogins} hint="ssh accepted" />
            <Stat label="Open alerts" value={metrics.alerts} hint="rule level >= 7" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Timeline />
            </div>
            <TopSources />
            <HttpCodes />
            <div className="panel p-4 lg:col-span-2">
              <p className="label-caps">Recent events</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="label-caps">
                    <tr>
                      <th className="pb-2 pr-3 font-normal">Time</th>
                      <th className="pb-2 pr-3 font-normal">Host</th>
                      <th className="pb-2 pr-3 font-normal">Source</th>
                      <th className="pb-2 pr-3 font-normal">Event</th>
                      <th className="pb-2 font-normal">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {events.map((e) => (
                      <tr key={e.id} className="border-t border-border/70">
                        <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{e.time}</td>
                        <td className="py-2 pr-3">{e.host}</td>
                        <td className="py-2 pr-3">{e.sourceIp}</td>
                        <td className="py-2 pr-3 font-sans">{e.type}</td>
                        <td className="py-2">
                          <SeverityTag severity={e.severity} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>

        <Section id="scenarios" kicker="Section 8" title="Controlled detection scenarios">
          <div className="grid gap-4 md:grid-cols-2">
            {scenarios.map((s) => (
              <div key={s.id} className="panel p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-accent">{s.id}</p>
                  <span className="rounded border border-primary/50 bg-primary/10 px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-widest text-primary">
                    {s.status}
                  </span>
                </div>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-2 font-mono text-[0.72rem] break-words text-muted-foreground">{s.action}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-foreground">Expected:</span> {s.expected}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="text-foreground">Detection:</span> {s.detection}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="investigation" kicker="Section 10" title="Investigation workflow">
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            Event → Alert → Investigation → Evidence → Assessment → Remediation
          </p>
          <div className="space-y-3">
            {events
              .filter((e) => e.severity === "high" || e.severity === "medium")
              .map((e) => (
                <div key={e.id} className="panel p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-accent">{e.id}</span>
                    <span className="font-semibold">{e.type}</span>
                    <SeverityTag severity={e.severity} className="ml-auto" />
                  </div>
                  <div className="mt-3 grid gap-2 font-mono text-[0.72rem] text-muted-foreground sm:grid-cols-4">
                    <span>time: {e.time}</span>
                    <span>host: {e.host}</span>
                    <span>src: {e.sourceIp}</span>
                    <span>user: {e.user ?? "n/a"}</span>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded bg-secondary/60 p-3 font-mono text-[0.72rem] text-foreground">
{e.raw}
                  </pre>
                </div>
              ))}
          </div>
        </Section>

        <Section id="findings" kicker="Section 9 (report)" title="Findings">
          <div className="space-y-3">
            {findings.map((f) => (
              <div key={f.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs text-accent">{f.id}</span>
                  <span className="font-semibold">{f.title}</span>
                  <SeverityTag severity={f.severity} className="ml-auto" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-foreground">Risk:</span> {f.risk}
                </p>
                <p className="mt-1 font-mono text-[0.72rem] text-muted-foreground">{f.evidence}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-foreground">Recommendation:</span> {f.recommendation}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="remediation" kicker="Deliverable 3" title="Prioritized remediation and hardening">
          <div className="panel overflow-x-auto p-4">
            <table className="w-full text-left text-xs">
              <thead className="label-caps">
                <tr>
                  <th className="pb-2 pr-4 font-normal">Priority</th>
                  <th className="pb-2 pr-4 font-normal">Recommendation</th>
                  <th className="pb-2 pr-4 font-normal">Risk addressed</th>
                  <th className="pb-2 font-normal">Expected benefit</th>
                </tr>
              </thead>
              <tbody>
                {remediation.map((r) => (
                  <tr key={r.item} className="border-t border-border/70 align-top">
                    <td className="py-2 pr-4 font-mono text-accent">{r.priority}</td>
                    <td className="py-2 pr-4">{r.item}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{r.risk}</td>
                    <td className="py-2 text-muted-foreground">{r.benefit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          Defensive laboratory project. All testing confined to VirtualBox host-only network{" "}
          <span className="font-mono">{LAB.network}</span>. No public hosts, no real credentials, no
          destructive exploitation.
        </div>
      </footer>
    </div>
  );
}
