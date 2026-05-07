// components.jsx — Reusable UI primitives for Lead Tracker.
// Sparkline, KPI, StatusPill, CampaignChip, EmptyState, Skeleton, Drawer.

const { useState, useRef, useEffect, useMemo, useLayoutEffect } = React;

// ── Sparkline ───────────────────────────────────────────────
function Sparkline({ data = [], color = 'currentColor', width = 96, height = 28 }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${path} L${width} ${height} L0 ${height} Z`;
  const lastX = points[points.length - 1][0];
  const lastY = points[points.length - 1][1];
  return (
    <svg className="kpi__spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={area} fill={color} fillOpacity="0.10" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}

// ── KPI Tile ────────────────────────────────────────────────
function KpiTile({ label, value, delta, deltaLabel, spark, accent = false, period = 'vs prev 30d', placeholder = false, sub }) {
  if (placeholder) {
    return (
      <div className="kpi kpi--placeholder">
        <div className="kpi__label">{label}</div>
        <div className="kpi__value">Coming soon</div>
        <div className="kpi__sub">{sub || 'Available in v2 — payout calculation will land here.'}</div>
      </div>
    );
  }
  const deltaCls = delta == null ? 'kpi__delta--flat' : delta > 0 ? 'kpi__delta--up' : delta < 0 ? 'kpi__delta--down' : 'kpi__delta--flat';
  const Arrow = delta > 0 ? Icons.ArrowUp : delta < 0 ? Icons.ArrowDown : null;
  return (
    <div className={accent ? 'kpi kpi--accent' : 'kpi'}>
      <div className="kpi__label">{label}</div>
      <div className="kpi__value-row">
        <div className="kpi__value">{value}</div>
        {delta != null && (
          <div className={`kpi__delta ${deltaCls}`}>
            {Arrow && <Arrow size={12} />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div className="kpi__foot">
        <div className="kpi__period">{deltaLabel || period}</div>
        {spark && <Sparkline data={spark} color="var(--accent)" />}
      </div>
    </div>
  );
}

// ── Status Pill ─────────────────────────────────────────────
function StatusPill({ status, onClick, inline = false }) {
  const cls = `status status--${status === 'green' ? 'green' : status === 'amber' ? 'amber' : status === 'red' ? 'red' : 'gray'} ${inline ? 'status--inline' : ''}`;
  return (
    <span className={cls} onClick={onClick} role={onClick ? 'button' : undefined}>
      {STATUS_LABELS[status]}
      {inline && <Icons.ChevronDown size={10} className="caret" />}
    </span>
  );
}

// Status dropdown (pops over the row)
function StatusMenu({ value, onChange, onClose, anchorRect }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  if (!anchorRect) return null;
  const top = anchorRect.bottom + 4 + window.scrollY;
  const left = anchorRect.left + window.scrollX;
  const opts = [
    { v: 'amber', label: 'Not yet closed' },
    { v: 'green', label: 'Order placed' },
    { v: 'red',   label: 'Lost' },
  ];
  return (
    <div ref={ref} className="status-menu" style={{ top, left }}>
      {opts.map(o => (
        <button key={o.v} className={value === o.v ? 'is-current' : ''}
          onClick={(e) => { e.stopPropagation(); onChange(o.v); onClose(); }}>
          <StatusPill status={o.v} />
          <Icons.Check size={14} className="check" />
        </button>
      ))}
    </div>
  );
}

// ── Campaign Chip ───────────────────────────────────────────
function CampaignChip({ campaign, active = false, onClick, asPill = false }) {
  if (!campaign) return null;
  return (
    <button
      className={`chip chip--campaign ${active ? 'is-active' : ''}`}
      style={asPill ? { '--chip-dot': campaign.dot } : undefined}
      onClick={onClick}
      type="button"
    >
      <span className="chip__dot" style={{ background: campaign.dot }} />
      {campaign.name}
    </button>
  );
}

// ── Inline editable cell ────────────────────────────────────
function InlineEditText({ value, onChange, type = 'text', placeholder = '—', disabled = false, prefix = '', format }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef(null);
  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (type === 'number') {
      const n = parseFloat(String(draft).replace(/[^\d.-]/g, ''));
      onChange(isNaN(n) ? null : n);
    } else {
      onChange(draft || null);
    }
  };

  if (disabled) {
    return <span className="inline-edit is-disabled">{placeholder}</span>;
  }
  if (editing) {
    return (
      <span className="inline-edit is-editing">
        {prefix}
        <input
          ref={inputRef}
          type={type === 'number' ? 'text' : type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false); } }}
        />
      </span>
    );
  }
  const display = value == null || value === ''
    ? <span style={{ color: 'var(--app-ink-4)' }}>{placeholder}</span>
    : <>{prefix}{format ? format(value) : value}</>;
  return (
    <button className="inline-edit" onClick={(e) => { e.stopPropagation(); setEditing(true); }} type="button">
      {display}
    </button>
  );
}

// ── Skeleton row ────────────────────────────────────────────
function SkeletonRow() {
  const widths = [120, 180, 130, 90, 130, 90, 80, 24];
  return (
    <tr>
      {widths.map((w, i) => (
        <td key={i}><span className="skel" style={{ width: w + 'px' }} /></td>
      ))}
    </tr>
  );
}

// ── Empty state ─────────────────────────────────────────────
function EmptyState({ onClear }) {
  return (
    <div className="empty">
      <div className="empty__art">
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 14h32v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V14z" />
          <path d="M8 14l4-6h24l4 6" />
          <path d="M16 22h16M16 28h10" opacity="0.5" />
        </svg>
      </div>
      <div className="empty__title">No leads yet</div>
      <div className="empty__copy">Your first qualified handoff will appear here. New leads sync automatically from Instantly, Typeform, and Make.</div>
      {onClear && <button className="btn btn--sm" onClick={onClear}>Clear filters</button>}
    </div>
  );
}

// ── Drawer ──────────────────────────────────────────────────
function Drawer({ lead, onClose, onUpdate, audit }) {
  const open = !!lead;
  // Lock scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!lead) return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" />
    </>
  );

  const camp = CAMPAIGN_BY_ID[lead.campaign];
  const auditRows = audit[lead.id] || [
    { who: 'Auto (Instantly)', what: 'Lead introduced', when: fmtDateShort(lead.intro) + ' · 09:00' },
  ];

  const setField = (field, value) => onUpdate(lead.id, { [field]: value });

  return (
    <>
      <div className={`drawer-scrim ${open ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'is-open' : ''}`} aria-label="Lead detail">
        <div className="drawer__head">
          <div className="drawer__head-row">
            <div>
              <h2 className="drawer__name">{lead.name}</h2>
              <div className="drawer__email">{lead.email}</div>
            </div>
            <button className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Close">
              <Icons.X size={16} />
            </button>
          </div>
          <div className="drawer__head-meta">
            {camp && <CampaignChip campaign={camp} />}
            <StatusPill status={lead.status} />
            <span style={{ fontSize: 12, color: 'var(--app-ink-3)', marginLeft: 'auto' }}>
              Introduced {fmtDate(lead.intro)}
            </span>
          </div>
        </div>

        <div className="drawer__body">
          {/* Order details */}
          <section>
            <h3 className="drawer__section-h">Order details</h3>
            <div className="drawer__field-grid">
              <div className="field">
                <label>Status</label>
                <select value={lead.status} onChange={(e) => setField('status', e.target.value)}>
                  <option value="amber">Not yet closed</option>
                  <option value="green">Order placed</option>
                  <option value="red">Lost</option>
                </select>
              </div>
              <div className="field">
                <label>Campaign</label>
                <select value={lead.campaign} onChange={(e) => setField('campaign', e.target.value)}>
                  {CAMPAIGNS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>First order date</label>
                <input
                  type="date"
                  value={lead.orderDate || ''}
                  disabled={lead.status !== 'green'}
                  onChange={(e) => setField('orderDate', e.target.value || null)}
                />
              </div>
              <div className="field">
                <label>First order amount</label>
                <input
                  type="number"
                  placeholder="0"
                  value={lead.amount ?? ''}
                  disabled={lead.status !== 'green'}
                  onChange={(e) => setField('amount', e.target.value === '' ? null : parseFloat(e.target.value))}
                />
              </div>
              <div className="field field--full">
                <label>Notes</label>
                <textarea
                  value={lead.notes || ''}
                  placeholder="Internal notes — visible to McKenzie + Modern Amenities."
                  onChange={(e) => setField('notes', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h3 className="drawer__section-h">Timeline</h3>
            <div className="timeline">
              <div className="tl-item tl-item--accent">
                <div className="tl-title">Introduced to McKenzie</div>
                <div className="tl-meta">{fmtDate(lead.intro)} · via {camp?.name || 'Direct'}</div>
              </div>
              {lead.status === 'amber' && (
                <div className="tl-item tl-item--amber">
                  <div className="tl-title">Working — not yet closed</div>
                  <div className="tl-meta">McKenzie is in active conversation</div>
                </div>
              )}
              {lead.status === 'green' && (
                <>
                  <div className="tl-item tl-item--amber">
                    <div className="tl-title">Status: working</div>
                    <div className="tl-meta">{fmtDate(lead.intro)} → {fmtDate(lead.orderDate)}</div>
                  </div>
                  <div className="tl-item tl-item--green">
                    <div className="tl-title">Order placed — {fmtCurrencyFull(lead.amount)}</div>
                    <div className="tl-meta">{fmtDate(lead.orderDate)}</div>
                    {lead.notes && <div className="tl-detail">{lead.notes}</div>}
                  </div>
                </>
              )}
              {lead.status === 'red' && (
                <div className="tl-item tl-item--red">
                  <div className="tl-title">Marked lost</div>
                  <div className="tl-meta">{lead.notes || 'No reason recorded'}</div>
                </div>
              )}
            </div>
          </section>

          {/* Audit */}
          <section>
            <h3 className="drawer__section-h">Audit trail</h3>
            <div className="audit">
              {auditRows.map((a, i) => (
                <div className="audit-row" key={i}>
                  <b>{a.who}</b>
                  <span>{a.what}</span>
                  <time>{a.when}</time>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

Object.assign(window, {
  Sparkline, KpiTile, StatusPill, StatusMenu, CampaignChip,
  InlineEditText, SkeletonRow, EmptyState, Drawer,
});
