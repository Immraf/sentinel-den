export const LAB = {
  network: "192.168.56.0/24 (VirtualBox Host-Only, isolated)",
  siemIp: "192.168.56.10",
  targetIp: "192.168.56.20",
  analystIp: "192.168.56.30",
};

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface SecurityEvent {
  id: string;
  time: string;
  host: string;
  sourceIp: string;
  user?: string;
  type: string;
  severity: Severity;
  raw: string;
}

export const vms = [
  {
    name: "siem-01",
    os: "Ubuntu Server 22.04 LTS",
    ip: LAB.siemIp,
    role: "Monitoring / SIEM",
    services: ["Wazuh Manager 4.7", "Wazuh Indexer", "Wazuh Dashboard :443", "rsyslog :514"],
  },
  {
    name: "target-01",
    os: "Debian 12",
    ip: LAB.targetIp,
    role: "Monitored target",
    services: ["OpenSSH :22", "Apache2 :80", "DVWA (local only)", "Wazuh Agent"],
  },
  {
    name: "analyst-01",
    os: "Kali Linux 2024.2",
    ip: LAB.analystIp,
    role: "Authorized testing",
    services: ["Nmap", "Wireshark", "OWASP ZAP"],
  },
];

export const events: SecurityEvent[] = [
  {
    id: "EVT-1001",
    time: "2026-08-11 09:14:02",
    host: "target-01",
    sourceIp: LAB.analystIp,
    user: "root",
    type: "SSH brute force (8 failures / 60s)",
    severity: "high",
    raw: "sshd[1421]: Failed password for root from 192.168.56.30 port 51244 ssh2",
  },
  {
    id: "EVT-1002",
    time: "2026-08-11 09:16:41",
    host: "target-01",
    sourceIp: LAB.analystIp,
    user: "labuser",
    type: "Successful SSH authentication",
    severity: "info",
    raw: "sshd[1490]: Accepted password for labuser from 192.168.56.30 port 51302 ssh2",
  },
  {
    id: "EVT-1003",
    time: "2026-08-11 09:22:10",
    host: "target-01",
    sourceIp: LAB.analystIp,
    type: "Port scan detected (SYN sweep, 1000 ports)",
    severity: "medium",
    raw: "kernel: [UFW BLOCK] SRC=192.168.56.30 DST=192.168.56.20 PROTO=TCP SPT=44212 DPT=3306",
  },
  {
    id: "EVT-1004",
    time: "2026-08-11 09:31:55",
    host: "target-01",
    sourceIp: LAB.analystIp,
    type: "Web scan - burst of 4xx responses",
    severity: "medium",
    raw: '192.168.56.30 - - [11/Aug/2026:09:31:55] "GET /.git/config HTTP/1.1" 404 452 "-" "Mozilla/5.0 (ZAP)"',
  },
  {
    id: "EVT-1005",
    time: "2026-08-11 09:38:07",
    host: "target-01",
    sourceIp: LAB.analystIp,
    user: "labuser",
    type: "Privilege escalation (sudo)",
    severity: "high",
    raw: "sudo: labuser : TTY=pts/1 ; PWD=/home/labuser ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow",
  },
  {
    id: "EVT-1006",
    time: "2026-08-11 09:44:19",
    host: "target-01",
    sourceIp: "127.0.0.1",
    user: "root",
    type: "Service restarted (apache2)",
    severity: "low",
    raw: "systemd[1]: apache2.service: Succeeded. Starting The Apache HTTP Server...",
  },
];

