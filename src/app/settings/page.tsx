"use client";
import { useEffect, useState } from "react";
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
          <a href="/">Dashboard</a>
          <a className="is-active">Settings</a>
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
              <div>
                <h2 className="settings-panel__h">Users & roles</h2>
                <p className="settings-panel__sub">Invitations + email verification handled by Supabase Auth. Self-signup at /signup.</p>
                <p style={{ fontSize: 13 }}>Roles: <code>agency_admin</code>, <code>client_member</code>, <code>aoc_admin</code>.</p>
              </div>
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
