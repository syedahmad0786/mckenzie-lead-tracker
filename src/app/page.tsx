"use client";
import { useEffect, useMemo, useState } from "react";

// =====================================================================
// Lead Tracker — McKenzie SewOn × Modern Amenities
// Design ported from artifact (design-from-artifact/) on 2026-05-08.
// =====================================================================

type StatusUI = "green" | "amber" | "red";
type StatusAPI = "order_placed" | "not_yet_closed" | "lost";

const STATUS_LABELS: Record<StatusUI, string> = {
  green: "Order placed",
  amber: "Not yet closed",
  red: "Lost",
};

const API_TO_UI: Record<StatusAPI, StatusUI> = {
  order_placed: "green",
  not_yet_closed: "amber",
  lost: "red",
};
const UI_TO_API: Record<StatusUI, StatusAPI> = {
  green: "order_placed",
  amber: "not_yet_closed",
  red: "lost",
};

interface Campaign { id: string; name: string; dot: string }
const CAMPAIGNS: Campaign[] = [
  { id: "tourist-gift-shop",   name: "Tourist Gift Shop",   dot: "#0EA5E9" },
  { id: "museum-donors",       name: "Museum Donors",       dot: "#A855F7" },
  { id: "acquisitions",        name: "Acquisitions",        dot: "#F97316" },
  { id: "construction",        name: "Construction",        dot: "#EAB308" },
  { id: "banks-credit-unions", name: "Banks & Credit Unions", dot: "#10B981" },
  { id: "schools",             name: "Schools",             dot: "#EF4444" },
];
const CAMPAIGN_BY_ID = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c]));

interface ApiLead {
  id: string;
  contactName: string;
  email: string;
  campaignId: string | null;
  campaignName: string;
  dateIntroduced: string;
  status: StatusAPI;
  dateFirstOrder: string | null;
  firstOrderAmount: number | null;
  notes: string | null;
  payoutAmount: number;
  payoutVisible: boolean;
}
interface ApiResponse {
  clientId: string;
  clientName: string;
  logoUrl: string | null;
  accentColor: string;
  totalLeads: number;
  leads: ApiLead[];
  kpis: { leadsSent: number; ordersClosed: number; revenueGenerated: number; payoutOwed: number };
  deltas?: { leadsSent: number; ordersClosed: number; revenueGenerated: number; payoutOwed: number };
  sparks?: { leadsSent: number[]; ordersClosed: number[]; revenueGenerated: number[]; payoutOwed: number[] };
  payoutVisible: boolean;
  role?: "agency_admin" | "client_member" | "aoc_admin";
}

interface UiLead {
  id: string; name: string; email: string;
  campaign: string; intro: string; status: StatusUI;
  orderDate: string | null; amount: number | null; notes: string | null;
}

function fromApi(l: ApiLead): UiLead {
  return {
    id: l.id, name: l.contactName, email: l.email,
    campaign: l.campaignId || "construction",
    intro: l.dateIntroduced,
    status: API_TO_UI[l.status],
    orderDate: l.dateFirstOrder, amount: l.firstOrderAmount, notes: l.notes,
  };
}

const fmtCurrency = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtCurrencyFull = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
const fmtDate = (s: string | null | undefined) =>
  !s ? "—" : new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtDateShort = (s: string | null | undefined) =>
  !s ? "—" : new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const Icons = {
  ArrowUp:   ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>,
  ArrowDown: ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>,
  ChevronDown: ({ size = 14, className }: { size?: number; className?: string }) => <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  Search:    ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>,
  Download:  ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><path d="M12 15V3" /></svg>,
  FileText:  ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  X:         ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  RefreshCw: ({ size = 14, className }: { size?: number; className?: string }) => <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
};

