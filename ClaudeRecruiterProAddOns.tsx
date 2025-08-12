'use client'

// Claude Recruiter Pro Add-Ons (Next.js + TypeScript)
// Extended with: Admin-tunable AI settings, Audit & Analytics dashboard,
// Data-compliance helpers (mask/encrypt), latency tracking, and the prior
// features (scheduler, prescreen, boolean builder, smart search, analytics,
// animated timeline). Single-file artifact for easy drop-in.
//
// Deps: npm i luxon framer-motion recharts lucide-react
// TailwindCSS assumed.

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DateTime, IANAZone, Interval } from "luxon";
import {
  Calendar,
  Clock,
  Brain,
  Search,
  Wand2,
  Network,
  BarChart3,
  History,
  Shield,
  Settings2,
  CheckCircle2,
  Activity,
  Award,
  Users,
  Download,
  Send
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// =============================================
// 0) Utilities, Settings, Audit & Claude bridge
// =============================================

type FieldKey = "name" | "email" | "department" | "role" | "phone";

type AdminSettings = {
  deptRoleMap: Record<string, string[]>;
  thresholds: Partial<Record<FieldKey, number>>; // 0-1
  optIn: Partial<Record<FieldKey, boolean>>; // AI writes only when true
  piiEncryptionKey?: string; // base64; optional demo
};

const defaultSettings: AdminSettings = {
  deptRoleMap: {
    Engineering: ["Software Engineer", "Senior Developer", "Tech Lead"],
    Consulting: ["IT Strategy Consultant", "Engagement Manager"],
    Data: ["Data Engineer", "Analytics Engineer", "Data Architect"],
  },
  thresholds: { name: 0.6, email: 0.8, department: 0.6, role: 0.65, phone: 0.7 },
  optIn: { name: true, email: true, department: true, role: true, phone: false },
};

// simple in-memory audit bus
 type AuditEvent =
  | { type: "suggestion.accepted"; field: FieldKey; latencyMs: number }
  | { type: "suggestion.rejected"; field: FieldKey; latencyMs: number };

const auditLog: AuditEvent[] = [];
export function logAudit(e: AuditEvent) { auditLog.push(e); }
export function readAudit() { return [...auditLog]; }

// lightweight PII masking & optional encryption stubs
export function maskPII(input: string): string {
  return input.replace(/(\d)[\d\-\s]{6,}(\d)/g, "$1••••••$2");
}

export async function encryptText(text: string, base64Key?: string): Promise<string> {
  if (!base64Key) return text; // demo: pass-through when not set
  const keyBytes = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  const out = new Uint8Array(iv.byteLength + enc.byteLength);
  out.set(iv, 0); out.set(new Uint8Array(enc), iv.byteLength);
  return btoa(String.fromCharCode(...out));
}

// Claude stub with latency metric
async function runClaude<T>(task: string, input: any): Promise<T> {
  const t0 = performance.now();
  await new Promise((r) => setTimeout(r, 220));
  const latency = performance.now() - t0;
  switch (task) {
    case "suggestPrescreen":
      return {
        questions: [
          "Walk me through a project where you moved a KPI within 90 days.",
          "Describe your most complex incident and your recovery plan.",
          "How do you prioritize tradeoffs on time-to-value vs scalability?",
          "Give a concise system design for <role> handling 10x load.",
          "What would your 30/60/90 plan be for this client?",
        ],
        rubric: [
          "Evidence of impact with metrics",
          "Risk detection + mitigation clarity",
          "Decision rationale under constraints",
          "Technical depth appropriate to level",
          "Communication crispness",
        ],
        latency,
      } as T;
    case "booleanAssist":
      return {
        query: "(\"Azure Data Architect\" OR (Azure AND (Databricks OR Synapse)) AND (\"healthcare\" OR payer OR provider) AND (HIPAA OR PHI) NOT (intern OR junior))",
        expansions: ["Synapse -> Fabric lineage", "Databricks -> PySpark, Delta"],
        latency,
      } as T;
    case "searchSuggest":
      return {
        suggestions: [
          "Try adding 'site:linkedin.com/in' to narrow to profiles",
          "Add 'intitle:resume OR inurl:resume' for raw resumes",
          "Geo-bias: (\"Boston, MA\" OR Remote ET) to align timezones",
        ],
        latency,
      } as T;
    case "marketInsight":
      return {
        card: {
          title: "Senior Azure Data roles: East Coast",
          stat: "+9% YoY salary drift",
          note: "K8s + Spark premium holding; Fabric demand rising",
        },
        latency,
      } as T;
    default:
      return { ok: true, latency } as T;
  }
}

export function ensureZone(z: string) {
  if (!IANAZone.isValidZone(z)) throw new Error(`Invalid IANA time zone: ${z}`);
  return z;
}

// =============================================
// 1) Time-Zone Scheduling (overlap + recurrence)
// =============================================

type Slot = { iso: string; label: string };

export function proposeOverlaps(
  recruiterZone: string,
  candidateZone: string,
  baseDateISO: string,
  durationMins = 30,
  days = 5,
): Slot[] {
  ensureZone(recruiterZone);
  ensureZone(candidateZone);
  const start = DateTime.fromISO(baseDateISO);
  const results: Slot[] = [];
  for (let d = 0; d < days; d++) {
    const day = start.plus({ days: d });
    const recBiz = Interval.fromDateTimes(day.set({ hour: 9, minute: 0 }), day.set({ hour: 17, minute: 0 }));
    const candBiz = Interval.fromDateTimes(
      day.set({ hour: 9, minute: 0 }).setZone(candidateZone, { keepLocalTime: true }).setZone(recruiterZone),
      day.set({ hour: 17, minute: 0 }).setZone(candidateZone, { keepLocalTime: true }).setZone(recruiterZone),
    );
    const overlap = recBiz.intersection(candBiz);
    if (!overlap) continue;
    let cursor = overlap.start;
    while (cursor <= overlap.end.minus({ minutes: durationMins })) {
      const recLabel = `${cursor.toFormat("ccc LLL d, t")} ${recruiterZone}`;
      const candLabel = `${cursor.setZone(candidateZone).toFormat("t")} ${candidateZone}`;
      results.push({ iso: cursor.toUTC().toISO()!, label: `${recLabel}  •  (${candLabel})` });
      cursor = cursor.plus({ minutes: durationMins });
    }
  }
  return results;
}

const Scheduler: React.FC = () => {
  const [recruiterZone, setRecruiterZone] = useState("America/New_York");
  const [candidateZone, setCandidateZone] = useState("America/Los_Angeles");
  const [baseDate, setBaseDate] = useState(DateTime.now().toISODate()!);
  const slots = useMemo(() => proposeOverlaps(recruiterZone, candidateZone, `${baseDate}T09:00:00`), [recruiterZone, candidateZone, baseDate]);

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 mb-3"><Calendar size={16} /><h3 className="font-semibold">Time-Zone Scheduler</h3></div>
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-600">Recruiter TZ (IANA)</label>
          <input className="w-full border rounded px-2 py-1 text-sm" value={recruiterZone} onChange={(e)=>setRecruiterZone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Candidate TZ (IANA)</label>
          <input className="w-full border rounded px-2 py-1 text-sm" value={candidateZone} onChange={(e)=>setCandidateZone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Start Date</label>
          <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={baseDate} onChange={(e)=>setBaseDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <div className="text-xs text-gray-500">Overlap business hours 09:00–17:00 local</div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 max-h-56 overflow-auto">
        {slots.map((s, i) => (
          <div key={i} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
            <div className="flex items-center gap-2"><Clock size={14} />{s.label}</div>
            <button className="text-blue-600 text-xs hover:underline">Invite</button>
          </div>
        ))}
        {!slots.length && <div className="text-xs text-gray-500">No overlap — loosen hours or change date.</div>}
      </div>
    </div>
  );
};

// =============================================
// 2) Prescreen Question Kit (Claude-assisted)
// =============================================

const PrescreenKit: React.FC = () => {
  const [role, setRole] = useState("Azure Data Architect");
  const [level, setLevel] = useState("Senior");
  const [questions, setQuestions] = useState<string[]>([]);
  const [rubric, setRubric] = useState<string[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  const generate = async () => {
    const res = await runClaude<{ questions: string[]; rubric: string[]; latency: number }>("suggestPrescreen", { role, level });
    setQuestions(res.questions);
    setRubric(res.rubric);
    setLatency(res.latency);
  };

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 mb-3"><Wand2 size={16} /><h3 className="font-semibold">Prescreen Question Kit</h3></div>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-600">Role</label>
          <input className="w-full border rounded px-2 py-1 text-sm" value={role} onChange={(e)=>setRole(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Level</label>
          <input className="w-full border rounded px-2 py-1 text-sm" value={level} onChange={(e)=>setLevel(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <button onClick={generate} className="rounded border px-3 py-2 text-sm">Generate</button>
          {latency!=null && <span className="text-xs text-gray-500">~{Math.round(latency)} ms</span>}
        </div>
      </div>
      <div className="mt-3 grid md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Questions</div>
          <ul className="list-disc pl-5 text-sm space-y-1">{questions.map((q, i)=>(<li key={i}>{q}</li>))}</ul>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Rubric</div>
          <ul className="list-disc pl-5 text-sm space-y-1">{rubric.map((q, i)=>(<li key={i}>{q}</li>))}</ul>
        </div>
      </div>
    </div>
  );
};

// =============================================
// 3) Boolean Builder (with Claude expansions)
// =============================================

const BooleanBuilder: React.FC = () => {
  const [title, setTitle] = useState("Azure Data Architect");
  const [must, setMust] = useState("Azure, Databricks, Synapse, HIPAA");
  const [nice, setNice] = useState("Fabric, PySpark");
  const [blocked, setBlocked] = useState("intern, junior");
  const [geo, setGeo] = useState("Boston, MA | Remote ET");
  const [query, setQuery] = useState("");
  const [expansions, setExpansions] = useState<string[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  const build = async () => {
    const res = await runClaude<{ query: string; expansions: string[]; latency: number }>("booleanAssist", { title, must, nice, blocked, geo });
    setQuery(res.query);
    setExpansions(res.expansions);
    setLatency(res.latency);
  };

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 mb-3"><Network size={16} /><h3 className="font-semibold">Boolean Builder</h3></div>
      <div className="grid md:grid-cols-5 gap-3">
        <input className="border rounded px-2 py-1 text-sm" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="Must have" value={must} onChange={(e)=>setMust(e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="Nice to have" value={nice} onChange={(e)=>setNice(e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="Block" value={blocked} onChange={(e)=>setBlocked(e.target.value)} />
        <input className="border rounded px-2 py-1 text-sm" placeholder="Geo" value={geo} onChange={(e)=>setGeo(e.target.value)} />
      </div>
      <div className="mt-3 flex gap-2 items-center">
        <button onClick={build} className="rounded border px-3 py-2 text-sm">Generate</button>
        <button onClick={()=>query && navigator.clipboard.writeText(query)} className="rounded border px-3 py-2 text-sm">Copy</button>
        {latency!=null && <span className="text-xs text-gray-500">~{Math.round(latency)} ms</span>}
      </div>
      <div className="mt-3 text-xs text-gray-500">Query</div>
      <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto">{query || "—"}</pre>
      {!!expansions.length && (
        <div className="mt-2 text-xs text-gray-500">Expansions</div>
      )}
      <ul className="list-disc pl-5 text-sm">{expansions.map((e,i)=>(<li key={i}>{e}</li>))}</ul>
    </div>
  );
};

// =============================================
// 4) Claude Smart Search Bar (suggestions + tips)
// Click on a suggestion to mark Accepted; Dismiss to mark Rejected (audited)
// =============================================

const SmartSearchBar: React.FC = () => {
  const [q, setQ] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [t0, setT0] = useState<number | null>(null);
  const suggest = async () => {
    setT0(performance.now());
    const res = await runClaude<{ suggestions: string[]; latency: number }>("searchSuggest", { q });
    setTips(res.suggestions);
  };
  const accept = (i: number) => {
    const latency = (t0 ? performance.now() - t0 : 0);
    logAudit({ type: "suggestion.accepted", field: "role", latencyMs: latency });
  };
  const rejectAll = () => {
    const latency = (t0 ? performance.now() - t0 : 0);
    logAudit({ type: "suggestion.rejected", field: "role", latencyMs: latency });
    setTips([]);
  };
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 mb-3"><Search size={16} /><h3 className="font-semibold">Smart Search</h3></div>
      <div className="flex gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search candidates, titles, skills, companies…" className="flex-1 border rounded px-3 py-2 text-sm" />
        <button onClick={suggest} className="rounded border px-3 py-2 text-sm">Suggest</button>
        {tips.length>0 && <button onClick={rejectAll} className="rounded border px-3 py-2 text-sm">Dismiss</button>}
      </div>
      <div className="mt-3 grid gap-2">
        {tips.map((t,i)=>(
          <button key={i} onClick={()=>accept(i)} className="text-left text-sm text-gray-700 border rounded px-2 py-1 hover:bg-gray-50 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600"/> {t}
          </button>
        ))}
      </div>
    </div>
  );
};

// =============================================
// 5) Drill-Down Analytics (interactive Recharts)
// =============================================

const sample = Array.from({ length: 12 }, (_, i) => ({
  month: DateTime.now().minus({ months: 11 - i }).toFormat("LLL"),
  submissions: Math.round(40 + Math.random() * 30),
  interviews: Math.round(15 + Math.random() * 18),
  offers: Math.round(3 + Math.random() * 7),
}));

const DrilldownAnalytics: React.FC = () => {
  const [focus, setFocus] = useState<"submissions" | "interviews" | "offers">("submissions");
  const total = useMemo(()=> sample.reduce((a,b)=> a + (b as any)[focus], 0), [focus]);
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 mb-3"><BarChart3 size={16} /><h3 className="font-semibold">Drill-Down Analytics</h3></div>
      <div className="flex gap-2 mb-2">
        {["submissions","interviews","offers"].map((k)=> (
          <button key={k} onClick={()=>setFocus(k as any)} className={`text-xs rounded border px-2 py-1 ${focus===k?"bg-black text-white":""}`}>{k}</button>
        ))}
        <div className="ml-auto text-xs text-gray-600">Total: {total}</div>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={sample}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={focus as any} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// =============================================
// 6) Timeline + Micro-animations (Framer Motion)
// =============================================

const Timeline: React.FC = () => {
  const items = [
    { t: "09:10", label: "Resume parsed", tone: "ok" },
    { t: "09:12", label: "Claude prescreen generated", tone: "ok" },
    { t: "10:05", label: "Recruiter review flagged risk", tone: "warn" },
    { t: "11:00", label: "Invite sent: 14:30 ET / 11:30 PT", tone: "ok" },
  ] as const;
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 mb-3"><History size={16} /><h3 className="font-semibold">Pipeline Timeline</h3></div>
      <div className="relative pl-4">
        <div className="absolute left-1 top-0 bottom-0 w-px bg-gray-200" />
        {items.map((it, i) => (
          <motion.div
            key={`${it.t}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="mb-3 flex items-start gap-3"
          >
            <div className={`mt-1 h-2 w-2 rounded-full ${it.tone === "ok" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <div>
              <div className="text-xs text-gray-500">{it.t}</div>
              <div className="text-sm">{it.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// =============================================
// 7) Admin Settings & Audit Dashboard
// =============================================

const AdminPanel: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [encrypted, setEncrypted] = useState<string>("");
  const [pii, setPii] = useState("555-123-9876");

  const updateThreshold = (k: FieldKey, v: number) => setSettings(s => ({...s, thresholds: {...s.thresholds, [k]: v}}));
  const updateOptIn = (k: FieldKey, v: boolean) => setSettings(s => ({...s, optIn: {...s.optIn, [k]: v}}));

  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 mb-3"><Settings2 size={16} /><h3 className="font-semibold">Admin — AI Settings</h3></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {(["name","email","department","role","phone"] as FieldKey[]).map(k=> (
            <div key={k} className="border rounded p-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{k} threshold</span>
                <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!settings.optIn[k]} onChange={e=>updateOptIn(k, e.target.checked)} /> Opt-in</label>
              </div>
              <input type="range" min={0} max={1} step={0.01} value={settings.thresholds[k] ?? 0.5} onChange={(e)=>updateThreshold(k, Number(e.target.value))} className="w-full" />
              <div className="text-xs text-gray-500">{Math.round((settings.thresholds[k] ?? 0.5)*100)}%</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2"><Shield className="h-4 w-4"/>Compliance Tools</div>
          <div className="text-xs text-gray-600">PII Mask Demo</div>
          <input value={pii} onChange={e=>setPii(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
          <div className="text-xs">Masked: <span className="font-mono">{maskPII(pii)}</span></div>
          <div className="text-xs mt-2">Encryption (demo; paste base64 key to enable)</div>
          <input placeholder="base64 key" className="border rounded px-2 py-1 text-sm w-full" onChange={async e=> setEncrypted(await encryptText("secret", e.target.value))} />
          <div className="text-xs">Encrypted sample: <span className="break-all font-mono">{encrypted || '(disabled)'}</span></div>
        </div>
      </div>
    </div>
  );
};

const AuditDashboard: React.FC = () => {
  const rows = readAudit();
  const accepted = rows.filter(r=>r.type==='suggestion.accepted').length;
  const rejected = rows.filter(r=>r.type==='suggestion.rejected').length;
  const avgLatency = rows.length ? Math.round(rows.reduce((a,b)=> a + b.latencyMs, 0)/rows.length) : 0;
  const data = [
    { name: 'Accepted', val: accepted},
    { name: 'Rejected', val: rejected}
  ];
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center gap-2 mb-3"><Activity size={16} /><h3 className="font-semibold">Audit & Analytics</h3></div>
      <div className="text-xs text-gray-600 mb-2">Events: {rows.length} • Avg latency: {avgLatency} ms</div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="val" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-xs text-gray-500">Click suggestions in Smart Search to generate audit events.</div>
    </div>
  );
};

// =============================================
// 8) LAWRENCE AI Scoring (executive snapshot)
// =============================================

const LawrenceScoring: React.FC = () => {
  type LScore = { overall: number; technical: number; cultural: number; experience: number; availability: number };
  type ECand = {
    id: string; firstName: string; lastName: string; currentTitle: string; currentCompany: string;
    lawrenceScore: LScore; priority: 'immediate'|'high'|'medium'|'low'; aiInsight: string;
  };
  const candidates: ECand[] = [
    { id: '1', firstName: 'Sarah', lastName: 'Johnson', currentTitle: 'Senior Full-Stack Dev', currentCompany: 'TechCorp',
      lawrenceScore: { overall: 92, technical: 95, cultural: 88, experience: 90, availability: 85 }, priority: 'immediate',
      aiInsight: 'High confidence match; deep React/Node and strong collaboration signals.' },
    { id: '2', firstName: 'Michael', lastName: 'Chen', currentTitle: 'DevOps Engineer', currentCompany: 'CloudScale',
      lawrenceScore: { overall: 78, technical: 85, cultural: 75, experience: 70, availability: 90 }, priority: 'high',
      aiInsight: 'Solid DevOps core; validate infra depth in a focused technical round.' },
    { id: '3', firstName: 'David', lastName: 'Kim', currentTitle: 'CTO', currentCompany: 'StartupCo',
      lawrenceScore: { overall: 94, technical: 91, cultural: 98, experience: 95, availability: 89 }, priority: 'immediate',
      aiInsight: 'Executive-level impact; exceptional culture alignment and strategy chops.' },
  ];
  const top = [...candidates].sort((a,b)=> b.lawrenceScore.overall - a.lawrenceScore.overall).slice(0,3);
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Award size={16}/><h3 className="font-semibold">LAWRENCE AI Scoring — Executive Snapshot</h3></div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-600"><Users className="h-4 w-4"/> {candidates.length} candidates</div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {top.map(c => (
          <div key={c.id} className="rounded-xl border p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">{c.firstName} {c.lastName}</div>
                <div className="text-xs text-gray-600">{c.currentTitle} · {c.currentCompany}</div>
              </div>
              <div className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">{c.lawrenceScore.overall}%</div>
            </div>
            <div className="mt-2 text-xs text-gray-700">{c.aiInsight}</div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={()=>alert(`Scheduling interview with ${c.firstName}…`)} className="px-2 py-1 rounded border text-xs">Schedule</button>
              <button onClick={()=>alert(`Presentation generated for ${c.firstName}.`)} className="px-2 py-1 rounded border text-xs inline-flex items-center gap-1"><Download className="h-3 w-3"/>Present</button>
              <button onClick={()=>alert(`Sent to client: ${c.firstName}.`)} className="px-2 py-1 rounded border text-xs inline-flex items-center gap-1"><Send className="h-3 w-3"/>Send</button>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Offer probability: —</div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500">Scores reflect multi-factor blend (technical, culture, experience, availability).</div>
    </div>
  );
};

// =============================================
// 9) Page wrapper combining all modules
// =============================================

const ClaudeRecruiterProAddOns: React.FC = () => {
  const [insight, setInsight] = useState<{ title: string; stat: string; note: string } | null>(null);
  const fetchInsight = async () => {
    const res = await runClaude<{ card: { title: string; stat: string; note: string } }>("marketInsight", {});
    setInsight(res.card);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Brain /><h1 className="text-xl font-bold">Claude Recruiter Pro — Advanced Toolkit</h1></div>
          <button onClick={fetchInsight} className="rounded border px-3 py-2 text-sm">Refresh Insight</button>
        </header>

        {insight && (
          <div className="rounded-2xl border p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-4">
            <div className="text-sm opacity-90">Market Insight</div>
            <div className="text-lg font-semibold">{insight.title}</div>
            <div className="text-sm">{insight.stat} — {insight.note}</div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Scheduler />
          <PrescreenKit />
          <BooleanBuilder />
          <SmartSearchBar />
          <DrilldownAnalytics />
          <Timeline />
          <LawrenceScoring />
          <AdminPanel />
          <AuditDashboard />
        </div>
      </div>
    </div>
  );
};

export default ClaudeRecruiterProAddOns;

// =============================================
// 9) DEV TESTS — run-time sanity checks (non-fatal)
// =============================================

function runDevTests() {
  // ensures valid zone passes
  try { console.assert(ensureZone("America/New_York") === "America/New_York"); } catch (e) { console.error("ensureZone valid test failed", e); }
  // ensures invalid zone throws
  try { let threw = false; try { ensureZone("Mars/Phobos"); } catch { threw = true; } console.assert(threw); } catch (e) { console.error("ensureZone invalid test failed", e); }
  // overlap generator returns array
  try { const base = DateTime.now().toISODate()!; const slots = proposeOverlaps("America/New_York", "America/Los_Angeles", `${base}T09:00:00`); console.assert(Array.isArray(slots)); } catch (e) { console.error("proposeOverlaps test failed", e); }
  // masking hides digit runs
  try { const masked = maskPII("SSN 111-22-3333"); console.assert(/•/.test(masked)); } catch (e) { console.error("maskPII test failed", e); }

  // --- Added tests (keep existing ones untouched) ---
  // DateTime import sanity
  try { console.assert(DateTime.isDateTime(DateTime.now()), "DateTime should be available and produce DateTime instances"); } catch (e) { console.error("DateTime import test failed", e); }
  // IANAZone sanity
  try { console.assert(IANAZone.isValidZone("UTC") && !IANAZone.isValidZone("Not/AZone"), "IANAZone validity check failed"); } catch (e) { console.error("IANAZone test failed", e); }
  // sample dataset shape
  try {
    console.assert(Array.isArray(sample) && sample.length === 12, "sample should have 12 months");
    console.assert(typeof sample[0].month === "string", "sample month label should be string");
  } catch (e) { console.error("sample dataset test failed", e); }
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  setTimeout(runDevTests, 0);
}

/*
KPI dashboard backlog (to wire into analytics view):
- Completion funnel: Started → Submit Clicked → Completed (by device).
- Error heatmap: errors per field before/after AI.
- Latency: median ai.suggest latency (p50/p95).
- Adoption: % sessions using ai.autofill.used or ai.suggest.accepted.
- Tickets: data-correction per 1k submissions (7/14/30-day windows).
- CSAT: average + %4–5, split by mobile.
*/
