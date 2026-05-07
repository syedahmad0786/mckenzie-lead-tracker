// screens.jsx — The 3 main screens: Dashboard, Settings, Login.

const { useState: uS, useMemo: uM, useRef: uR, useEffect: uE } = React;

// ── Top Bar ─────────────────────────────────────────────────
function TopBar({ route, setRoute, client, onLogout, onSettings, isAgency }) {
  const initials = client.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__brand-mark">
          {client.logo ? <img src={client.logo} alt="" /> : initials}
        </div>
        <span>{client.name}</span>
      </div>
      <span className="topbar__divider" />
      <div className="topbar__crumb">Lead Tracker · <b>{isAgency ? 'Agency view' : 'Client view'}</b></div>
      <nav className="topbar__nav">
        <a className={route === 'dashboard' ? 'is-active' : ''} onClick={() => setRoute('dashboard')}>Dashboard</a>
        <a className={route === 'settings' ? 'is-active' : ''} onClick={() => setRoute('settings')}>
          Settings{!isAgency ? '' : ''}
        </a>
      </nav>
      <div className="topbar__spacer" />
      <button className="btn btn--ghost btn--sm" title="Powered by Modern Amenities" style={{gap: 6}}>
        <img src={(window.__resources && window.__resources.maIcon) || "assets/ma-icon.png"} alt="" style={{width: 14, height: 14, borderRadius: 3}} />
        <span style={{fontSize: 11, color: 'var(--app-ink-3)', fontWeight: 500, letterSpacing: '0.02em'}}>BY MODERN AMENITIES</span>
      </button>
      <div className="topbar__user" onClick={onLogout} title="Sign out">
        <div className="avatar">SC</div>
        <span>Sarah Chen</span>
        <Icons.ChevronDown size={14} />
      </div>
    </header>
  );
}