function Sparkline({ data, color = "currentColor", width = 96, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data?.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 4) - 2] as [number, number]);
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L${width} ${height} L0 ${height} Z`;
  const [lx, ly] = points[points.length - 1];
  return (
    <svg className="kpi__spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={area} fill={color} fillOpacity="0.10" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  );
}

function KpiTile({ label, value, delta, deltaLabel, spark, accent, placeholder, sub }: { label: string; value?: string; delta?: number | null; deltaLabel?: string; spark?: number[]; accent?: boolean; placeholder?: boolean; sub?: string }) {
  if (placeholder) {
    return (
      <div className="kpi kpi--placeholder">
        <div className="kpi__label">{label}</div>
        <div className="kpi__value">Coming soon</div>
        <div className="kpi__sub">{sub || "Available in v2 — payout calculation will land here."}</div>
      </div>
    );
  }
  const deltaCls = delta == null ? "kpi__delta--flat" : delta > 0 ? "kpi__delta--up" : delta < 0 ? "kpi__delta--down" : "kpi__delta--flat";
  return (
    <div className={accent ? "kpi kpi--accent" : "kpi"}>
      <div className="kpi__label">{label}</div>
      <div className="kpi__value-row">
        <div className="kpi__value">{value}</div>
        {delta != null && (
          <div className={`kpi__delta ${deltaCls}`}>
            {delta > 0 ? <Icons.ArrowUp size={12} /> : delta < 0 ? <Icons.ArrowDown size={12} /> : null}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div className="kpi__foot">
        <div className="kpi__period">{deltaLabel || "vs prev 30d"}</div>
        {spark && <Sparkline data={spark} color="var(--accent)" />}
      </div>
    </div>
  );
}

function StatusPill({ status, onClick, inline }: { status: StatusUI; onClick?: (e: React.MouseEvent) => void; inline?: boolean }) {
  const cls = `status status--${status} ${inline ? "status--inline" : ""}`;
  return (
    <span className={cls} onClick={onClick} role={onClick ? "button" : undefined}>
      {STATUS_LABELS[status]}
      {inline && <Icons.ChevronDown size={10} className="caret" />}
    </span>
  );
}

function CampaignChip({ campaign, active, onClick }: { campaign: Campaign | undefined; active?: boolean; onClick?: () => void }) {
  if (!campaign) return null;
  return (
    <button type="button" className={`chip chip--campaign ${active ? "is-active" : ""}`} onClick={onClick}>
      <span className="chip__dot" style={{ background: campaign.dot }} />
      {campaign.name}
    </button>
  );
}

function Drawer({ lead, onClose, onSave, audit }: { lead: UiLead | null; onClose: () => void; onSave: (id: string, patch: Partial<UiLead>) => Promise<void>; audit: Array<{ field_changed: string; old_value: string | null; new_value: string | null; user_email: string | null; changed_at: string }> }) {
  const [draft, setDraft] = useState<UiLead | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(lead); }, [lead]);
  useEffect(() => {
    if (!lead) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [lead, onClose]);

  if (!lead || !draft) return <><div className="drawer-scrim" /><aside className="drawer" /></>;
  const camp = CAMPAIGN_BY_ID[draft.campaign];

  const setField = <K extends keyof UiLead>(field: K, value: UiLead[K]) => setDraft({ ...draft, [field]: value });
  const save = async () => {
    setSaving(true);
    const patch: Partial<UiLead> = {};
    if (draft.status !== lead.status)       patch.status = draft.status;
    if (draft.orderDate !== lead.orderDate) patch.orderDate = draft.orderDate;
    if (draft.amount !== lead.amount)       patch.amount = draft.amount;
    if (draft.notes !== lead.notes)         patch.notes = draft.notes;
    if (draft.campaign !== lead.campaign)   patch.campaign = draft.campaign;
    if (Object.keys(patch).length) await onSave(lead.id, patch);
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div className="drawer-scrim is-open" onClick={onClose} />
      <aside className="drawer is-open" aria-label="Lead detail">
        <div className="drawer__head">
          <div className="drawer__head-row">
            <div>
              <h2 className="drawer__name">{draft.name || draft.email}</h2>
              <div className="drawer__email">{draft.email}</div>
            </div>
            <button className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Close"><Icons.X size={16} /></button>
          </div>
          <div className="drawer__head-meta">
            {camp && <CampaignChip campaign={camp} />}
            <StatusPill status={draft.status} />
            <span style={{ fontSize: 12, color: "var(--app-ink-3)", marginLeft: "auto" }}>Introduced {fmtDate(draft.intro)}</span>
          </div>
        </div>

        <div className="drawer__body">
          <section>
            <h3 className="drawer__section-h">Order details</h3>
            <div className="drawer__field-grid">
              <div className="field">
                <label>Status</label>
                <select value={draft.status} onChange={(e) => setField("status", e.target.value as StatusUI)}>
                  <option value="amber">Not yet closed</option>
                  <option value="green">Order placed</option>
                  <option value="red">Lost</option>
                </select>
              </div>
              <div className="field">
                <label>Campaign</label>
                <select value={draft.campaign} onChange={(e) => setField("campaign", e.target.value)}>
                  {CAMPAIGNS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>First order date</label>
                <input type="date" value={draft.orderDate || ""} disabled={draft.status !== "green"} onChange={(e) => setField("orderDate", e.target.value || null)} />
              </div>
              <div className="field">
                <label>First order amount</label>
                <input type="number" placeholder="0" value={draft.amount ?? ""} disabled={draft.status !== "green"} onChange={(e) => setField("amount", e.target.value === "" ? null : parseFloat(e.target.value))} />
              </div>
              <div className="field field--full">
                <label>Notes</label>
                <textarea value={draft.notes || ""} placeholder="Internal notes — visible to McKenzie + Modern Amenities." onChange={(e) => setField("notes", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="drawer__section-h">Audit trail</h3>
            <div className="audit">
              {audit.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--app-ink-3)", padding: "8px 0" }}>No edits recorded yet.</div>
              ) : audit.map((a, i) => (
                <div className="audit-row" key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12, fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--app-line)" }}>
                  <span style={{ fontWeight: 500 }}>{a.user_email ?? "system"}</span>
                  <span style={{ color: "var(--app-ink-3)" }}>{a.field_changed}: {a.old_value ?? "—"} → {a.new_value ?? "—"}</span>
                  <time style={{ color: "var(--app-ink-3)", fontSize: 12 }}>{new Date(a.changed_at).toLocaleString()}</time>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="drawer__section-h">Timeline</h3>
            <div className="timeline">
              <div className="tl-item tl-item--accent"><div className="tl-title">Introduced to McKenzie</div><div className="tl-meta">{fmtDate(draft.intro)} · via {camp?.name || "Direct"}</div></div>
              {draft.status === "amber" && <div className="tl-item tl-item--amber"><div className="tl-title">Working — not yet closed</div><div className="tl-meta">McKenzie is in active conversation</div></div>}
              {draft.status === "green" && (
                <>
                  <div className="tl-item tl-item--amber"><div className="tl-title">Status: working</div><div className="tl-meta">{fmtDate(draft.intro)} → {fmtDate(draft.orderDate)}</div></div>
                  <div className="tl-item tl-item--green">
                    <div className="tl-title">Order placed — {fmtCurrencyFull(draft.amount)}</div>
                    <div className="tl-meta">{fmtDate(draft.orderDate)}</div>
                    {draft.notes && <div className="tl-detail">{draft.notes}</div>}
                  </div>
                </>
              )}
              {draft.status === "red" && <div className="tl-item tl-item--red"><div className="tl-title">Marked lost</div><div className="tl-meta">{draft.notes || "No reason recorded"}</div></div>}
            </div>
          </section>

          <section>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn--primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

function TopBar({ client }: { client: { name: string; logoUrl: string | null; displayName: string; initials: string } }) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__brand-mark" style={client.logoUrl ? { background: "transparent" } : undefined}>
          {client.logoUrl ? <img src={client.logoUrl} alt={client.name} /> : client.name.split(/\\s+/).slice(0,2).map((w) => w[0]).join("").toUpperCase()}
        </div>
        <span>{client.name}</span>
      </div>
      <span className="topbar__divider" />
      <div className="topbar__crumb">Lead Tracker · <b>Agency view</b></div>
      <nav className="topbar__nav">
        <a className="is-active">Dashboard</a>
        <a>Settings</a>
      </nav>
      <div className="topbar__spacer" />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--app-ink-3)", fontWeight: 500, letterSpacing: "0.02em" }}>
        <img src="/ma-logo.png" alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover" }} />
        BY MODERN AMENITIES
      </span>
      <form action="/api/auth/signout" method="post" style={{ margin: 0 }}>
        <button type="submit" className="topbar__user" title="Sign out" style={{ background: "none" }}>
          <div className="avatar">{client.initials}</div>
          <span>{client.displayName}</span>
          <Icons.ChevronDown size={14} />
        </button>
      </form>
    </header>
  );
}

export default function Page() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [openLead, setOpenLead] = useState<UiLead | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  async function resync() {
    setSyncing(true);
    setSyncMsg("Pulling from Sheets…");
    try {
      const res = await fetch("/api/sync/sheets", { method: "POST", credentials: "include" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "sync failed");
      setSyncMsg(`✓ Parsed ${j.parsed}, inserted ${j.inserted} new (${j.durationMs}ms)`);
      await load();
    } catch (e) {
      setSyncMsg("✗ " + (e instanceof Error ? e.message : "sync failed"));
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 6000);
    }
  }
  const [activeCampaigns, setActiveCampaigns] = useState<string[]>([]);
  const [activeStatuses, setActiveStatuses] = useState<StatusUI[]>([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  async function load() {
    const params = new URLSearchParams();
    activeCampaigns.forEach((c) => params.append("campaign", c));
    activeStatuses.forEach((s) => params.append("status", UI_TO_API[s]));
    if (search) params.set("q", search);
    const { from, to } = presetToDates(dateRange);
    if (from) params.set("from", from);
    if (to)   params.set("to", to);
    const res = await fetch(`/api/leads/pipeline?${params}`);
    setData(await res.json());
  }
  useEffect(() => {
    load();
    // Real-time: subscribe to any change on `leads` and refresh on push.
    // Falls back to a 60s safety poll in case the websocket drops.
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const { supabaseBrowser } = await import("@/lib/supabase/client");
        const sb = supabaseBrowser();
        const ch = sb
          .channel("leads-rt")
          .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
          .subscribe();
        unsub = () => { sb.removeChannel(ch); };
      } catch { /* websocket may be blocked — safety poll covers us */ }
    })();
    const safety = setInterval(load, 60_000);
    return () => { clearInterval(safety); if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampaigns.join(","), activeStatuses.join(","), search, dateRange]);

  const leads: UiLead[] = useMemo(() => (data?.leads ?? []).map(fromApi), [data]);
  const close = leads.filter((l) => l.status === "green").length;
  const closeRate = leads.length ? Math.round((close / leads.length) * 100) : 0;

  // Logged-in user (for topbar)
  const [me, setMe] = useState<{ displayName: string; initials: string; email: string; role: string } | null>(null);
  useEffect(() => { fetch("/api/me").then((r) => r.ok ? r.json().then((j) => setMe(j.user)) : null); }, []);
  // Audit entries for the open lead
  const [audit, setAudit] = useState<Array<{ field_changed: string; old_value: string | null; new_value: string | null; user_email: string | null; changed_at: string }>>([]);
  useEffect(() => {
    if (!openLead) { setAudit([]); return; }
    fetch(`/api/leads/${openLead.id}/audit`).then((r) => r.ok ? r.json().then((j) => setAudit(j.entries || [])) : setAudit([]));
  }, [openLead]);

  const accent = data?.accentColor || "#00a7e0";
  const accentVars = useMemo(() => deriveTints(accent), [accent]);

  async function saveLead(id: string, patch: Partial<UiLead>) {
    const apiPatch: Record<string, unknown> = { airtableId: id };
    if (patch.status)                  apiPatch.status = UI_TO_API[patch.status];
    if (patch.orderDate !== undefined) apiPatch.dateFirstOrder = patch.orderDate;
    if (patch.amount !== undefined)    apiPatch.firstOrderAmount = patch.amount;
    if (patch.notes !== undefined)     apiPatch.notes = patch.notes;
    const res = await fetch("/api/leads/update", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(apiPatch),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Save failed");
      return;
    }
    await load();
  }

  function exportCsv() {
    if (!data) return;
    const headers = ["Contact", "Email", "Campaign", "Date Introduced", "Status", "Date First Order", "First Order Amount", "Notes"];
    const rows = leads.map((l) => [l.name, l.email, CAMPAIGN_BY_ID[l.campaign]?.name || l.campaign, l.intro, STATUS_LABELS[l.status], l.orderDate ?? "", l.amount ?? "", l.notes ?? ""]);
    const csv = [headers, ...rows].map((r) => r.map((c) => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c)).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `mckenzie-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="app theme-mckenzie" style={accentVars as React.CSSProperties}>
      <TopBar client={{ name: data?.clientName || "McKenzie SewOn", logoUrl: data?.logoUrl || null, displayName: me?.displayName || "User", initials: me?.initials || "U" }} />

      <div className="page">
        <div className="scoreboard">
          <div className="page-head" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <h1 className="page-head__title" style={{ fontSize: 22, fontWeight: 600, color: "var(--app-ink-1)", letterSpacing: "-0.01em" }}>Lead pipeline</h1>
              <div className="page-head__sub" style={{ fontSize: 13, color: "var(--app-ink-3)", marginTop: 4 }}>
                {data
                  ? `${leads.length} of ${data.totalLeads} leads · ${closeRate}% close rate · ${dateRange === "7d" ? "last 7 days" : dateRange === "30d" ? "last 30 days" : dateRange === "90d" ? "last 90 days" : "all time"}`
                  : "loading…"}
              </div>
            </div>
            <div className="page-head__actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {syncMsg && <span style={{ fontSize: 12, color: syncMsg.startsWith("✓") ? "var(--st-green)" : syncMsg.startsWith("✗") ? "var(--st-red)" : "var(--app-ink-3)" }}>{syncMsg}</span>}
              <button className="btn btn--sm" onClick={resync} disabled={syncing} title="Re-pull from Google Sheets now">
                <Icons.RefreshCw size={14} className={syncing ? "spin" : ""} /> {syncing ? "Syncing…" : "Re-sync"}
              </button>
              <button className="btn btn--sm" onClick={exportCsv}><Icons.Download size={14} /> Export CSV</button>
              <button className="btn btn--sm"><Icons.FileText size={14} /> PDF report</button>
            </div>
          </div>

          <div className="kpi-grid">
            <KpiTile label="Leads sent"        value={String(data?.kpis.leadsSent ?? 0)}    delta={data?.deltas?.leadsSent ?? null} spark={data?.sparks?.leadsSent} accent />
            <KpiTile label="Orders closed"     value={String(data?.kpis.ordersClosed ?? 0)} delta={data?.deltas?.ordersClosed ?? null} spark={data?.sparks?.ordersClosed} deltaLabel={`${closeRate}% of leads · vs prev 30d`} />
            <KpiTile label="Revenue generated" value={fmtCurrency(data?.kpis.revenueGenerated ?? 0)} delta={data?.deltas?.revenueGenerated ?? null} spark={data?.sparks?.revenueGenerated} />
            {data?.payoutVisible
              ? <KpiTile label="Payout owed" value={fmtCurrency(data.kpis.payoutOwed)} delta={data?.deltas?.payoutOwed ?? null} spark={data?.sparks?.payoutOwed} deltaLabel="15% first-order rate" />
              : <KpiTile placeholder label="Payout owed" sub="Hidden for v1 — calculation runs in the background." />}
          </div>
        </div>

        <div className="filterbar">
          <div className="filterbar__group">
            <span style={{ fontSize: 12, color: "var(--app-ink-3)", fontWeight: 500, paddingRight: 4 }}>Campaign</span>
            {CAMPAIGNS.map((c) => (
              <button key={c.id} type="button"
                className={`chip chip--campaign ${activeCampaigns.includes(c.id) ? "is-active" : ""}`}
                onClick={() => setActiveCampaigns((s) => s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id])}>
                <span className="chip__dot" style={{ background: c.dot }} />
                {c.name}
              </button>
            ))}
          </div>

          <span className="filterbar__sep" />

          <div className="filterbar__group">
            <span style={{ fontSize: 12, color: "var(--app-ink-3)", fontWeight: 500, paddingRight: 4 }}>Range</span>
            <div className="seg">
              {(["7d", "30d", "90d", "all"] as const).map((r) => (
                <button key={r} className={dateRange === r ? "is-active" : ""} onClick={() => setDateRange(r)}>{r === "all" ? "All time" : r}</button>
              ))}
            </div>
          </div>

          <span className="filterbar__sep" />

          <div className="filterbar__group">
            {(["green", "amber", "red"] as const).map((s) => (
              <button key={s} type="button"
                className={`chip ${activeStatuses.includes(s) ? "is-active" : ""}`}
                onClick={() => setActiveStatuses((arr) => arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s])}>
                <StatusPill status={s} />
              </button>
            ))}
          </div>

          <span className="filterbar__sep" />

          <div className="filterbar__search">
            <Icons.Search size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, company…" />
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Email</th>
                <th>Campaign</th>
                <th>Date introduced</th>
                <th>Status</th>
                <th>Order date</th>
                <th style={{ textAlign: "right" }}>Order amount</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 0 }}>
                  <div className="empty" style={{ padding: 48, textAlign: "center" }}>
                    <div className="empty__title">No leads match these filters</div>
                    <div className="empty__copy">Clear filters to see all leads.</div>
                  </div>
                </td></tr>
              )}
              {leads.map((l) => {
                const camp = CAMPAIGN_BY_ID[l.campaign];
                return (
                  <tr key={l.id} onClick={() => setOpenLead(l)}>
                    <td style={{ fontWeight: 500, color: "var(--app-ink-1)" }}>{l.name || "—"}</td>
                    <td style={{ color: "var(--app-ink-3)" }}>{l.email}</td>
                    <td>{camp ? <CampaignChip campaign={camp} /> : <span style={{ color: "var(--app-ink-4)" }}>{l.campaign}</span>}</td>
                    <td style={{ color: "var(--app-ink-3)" }}>{fmtDateShort(l.intro)}</td>
                    <td><StatusPill status={l.status} /></td>
                    <td style={{ color: "var(--app-ink-3)" }}>{l.orderDate ? fmtDateShort(l.orderDate) : <span style={{ color: "var(--app-ink-4)" }}>—</span>}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {l.amount != null ? fmtCurrency(l.amount) : <span style={{ color: "var(--app-ink-4)" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer lead={openLead} onClose={() => setOpenLead(null)} onSave={saveLead} audit={audit} />
    </div>
  );
}

function deriveTints(hex: string): Record<string, string> {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const tint = (a: number) => `rgba(${r},${g},${b},${a})`;
  const deep = `rgb(${Math.round(r * 0.65)},${Math.round(g * 0.65)},${Math.round(b * 0.65)})`;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return {
    "--accent": hex,
    "--accent-deep": deep,
    "--accent-tint": tint(0.10),
    "--accent-tint-2": tint(0.22),
    "--accent-ink": lum > 0.6 ? "#18181B" : "#FFFFFF",
  };
}

function presetToDates(p: "7d" | "30d" | "90d" | "all"): { from?: string; to?: string } {
  if (p === "all") return {};
  const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
