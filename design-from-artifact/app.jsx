// app.jsx — Lead Tracker root. Wires routing, theme, tweaks, drawer, and screens.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "mckenzie",
  "accent": "#0F766E",
  "clientName": "McKenzie SewOn",
  "density": "comfortable",
  "dark": false,
  "tableState": "populated",
  "loading": false,
  "payoutMode": "v2",
  "dateRange": "30d"
}/*EDITMODE-END*/;

// Two preset themes — "mckenzie" + "aoc" — plus custom hex overrides
const THEME_PRESETS = {
  mckenzie: { accent: '#0F766E', clientName: 'McKenzie SewOn' },
  aoc:      { accent: '#475569', clientName: 'AOC Generic' },
};

function deriveTints(hex) {
  // Build pale tint variants from the chosen accent
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  const tint = (a) => `rgba(${r},${g},${b},${a})`;
  // Deep variant
  const deep = `rgb(${Math.round(r*0.65)},${Math.round(g*0.65)},${Math.round(b*0.65)})`;
  // Choose ink color based on luminance
  const lum = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
  const ink = lum > 0.6 ? '#18181B' : '#FFFFFF';
  return {
    '--accent': hex,
    '--accent-deep': deep,
    '--accent-tint': tint(0.10),
    '--accent-tint-2': tint(0.22),
    '--accent-ink': ink,
  };
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState('login');
  const [openLead, setOpenLead] = React.useState(null);
  const [leads, setLeads] = React.useState(LEADS);

  // Compose a client object from tweak inputs
  const accent = tweaks.accent;
  const client = React.useMemo(() => ({
    name: tweaks.clientName,
    slug: tweaks.clientName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    accent,
    logo: null,
    payoutPct: 15,
  }), [tweaks.clientName, accent]);

  // Apply theme via CSS vars on root
  const themeVars = React.useMemo(() => deriveTints(accent), [accent]);

  // Keep the live lead drawer in sync if the underlying lead changes
  React.useEffect(() => {
    if (!openLead) return;
    const fresh = leads.find(l => l.id === openLead.id);
    if (fresh && fresh !== openLead) setOpenLead(fresh);
  }, [leads, openLead]);

  const handleAccentChange = (v) => setTweak('accent', v);
  const handleClientNameChange = (v) => setTweak('clientName', v);

  const setClient = (next) => {
    if (next.accent !== client.accent) setTweak('accent', next.accent);
    if (next.name !== client.name) setTweak('clientName', next.name);
  };

  return (
    <div
      className="app"
      data-density={tweaks.density === 'compact' ? 'compact' : 'comfortable'}
      data-theme={tweaks.dark ? 'dark' : 'light'}
      style={themeVars}
    >
      {route === 'login' ? (
        <Login client={client} onSubmit={() => setRoute('dashboard')} />
      ) : (
        <>
          <TopBar
            route={route}
            setRoute={setRoute}
            client={client}
            onLogout={() => setRoute('login')}
            onSettings={() => setRoute('settings')}
            isAgency={true}
          />
          {route === 'dashboard' && (
            <Dashboard
              client={client}
              leads={leads}
              setLeads={setLeads}
              isLoading={tweaks.loading}
              isEmpty={tweaks.tableState === 'empty'}
              payoutMode={tweaks.payoutMode}
              dateRange={tweaks.dateRange}
              setDateRange={(v) => setTweak('dateRange', v)}
              onOpenLead={setOpenLead}
              density={tweaks.density}
            />
          )}
          {route === 'settings' && (
            <Settings
              client={client}
              setClient={setClient}
              onAccentChange={handleAccentChange}
            />
          )}
          <Drawer
            lead={openLead}
            onClose={() => setOpenLead(null)}
            onUpdate={(id, patch) => setLeads(prev => prev.map(l => {
              if (l.id !== id) return l;
              const next = { ...l, ...patch };
              if (patch.status === 'green' && !next.orderDate) next.orderDate = daysAgo(0);
              if (patch.status && patch.status !== 'green') { next.orderDate = null; next.amount = null; }
              return next;
            }))}
            audit={AUDIT}
          />
        </>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tenant theme" />
        <TweakRadio
          label="Preset"
          value={Object.entries(THEME_PRESETS).find(([k, v]) => v.accent === tweaks.accent)?.[0] || 'custom'}
          options={[
            { value: 'mckenzie', label: 'McKenzie' },
            { value: 'aoc', label: 'AOC' },
            { value: 'custom', label: 'Custom' },
          ]}
          onChange={(v) => {
            if (v === 'mckenzie' || v === 'aoc') {
              setTweak({ accent: THEME_PRESETS[v].accent, clientName: THEME_PRESETS[v].clientName, theme: v });
            } else {
              setTweak('theme', 'custom');
            }
          }}
        />
        <TweakColor label="Accent" value={tweaks.accent} onChange={handleAccentChange} />
        <TweakText label="Client name" value={tweaks.clientName} onChange={handleClientNameChange} />

        <TweakSection label="Display" />
        <TweakRadio
          label="Density"
          value={tweaks.density}
          options={[{value:'comfortable', label:'Comfy'}, {value:'compact', label:'Compact'}]}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakToggle label="Dark mode" value={tweaks.dark} onChange={(v) => setTweak('dark', v)} />

        <TweakSection label="Data state" />
        <TweakRadio
          label="Table"
          value={tweaks.tableState}
          options={[{value:'populated', label:'Populated'}, {value:'empty', label:'Empty'}]}
          onChange={(v) => setTweak('tableState', v)}
        />
        <TweakToggle label="Loading skeleton" value={tweaks.loading} onChange={(v) => setTweak('loading', v)} />

        <TweakSection label="KPI scope" />
        <TweakRadio
          label="Payout tile"
          value={tweaks.payoutMode}
          options={[{value:'v1', label:'v1 (soon)'}, {value:'v2', label:'v2 (live)'}]}
          onChange={(v) => setTweak('payoutMode', v)}
        />
        <TweakRadio
          label="Date range"
          value={tweaks.dateRange === 'custom' ? '30d' : tweaks.dateRange}
          options={[{value:'7d', label:'7d'}, {value:'30d', label:'30d'}, {value:'90d', label:'90d'}]}
          onChange={(v) => setTweak('dateRange', v)}
        />

        <TweakSection label="Navigate" />
        <div style={{display: 'flex', gap: 6}}>
          <TweakButton label="Login" onClick={() => setRoute('login')} secondary />
          <TweakButton label="Dashboard" onClick={() => setRoute('dashboard')} secondary />
          <TweakButton label="Settings" onClick={() => setRoute('settings')} secondary />
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
