"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

const SECTIONS = [
  { group: "Workspace", items: [
    { id: "client-profile", label: "Client profile" },
    { id: "theme",          label: "Theme & accent" },
    { id: "campaigns",      label: "Campaigns" },
    { id: "payout",         label: "Payout" },
  ]},
  { group: "Access", items: [
    { id: "users",          label: "Users & roles" },
    { id: "integrations",   label: "Integrations" },
  ]},
];

export default function SettingsPage() {
  const [active, setActive] = useState("client-profile");
  const [client, setClient] = useState<{ name: string; logo: string | null; accent: string; payoutPctFirst: number; payoutVisible: boolean }>({
    name: "McKenzie SewOn",
    logo: null,
    accent: "#00a7e0",
    payoutPctFirst: 0.15,
    payoutVisible: false,
  });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data } = await sb.from("clients").select("*").eq("id", "mckenzie").maybeSingle();
      if (data) setClient({
        name: data.name,
        logo: data.logo_url,
        accent: data.accent_color,
        payoutPctFirst: Number(data.payout_pct_first || 0.15),
        payoutVisible: !!data.payout_visible,
      });
    })();
  }, []);

  function set<K extends keyof typeof client>(k: K, v: (typeof client)[K]) {
    setClient((c) => ({ ...c, [k]: v }));
    setDirty(true);
  }

  async function save() {
    const sb = supabaseBrowser();
    await sb.from("clients").update({
      name: client.name,
      logo_url: client.logo,
      accent_color: client.accent,
      payout_pct_first: client.payoutPctFirst,
      payout_visible: client.payoutVisible,
    }).eq("id", "mckenzie");
    setDirty(false);
  }

  return (
    <div className="app theme-mckenzie" style={{ "--accent": client.accent } as React.CSSProperties}>
      <header className="topbar">
        <div className="topbar__brand">
          <div className="topbar__brand-mark">MS</div>
          <span>McKenzie SewOn</span>
        </div>
        <span className="topbar__divider" />
        <div className="topbar__crumb">Lead Tracker · <b>Agency view</b></div>
        <nav className="topbar__nav">
          <Link href="/">Dashboard</Link>
          <Link href="/settings" className="is-active">Settings</Link>
        </nav>
        <div className="topbar__spacer" />
        <span style={{ fontSize: 11, color: "var(--app-ink-3)", fontWeight: 500, letterSpacing: "0.02em" }}>BY MODERN AMENITIES</span>
      </header>

      <div className="page settings-page">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--app-ink-1)", letterSpacing: "-0.01em" }}>Settings</h1>
            <p style={{ fontSize: 14, color: "var(--app-ink-3)", marginTop: 4 }}>Configure how Lead Tracker looks and works for {client.name}.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => location.reload()} disabled={!dirty}>Discard</button>
            <button className="btn btn--primary" onClick={save} disabled={!dirty}>Save changes</button>
          </div>
        </div>

        <div className="settings-grid">
          <aside className="settings-nav">
            {SECTIONS.map((s) => (
              <div key={s.group}>
                <div className="settings-nav__group">{s.group.toUpperCase()}</div>
                {s.items.map((it) => (
                  <button key={it.id} className={`settings-nav__item ${active === it.id ? "is-active" : ""}`} onClick={() => setActive(it.id)}>
                    {it.label}
                  </button>
                ))}
              </div>
            ))}
          </aside>

          <div className="settings-panel">
            {active === "client-profile" && (
              <div>
                <h2 className="settings-panel__h">Client profile</h2>
                <p className="settings-panel__sub">Shown in the top bar and on the login screen.</p>
                <div className="settings-panel__field">
                  <label>Logo<small>Square, 1:1, ≥ 256px. PNG with transparent bg recommended.</small></label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="settings-panel__logo">{client.logo ? <img src={client.logo} alt="" /> : "🏢"}</div>
                    <button className="btn">Upload</button>
                    <button className="btn btn--ghost" onClick={() => set("logo", null)}>Remove</button>
                  </div>
                </div>
                <div className="settings-panel__field">
                  <label>Client name<small>Displayed throughout the app.</small></label>
                  <input className="input" value={client.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div className="settings-panel__field">
                  <label>Slug<small>{`leadtracker.modernamenities.com/${client.name.toLowerCase().replace(/\s+/g, "-")}`}</small></label>
                  <input className="input" value={client.name.toLowerCase().replace(/\s+/g, "-")} readOnly />
                </div>
                <div className="settings-panel__field">
                  <label>Tenant ID<small>Used by Make.com webhook routing.</small></label>
                  <code className="settings-panel__code">aoc_mckenzie-sewon_2026</code>
                </div>
              </div>
            )}

            {active === "theme" && (
              <div>
                <h2 className="settings-panel__h">Theme & accent</h2>
                <p className="settings-panel__sub">McKenzie&apos;s site blue is <code>#00a7e0</code>. Adjust here per tenant.</p>
                <div className="settings-panel__field">
                  <label>Accent color</label>
                  <input type="color" className="input" value={client.accent} onChange={(e) => set("accent", e.target.value)} style={{ width: 80, height: 36, padding: 2 }} />
                </div>
              </div>
            )}

            {active === "payout" && (
              <div>
                <h2 className="settings-panel__h">Payout</h2>
                <p className="settings-panel__sub">First-order commission rate. Hidden from the McKenzie view in v1.</p>
                <div className="settings-panel__field">
                  <label>First-order rate</label>
                  <input type="number" className="input" step="0.01" min={0} max={1}
                    value={client.payoutPctFirst} onChange={(e) => set("payoutPctFirst", Number(e.target.value))} />
                  <small>Currently {(client.payoutPctFirst * 100).toFixed(0)}%.</small>
                </div>
                <div className="settings-panel__field">
                  <label>
                    <input type="checkbox" checked={client.payoutVisible} onChange={(e) => set("payoutVisible", e.target.checked)} />
                    {" "}Show payout in dashboard
                  </label>
                </div>
              </div>
            )}

            {active === "campaigns" && (
              <div>
                <h2 className="settings-panel__h">Campaigns</h2>
                <p className="settings-panel__sub">Six campaigns are seeded for McKenzie. Add or rename via Supabase for v1.</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {["Tourist Gift Shop", "Museum Donors", "Acquisitions", "Construction", "Banks & Credit Unions", "Schools"].map((n) => (
                    <li key={n} style={{ padding: "10px 12px", borderBottom: "1px solid var(--app-line)" }}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {active === "users" && (
              <UsersPanel />
            )}

            {active === "integrations" && (
              <div>
                <h2 className="settings-panel__h">Integrations</h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                  <li className="settings-panel__field">Instantly · webhook live</li>
                  <li className="settings-panel__field">Typeform · webhook live</li>
                  <li className="settings-panel__field">Make.com · 5 scenarios polled</li>
                  <li className="settings-panel__field">n8n · 10 workflows tagged <code>lead-tracker</code></li>
                  <li className="settings-panel__field">Slack · pending bot token</li>
                  <li className="settings-panel__field">Syncore · Phase 2</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Users & roles panel
// ---------------------------------------------------------------------------

type Role = "agency_admin" | "client_member" | "aoc_admin";

interface UserRow {
  user_id: string;
  email: string;
  display_name: string | null;
  role: Role;
  client_id: string | null;
  profile_created_at: string | null;
  last_activity_at: string | null;
  total_actions: number | null;
}

const ROLE_LABELS: Record<Role, string> = {
  agency_admin: "Agency admin",
  client_member: "Client member",
  aoc_admin: "AOC admin",
};

function UsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("client_member");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: { Accept: "application/json" } });
      const json = await res.json();
      if (!res.ok) {
        setBanner({ kind: "err", text: json.error || "failed to load users" });
        return;
      }
      setUsers(json.users || []);
      setDegraded(json.degraded ? (json.message || null) : null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadUsers(); }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, display_name: name || undefined, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBanner({ kind: "err", text: json.error || "invite failed" });
      } else if (json.preexisting) {
        setBanner({ kind: "ok", text: `${email} already had an account — role updated.` });
      } else {
        setBanner({ kind: "ok", text: `Invite sent to ${email}.` });
        setEmail("");
        setName("");
      }
      await loadUsers();
    } catch (err) {
      setBanner({ kind: "err", text: String(err) });
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(user_id: string, newRole: Role) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) setBanner({ kind: "err", text: json.error || "update failed" });
      else setBanner({ kind: "ok", text: "Role updated." });
      await loadUsers();
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(user_id: string, email: string) {
    if (!confirm(`Remove ${email}? They will lose access immediately.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user_id)}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) setBanner({ kind: "err", text: json.error || "remove failed" });
      else setBanner({ kind: "ok", text: `Removed ${email}.` });
      await loadUsers();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="settings-panel__h">Users & roles</h2>
      <p className="settings-panel__sub">
        Invite colleagues by email. They&apos;ll get a magic link that confirms their account and signs them in.
        Roles: <code>agency_admin</code> (full access), <code>client_member</code> (read + status edit), <code>aoc_admin</code> (cross-tenant).
      </p>

      {degraded && (
        <div style={{ padding: 12, marginBottom: 12, borderRadius: 8, background: "#FFF7ED", border: "1px solid #FED7AA", fontSize: 13 }}>
          {degraded}
        </div>
      )}
      {banner && (
        <div style={{
          padding: 10, marginBottom: 12, borderRadius: 8, fontSize: 13,
          background: banner.kind === "ok" ? "#ECFDF5" : "#FEF2F2",
          border: banner.kind === "ok" ? "1px solid #A7F3D0" : "1px solid #FECACA",
          color: banner.kind === "ok" ? "#065F46" : "#991B1B",
        }}>
          {banner.text}
        </div>
      )}

      <form onSubmit={invite} style={{ display: "grid", gap: 12, gridTemplateColumns: "minmax(220px,1fr) minmax(180px,1fr) 200px auto", alignItems: "end", marginBottom: 24, padding: 16, border: "1px solid var(--app-line,#E5E7EB)", borderRadius: 10 }}>
        <div className="settings-panel__field" style={{ margin: 0 }}>
          <label>Work email<small>An invitation email will be sent here.</small></label>
          <input type="email" required className="input" placeholder="colleague@modern-amenities.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="settings-panel__field" style={{ margin: 0 }}>
          <label>Display name<small>Optional. Defaults to the email handle.</small></label>
          <input className="input" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="settings-panel__field" style={{ margin: 0 }}>
          <label>Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="client_member">Client member</option>
            <option value="agency_admin">Agency admin</option>
            <option value="aoc_admin">AOC admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn--primary" disabled={busy || !email}>
          {busy ? "Sending…" : "Send invite"}
        </button>
      </form>

      <div style={{ border: "1px solid var(--app-line,#E5E7EB)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,2fr) 1fr 1fr 1fr 110px", padding: "10px 14px", background: "var(--app-surface-2,#F9FAFB)", fontSize: 12, fontWeight: 600, color: "var(--app-ink-3,#6B7280)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          <div>User</div>
          <div>Role</div>
          <div>Joined</div>
          <div>Last active</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {loading ? (
          <div style={{ padding: 16, fontSize: 13, color: "var(--app-ink-3)" }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: "var(--app-ink-3)" }}>No users yet. Invite your first colleague above.</div>
        ) : users.map((u) => (
          <div key={u.user_id} style={{ display: "grid", gridTemplateColumns: "minmax(180px,2fr) 1fr 1fr 1fr 110px", padding: "12px 14px", borderTop: "1px solid var(--app-line,#E5E7EB)", alignItems: "center", fontSize: 13 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{u.display_name || u.email.split("@")[0]}</div>
              <div style={{ color: "var(--app-ink-3,#6B7280)", fontSize: 12 }}>{u.email}</div>
            </div>
            <div>
              <select
                value={u.role}
                onChange={(e) => changeRole(u.user_id, e.target.value as Role)}
                disabled={busy}
                style={{ fontSize: 12, padding: "4px 6px", border: "1px solid var(--app-line,#E5E7EB)", borderRadius: 6, background: "white" }}
              >
                <option value="client_member">{ROLE_LABELS.client_member}</option>
                <option value="agency_admin">{ROLE_LABELS.agency_admin}</option>
                <option value="aoc_admin">{ROLE_LABELS.aoc_admin}</option>
              </select>
            </div>
            <div style={{ color: "var(--app-ink-3,#6B7280)" }}>
              {u.profile_created_at ? new Date(u.profile_created_at).toLocaleDateString() : "—"}
            </div>
            <div style={{ color: "var(--app-ink-3,#6B7280)" }}>
              {u.last_activity_at ? new Date(u.last_activity_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "never"}
            </div>
            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => removeUser(u.user_id, u.email)}
                disabled={busy}
                className="btn btn--ghost"
                style={{ fontSize: 12, color: "#B91C1C" }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: "var(--app-ink-3,#6B7280)" }}>
        Self-signup is also enabled at <code>/signup</code>. Role is auto-assigned from email domain
        (<code>@modern-amenities.com</code> → agency_admin, others → client_member).
      </p>
    </div>
  );
}