// ── Dashboard ───────────────────────────────────────────────
function Dashboard({ client, leads, setLeads, isLoading, isEmpty, payoutMode, dateRange, setDateRange, onOpenLead, density }) {
  const [activeCampaigns, setActiveCampaigns] = uS([]);
  const [activeStatuses, setActiveStatuses] = uS([]);
  const [search, setSearch] = uS('');
  const [statusMenu, setStatusMenu] = uS({ id: null, rect: null });

  const filtered = uM(() => {
    if (isEmpty) return [];
    return leads.filter(l => {
      if (activeCampaigns.length && !activeCampaigns.includes(l.campaign)) return false;
      if (activeStatuses.length && !activeStatuses.includes(l.status)) return false;
      if (search) {
        const q = search.toLowerCase();
        const camp = CAMPAIGN_BY_ID[l.campaign]?.name.toLowerCase() || '';
        if (!l.name.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q) && !camp.includes(q)) return false;
      }
      return true;
    });
  }, [leads, activeCampaigns, activeStatuses, search, isEmpty]);

  // KPIs from filtered leads
  const kpis = uM(() => {
    const sent = filtered.length;
    const closed = filtered.filter(l => l.status === 'green').length;
    const revenue = filtered.filter(l => l.status === 'green').reduce((s, l) => s + (l.amount || 0), 0);
    const payout = revenue * (client.payoutPct / 100);
    return { sent, closed, revenue, payout };
  }, [filtered, client.payoutPct]);

  const closeRate = kpis.sent ? Math.round((kpis.closed / kpis.sent) * 100) : 0;

  const toggleCampaign = (id) => setActiveCampaigns(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleStatus = (s) => setActiveStatuses(arr => arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);

  const updateLead = (id, patch) => {
    setLeads(prev => prev.map(l => {
      if (l.id !== id) return l;
      const next = { ...l, ...patch };
      // If status flipped to green and no order date, default to today
      if (patch.status === 'green' && !next.orderDate) next.orderDate = daysAgo(0);
      // If flipped away from green, clear order fields
      if (patch.status && patch.status !== 'green') {
        next.orderDate = null;
        next.amount = null;
      }
      return next;
    }));
  };

  const clearFilters = () => { setActiveCampaigns([]); setActiveStatuses([]); setSearch(''); };

  return (
    <div className="page">
      <div className="scoreboard">
        <div className="page-head" style={{marginBottom: 16}}>
          <div>
            <h1 className="page-head__title">Lead pipeline</h1>
            <div className="page-head__sub">
              {isLoading ? <span className="skel" style={{width: 240}} /> :
                isEmpty ? 'No leads yet — feeds connect on first sync' :
                `${filtered.length} of ${leads.length} leads · ${closeRate}% close rate · ${dateRange === '7d' ? 'last 7 days' : dateRange === '30d' ? 'last 30 days' : dateRange === '90d' ? 'last 90 days' : 'all time'}`}
            </div>
          </div>
          <div className="page-head__actions">
            <button className="btn btn--sm">
              <Icons.Download size={14} /> Export
            </button>
            <button className="btn btn--sm">
              <Icons.FileText size={14} /> PDF report
            </button>
          </div>
        </div>

        <div className="kpi-grid">
          <KpiTile
            label="Leads sent"
            value={isLoading ? '—' : String(kpis.sent)}
            delta={isLoading ? null : 22}
            spark={SPARKS.leadsSent}
            accent
          />
          <KpiTile
            label="Orders closed"
            value={isLoading ? '—' : String(kpis.closed)}
            delta={isLoading ? null : 14}
            spark={SPARKS.ordersClosed}
            deltaLabel={`${closeRate}% of leads · vs prev`}
          />
          <KpiTile
            label="Revenue generated"
            value={isLoading ? '—' : fmtCurrency(kpis.revenue)}
            delta={isLoading ? null : 31}
            spark={SPARKS.revenue}
          />
          {payoutMode === 'v1' ? (
            <KpiTile
              placeholder
              label="Payout owed"
              sub={`${client.payoutPct}% of first orders · v2 launch`}
            />
          ) : (
            <KpiTile
              label="Payout owed"
              value={isLoading ? '—' : fmtCurrency(kpis.payout)}
              delta={isLoading ? null : 31}
              spark={SPARKS.payout}
              deltaLabel={`${client.payoutPct}% first-order rate`}
            />
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="filterbar">
        <div className="filterbar__group">
          <span style={{fontSize: 12, color: 'var(--app-ink-3)', fontWeight: 500, paddingRight: 4}}>Campaign</span>
          {CAMPAIGNS.map(c => (
            <button
              key={c.id}
              className={`chip chip--campaign ${activeCampaigns.includes(c.id) ? 'is-active' : ''}`}
              onClick={() => toggleCampaign(c.id)}
              type="button"
            >
              <span className="chip__dot" style={{background: c.dot}} />
              {c.name}
            </button>
          ))}
        </div>
        <span className="filterbar__sep" />
        <div className="filterbar__group">
          <span style={{fontSize: 12, color: 'var(--app-ink-3)', fontWeight: 500, paddingRight: 4}}>Range</span>
          <div className="seg">
            {['7d', '30d', '90d', 'custom'].map(r => (
              <button key={r} className={dateRange === r ? 'is-active' : ''} onClick={() => setDateRange(r)}>
                {r === 'custom' ? 'Custom' : r}
              </button>
            ))}
          </div>
        </div>
        <span className="filterbar__sep" />
        <div className="filterbar__group">
          {[{v: 'green', l: 'Order placed'}, {v: 'amber', l: 'Not yet closed'}, {v: 'red', l: 'Lost'}].map(s => (
            <button
              key={s.v}
              className={`chip ${activeStatuses.includes(s.v) ? 'is-active' : ''}`}
              onClick={() => toggleStatus(s.v)}
              type="button"
            >{s.l}</button>
          ))}
        </div>
        <div className="filterbar__search">
          <Icons.Search size={14} />
          <input
            placeholder="Search name, email, campaign…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(activeCampaigns.length || activeStatuses.length || search) ? (
          <button className="btn btn--ghost btn--sm" onClick={clearFilters}>
            <Icons.X size={12} /> Clear
          </button>
        ) : null}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th style={{width: '18%'}}>Contact</th>
                  <th style={{width: '20%'}}>Email</th>
                  <th>Campaign</th>
                  <th>Introduced</th>
                  <th style={{width: 170}}>Status</th>
                  <th>Order date</th>
                  <th style={{textAlign: 'right'}}>Order amount</th>
                  <th style={{width: 60, textAlign: 'right'}}></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({length: 8}).map((_, i) => <SkeletonRow key={i} />)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8}><EmptyState onClear={clearFilters} /></td></tr>
                ) : filtered.map(l => {
                  const camp = CAMPAIGN_BY_ID[l.campaign];
                  return (
                    <tr key={l.id} onClick={() => onOpenLead(l)}>
                      <td className="cell-name">{l.name}</td>
                      <td className="cell-email">{l.email}</td>
                      <td>
                        <span className="chip chip--campaign" style={{cursor: 'default'}}>
                          <span className="chip__dot" style={{background: camp.dot}} />
                          {camp.name}
                        </span>
                      </td>
                      <td className="cell-mono" style={{color: 'var(--app-ink-3)'}}>{fmtDateShort(l.intro)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`status status--${l.status === 'green' ? 'green' : l.status === 'amber' ? 'amber' : 'red'} status--inline`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const r = e.currentTarget.getBoundingClientRect();
                            setStatusMenu({ id: l.id, rect: r });
                          }}
                          style={{border: 0, cursor: 'pointer'}}
                        >
                          {STATUS_LABELS[l.status]}
                          <Icons.ChevronDown size={10} className="caret" />
                        </button>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <InlineEditText
                          value={l.orderDate}
                          onChange={(v) => updateLead(l.id, { orderDate: v })}
                          type="date"
                          disabled={l.status !== 'green'}
                          format={(v) => fmtDateShort(v)}
                        />
                      </td>
                      <td className="cell-currency" style={{textAlign: 'right'}} onClick={(e) => e.stopPropagation()}>
                        <InlineEditText
                          value={l.amount}
                          onChange={(v) => updateLead(l.id, { amount: v })}
                          type="number"
                          disabled={l.status !== 'green'}
                          format={(v) => fmtCurrencyFull(v)}
                        />
                      </td>
                      <td style={{textAlign: 'right'}} onClick={(e) => e.stopPropagation()}>
                        <button
                          className={`cell-icon-btn ${l.notes ? 'has-notes' : ''}`}
                          onClick={(e) => { e.stopPropagation(); onOpenLead(l); }}
                          title={l.notes ? 'View notes' : 'No notes'}
                        >
                          <Icons.MessageSquare size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Mobile cards mirror */}
            <div className="mobile-cards">
              {!isLoading && filtered.map(l => {
                const camp = CAMPAIGN_BY_ID[l.campaign];
                return (
                  <div className="mobile-card" key={l.id} onClick={() => onOpenLead(l)}>
                    <div className="mobile-card__name">{l.name}</div>
                    <div className="mobile-card__row"><span>{camp.name}</span><StatusPill status={l.status} /></div>
                    <div className="mobile-card__row"><span>{fmtDateShort(l.intro)}</span><span>{l.amount ? fmtCurrencyFull(l.amount) : '—'}</span></div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {statusMenu.id && (
        <StatusMenu
          value={leads.find(l => l.id === statusMenu.id)?.status}
          anchorRect={statusMenu.rect}
          onChange={(v) => updateLead(statusMenu.id, { status: v })}
          onClose={() => setStatusMenu({ id: null, rect: null })}
        />
      )}
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────
function Settings({ client, setClient, onAccentChange }) {
  const [section, setSection] = uS('client');
  const presets = [
    { name: 'Deep teal', value: '#0F766E' },
    { name: 'Slate blue', value: '#475569' },
    { name: 'Forest', value: '#184010' },
    { name: 'Indigo', value: '#4338CA' },
    { name: 'Maroon', value: '#9F1239' },
    { name: 'Charcoal', value: '#27272A' },
  ];

  return (
    <div className="page">
      <div className="page-head" style={{marginBottom: 8}}>
        <div>
          <h1 className="page-head__title">Settings</h1>
          <div className="page-head__sub">Configure how Lead Tracker looks and works for {client.name}.</div>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--sm">Discard</button>
          <button className="btn btn--primary btn--sm">Save changes</button>
        </div>
      </div>

      <div className="settings-grid">
        <nav className="settings-nav">
          <div className="settings-nav__head" style={{paddingTop: 0, marginTop: 0}}>Workspace</div>
          <a className={section === 'client' ? 'is-active' : ''} onClick={() => setSection('client')}>Client profile</a>
          <a className={section === 'theme' ? 'is-active' : ''} onClick={() => setSection('theme')}>Theme & accent</a>
          <a className={section === 'campaigns' ? 'is-active' : ''} onClick={() => setSection('campaigns')}>Campaigns</a>
          <a className={section === 'payout' ? 'is-active' : ''} onClick={() => setSection('payout')}>Payout</a>
          <div className="settings-nav__head">Access</div>
          <a className={section === 'users' ? 'is-active' : ''} onClick={() => setSection('users')}>Users & roles</a>
          <a className={section === 'integrations' ? 'is-active' : ''} onClick={() => setSection('integrations')}>Integrations</a>
        </nav>

        <div>
          {section === 'client' && (
            <div className="card">
              <div className="card__head">
                <div className="card__title">Client profile</div>
                <div className="card__sub">Shown in the top bar and on the login screen.</div>
              </div>
              <div className="set-row">
                <div>
                  <div className="set-row__label">Logo</div>
                  <div className="set-row__sub">Square, 1:1, ≥ 256px. PNG with transparent bg recommended.</div>
                </div>
                <div className="set-row__ctrl">
                  <div className="logo-upload">
                    {client.logo ? <img src={client.logo} alt="" /> : <Icons.Building size={20} />}
                  </div>
                  <button className="btn btn--sm">Upload</button>
                  <button className="btn btn--ghost btn--sm">Remove</button>
                </div>
              </div>
              <div className="set-row">
                <div>
                  <div className="set-row__label">Client name</div>
                  <div className="set-row__sub">Displayed throughout the app.</div>
                </div>
                <div className="set-row__ctrl" style={{flex: 1}}>
                  <input className="field" style={{padding: '8px 10px', border: '1px solid var(--app-line)', borderRadius: 6, width: 320}}
                    value={client.name} onChange={(e) => setClient({...client, name: e.target.value})} />
                </div>
              </div>
              <div className="set-row">
                <div>
                  <div className="set-row__label">Slug</div>
                  <div className="set-row__sub">leadtracker.modernamenities.com/<b style={{color: 'var(--app-ink-1)'}}>{client.slug}</b></div>
                </div>
                <div className="set-row__ctrl">
                  <input className="field" style={{padding: '8px 10px', border: '1px solid var(--app-line)', borderRadius: 6, width: 240}}
                    value={client.slug} onChange={(e) => setClient({...client, slug: e.target.value})} />
                </div>
              </div>
              <div className="set-row">
                <div>
                  <div className="set-row__label">Tenant ID</div>
                  <div className="set-row__sub">Used by Make.com webhook routing.</div>
                </div>
                <div className="set-row__ctrl">
                  <code style={{fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '4px 8px', background: 'var(--app-surface-2)', borderRadius: 4, color: 'var(--app-ink-2)'}}>aoc_{client.slug}_2026</code>
                </div>
              </div>
            </div>
          )}

          {section === 'theme' && (
            <div className="card">
              <div className="card__head">
                <div className="card__title">Theme & accent</div>
                <div className="card__sub">A single accent color drives buttons, links, charts, and selection states. One color per client — no rainbow palettes.</div>
              </div>
              <div className="set-row">
                <div>
                  <div className="set-row__label">Accent color</div>
                  <div className="set-row__sub">Auto-applied to chips, KPIs, charts, login screen.</div>
                </div>
                <div className="set-row__ctrl">
                  <div className="color-swatch-row">
                    {presets.map(p => (
                      <button
                        key={p.value}
                        className={`color-swatch ${client.accent === p.value ? 'is-active' : ''}`}
                        style={{background: p.value}}
                        onClick={() => onAccentChange(p.value)}
                        title={p.name}
                      />
                    ))}
                    <input
                      type="color" value={client.accent}
                      onChange={(e) => onAccentChange(e.target.value)}
                      style={{width: 28, height: 28, padding: 0, border: '1px solid var(--app-line)', borderRadius: 6, cursor: 'pointer'}}
                    />
                    <code style={{fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--app-ink-3)', marginLeft: 8}}>{client.accent.toUpperCase()}</code>
                  </div>
                </div>
              </div>
              <div className="set-row">
                <div>
                  <div className="set-row__label">Preview</div>
                  <div className="set-row__sub">Live sample of how the accent appears.</div>
                </div>
                <div className="set-row__ctrl" style={{gap: 12}}>
                  <button className="btn btn--primary">Primary action</button>
                  <span className="chip chip--campaign is-active"><span className="chip__dot" style={{background: client.accent}} />Active filter</span>
                  <StatusPill status="green" />
                </div>
              </div>
            </div>
          )}

          {section === 'campaigns' && (
            <div className="card">
              <div className="card__head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <div className="card__title">Campaigns</div>
                  <div className="card__sub">Tag every lead with its campaign source. Color-coded chips show in the table.</div>
                </div>
                <button className="btn btn--sm"><Icons.Plus size={14}/> Add campaign</button>
              </div>
              {CAMPAIGNS.map(c => (
                <div key={c.id} style={{display: 'grid', gridTemplateColumns: '24px 1fr 120px auto', gap: 12, padding: '10px 0', borderTop: '1px solid var(--app-line)', alignItems: 'center'}}>
                  <span style={{width: 12, height: 12, borderRadius: '50%', background: c.dot}} />
                  <div>
                    <div style={{fontWeight: 500, color: 'var(--app-ink-1)', fontSize: 13.5}}>{c.name}</div>
                    <div style={{fontSize: 12, color: 'var(--app-ink-3)'}}>id: {c.id}</div>
                  </div>
                  <span style={{fontSize: 12, color: 'var(--app-ink-3)'}}>Active</span>
                  <div style={{display: 'flex', gap: 4}}>
                    <button className="cell-icon-btn"><Icons.Edit size={14}/></button>
                    <button className="cell-icon-btn"><Icons.Trash size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === 'payout' && (
            <div className="card">
              <div className="card__head">
                <div className="card__title">Payout</div>
                <div className="card__sub">Defines what {client.name} owes Modern Amenities per closed lead.</div>
              </div>
              <div className="set-row">
                <div>
                  <div className="set-row__label">First-order payout</div>
                  <div className="set-row__sub">Percentage of the first order invoice amount.</div>
                </div>
                <div className="set-row__ctrl">
                  <input
                    type="number"
                    min="0" max="100" step="0.5"
                    value={client.payoutPct}
                    onChange={(e) => setClient({...client, payoutPct: parseFloat(e.target.value) || 0})}
                    style={{width: 80, padding: '8px 10px', border: '1px solid var(--app-line)', borderRadius: 6, textAlign: 'right'}}
                  />
                  <span style={{color: 'var(--app-ink-3)'}}>%</span>
                </div>
              </div>
              <div className="set-row">
                <div>
                  <div className="set-row__label">Subsequent-order payout</div>
                  <div className="set-row__sub">Percentage of every subsequent order from the same lead.</div>
                </div>
                <div className="set-row__ctrl">
                  <input type="number" disabled value="0" style={{width: 80, padding: '8px 10px', border: '1px solid var(--app-line)', borderRadius: 6, textAlign: 'right', background: 'var(--app-surface-2)', color: 'var(--app-ink-4)'}}/>
                  <span style={{color: 'var(--app-ink-3)'}}>%</span>
                  <span className="chip" style={{background: 'var(--app-surface-2)', cursor: 'default', fontSize: 11}}>v2 — locked</span>
                </div>
              </div>
            </div>
          )}

          {section === 'users' && (
            <div className="card">
              <div className="card__head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <div className="card__title">Users & roles</div>
                  <div className="card__sub">Agency Admins can invite, configure, and view all clients. Client Members can only see their own data.</div>
                </div>
                <button className="btn btn--primary btn--sm"><Icons.Plus size={14}/> Invite</button>
              </div>
              {USERS.map(u => (
                <div className="user-row" key={u.email}>
                  <div className="user-row__main">
                    <div className="avatar" style={{background: u.agency ? 'var(--ma-forest)' : 'var(--accent)'}}>
                      {u.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="user-row__name">{u.name}</div>
                      <div className="user-row__email">{u.email}</div>
                    </div>
                  </div>
                  <span style={{fontSize: 12, color: 'var(--app-ink-3)'}}>{u.agency ? 'Modern Amenities' : 'McKenzie SewOn'}</span>
                  <span className={`user-row__role ${u.role.includes('Admin') ? 'user-row__role--admin' : ''}`}>{u.role}</span>
                  <button className="cell-icon-btn"><Icons.MoreH size={14}/></button>
                </div>
              ))}
            </div>
          )}

          {section === 'integrations' && (
            <div className="card">
              <div className="card__head">
                <div className="card__title">Integrations</div>
                <div className="card__sub">Read-only — the agency configures these. Leads flow in automatically; no manual entry needed.</div>
              </div>
              <div className="integ-list">
                {[
                  { name: 'Instantly', meta: 'Cold email outreach · 6 active sequences', status: 'ok', monogram: 'IN' },
                  { name: 'Typeform', meta: 'Inbound forms · 2 forms wired', status: 'ok', monogram: 'TF' },
                  { name: 'Make.com', meta: 'Automation routing · last run 3 min ago', status: 'ok', monogram: 'MK' },
                  { name: 'Syncore', meta: 'Order management — first-order amounts will sync automatically', status: 'soon', monogram: 'SY' },
                ].map(i => (
                  <div className="integ" key={i.name}>
                    <div className="integ__icon">{i.monogram}</div>
                    <div>
                      <div className="integ__name">{i.name}</div>
                      <div className="integ__meta">{i.meta}</div>
                    </div>
                    <span className={`integ__status integ__status--${i.status}`}>{i.status === 'ok' ? '✓ Connected' : 'Coming soon'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Login ───────────────────────────────────────────────────
function Login({ client, onSubmit }) {
  const [email, setEmail] = uS('sarah@modernamenities.com');
  const [password, setPassword] = uS('••••••••••••');
  const [mode, setMode] = uS('password');
  const initials = client.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <div className="login__brand-mark">
            {client.logo ? <img src={client.logo} alt="" /> : initials}
          </div>
          <div>
            <div className="login__brand-name">{client.name}</div>
            <div style={{fontSize: 11, color: 'var(--app-ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginTop: 2}}>Lead Tracker</div>
          </div>
        </div>

        <h1 className="login__title">Sign in to your dashboard.</h1>
        <p className="login__sub">View your pipeline, update lead status, and track revenue from every campaign in one place.</p>

        <form className="login__form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div className="field">
            <label>Work email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          {mode === 'password' && (
            <div className="field">
              <label style={{display: 'flex', justifyContent: 'space-between'}}>
                <span>Password</span>
                <a style={{fontSize: 12, textDecoration: 'none', cursor: 'pointer'}} onClick={(e) => { e.preventDefault(); setMode('magic'); }}>Use magic link instead</a>
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </div>
          )}
          <button className="btn btn--primary" type="submit" style={{height: 40, justifyContent: 'center', marginTop: 4}}>
            {mode === 'password' ? 'Sign in' : 'Send magic link'}
            <Icons.ArrowRight size={14} />
          </button>
          {mode === 'magic' && (
            <a style={{fontSize: 12, textAlign: 'center', textDecoration: 'none', cursor: 'pointer'}} onClick={(e) => { e.preventDefault(); setMode('password'); }}>Use password instead</a>
          )}
        </form>

        <div className="login__foot">
          <img src={(window.__resources && window.__resources.maIcon) || "assets/ma-icon.png"} alt="" style={{width: 14, height: 14, borderRadius: 3, opacity: 0.8}} />
          <span>Powered by Modern Amenities · AOC Operator Network</span>
        </div>
      </div>

      <div className="login__art">
        <svg className="login__art-deco" viewBox="0 0 600 800" preserveAspectRatio="xMaxYMax slice">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="600" height="800" fill="url(#grid)" />
          <circle cx="500" cy="200" r="180" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
          <circle cx="500" cy="200" r="120" fill="none" stroke="white" strokeWidth="1" opacity="0.6" />
          <circle cx="500" cy="200" r="60" fill="white" opacity="0.3" />
        </svg>

        <div style={{position: 'relative', zIndex: 2}}>
          <div style={{fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.85, marginBottom: 24}}>
            Pipeline · Q2 2026
          </div>
          <p className="login__art-quote">
            Every qualified handoff, the order it became, and the revenue it earned — visible to both teams in real time.
          </p>
          <div className="login__art-attrib">A shared workspace between {client.name} and Modern Amenities.</div>
        </div>

        <div className="login__art-foot">
          <span>22 leads tracked this period</span>
          <span>$118,420 revenue</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TopBar, Dashboard, Settings, Login });