export const scenarios = [
  {
    id: "S1",
    title: "Failed SSH authentication",
    action: `hydra-free loop: 8 x ssh labuser@${LAB.targetIp} with wrong password`,
    expected: "Repeated auth failures aggregated into one alert",
    detection: "Wazuh rule 5712 (sshd brute force) / custom rule 100201",
    status: "Verified",
  },
  {
    id: "S2",
    title: "Successful SSH login",
    action: `ssh labuser@${LAB.targetIp} with valid credentials`,
    expected: "Accepted password event with source IP and username",
    detection: "Wazuh rule 5715",
    status: "Verified",
  },
  {
    id: "S3",
    title: "Network reconnaissance",
    action: `nmap -sS -sV -p- ${LAB.targetIp}`,
    expected: "SYN sweep visible in Wireshark, UFW blocks logged and forwarded",
    detection: "Custom rule 100301 (>20 blocked ports / 30s)",
    status: "Verified",
  },
  {
    id: "S4",
    title: "Web application requests",
    action: "OWASP ZAP passive scan + spider against http://target-01/dvwa",
    expected: "Requests, status codes, user agents in access.log and SIEM",
    detection: "Custom rule 100401 (4xx burst from single IP)",
    status: "Verified",
  },
  {
    id: "S5",
    title: "Privileged activity",
    action: "sudo cat /etc/shadow on target-01",
    expected: "sudo event with invoking user and command",
    detection: "Wazuh rule 5402 + custom 100501 for sensitive file reads",
    status: "Verified",
  },
  {
    id: "S6",
    title: "Service activity",
    action: "systemctl restart apache2",
    expected: "journald service transition collected centrally",
    detection: "Custom rule 100601",
    status: "Verified",
  },
];

export const findings = [
  {
    id: "F-01",
    title: "SSH permits password authentication and root login",
    risk: "Credential brute force leading to full host compromise",
    severity: "high" as Severity,
    evidence: "evidence/logs/03_failed_ssh_detection.png, sshd_config baseline",
    recommendation: "Key-based auth only, PermitRootLogin no, deploy fail2ban, restrict to lab subnet",
  },
  {
    id: "F-02",
    title: "Vulnerable web app reachable from the whole lab subnet",
    risk: "Unintended exposure of injection and XSS endpoints",
    severity: "medium" as Severity,
    evidence: "evidence/zap/07_zap_local_app_assessment.png",
    recommendation: "Bind DVWA to 127.0.0.1, front with authenticated reverse proxy for demos",
  },
  {
    id: "F-03",
    title: "Missing security headers on Apache responses",
    risk: "Clickjacking, MIME sniffing, mixed-content downgrade",
    severity: "low" as Severity,
    evidence: "ZAP passive alerts: CSP, X-Content-Type-Options, X-Frame-Options absent",
    recommendation: "Enable headers module with CSP, HSTS, X-Frame-Options DENY",
  },
  {
    id: "F-04",
    title: "No log retention or integrity policy",
    risk: "Evidence loss and tampering during investigation",
    severity: "medium" as Severity,
    evidence: "Default rotation, no archive signing on siem-01",
    recommendation: "90-day archive retention, immutable archives, NTP sync across all VMs",
  },
];

export const remediation = [
  {
    priority: "Critical",
    item: "Disable root SSH login and password authentication",
    risk: "F-01 brute force compromise",
    benefit: "Removes the primary credential attack path",
  },
  {
    priority: "High",
    item: "Enforce host firewall default-deny with explicit lab allow rules",
    risk: "Unnecessary service exposure",
    benefit: "Shrinks attack surface and makes scans noisy and detectable",
  },
  {
    priority: "High",
    item: "Alert thresholds for repeated auth failure and sudo misuse",
    risk: "Undetected intrusion attempts",
    benefit: "Analyst notified within seconds of an attempt",
  },
  {
    priority: "Medium",
    item: "Bind the vulnerable app to loopback and add security headers",
    risk: "F-02, F-03",
    benefit: "Contains deliberately weak code inside a single host",
  },
  {
    priority: "Medium",
    item: "Centralize retention, enable NTP, sign archived logs",
    risk: "F-04 evidence integrity",
    benefit: "Correlatable, defensible timeline evidence",
  },
  {
    priority: "Low",
    item: "Automated unattended security updates on all lab VMs",
    risk: "Known vulnerable packages",
    benefit: "Baseline patch hygiene with no manual effort",
  },
];

export const metrics = {
  totalEvents: 1284,
  failedAuth: 96,
  successfulLogins: 14,
  alerts: 11,
  topSources: [
    { ip: LAB.analystIp, count: 842 },
    { ip: "127.0.0.1", count: 311 },
    { ip: LAB.siemIp, count: 131 },
  ],
  httpCodes: [
    { code: "200", count: 214 },
    { code: "302", count: 38 },
    { code: "404", count: 176 },
    { code: "403", count: 41 },
    { code: "500", count: 7 },
  ],
  timeline: [4, 9, 6, 22, 41, 18, 27, 63, 35, 12, 8, 5],
};
