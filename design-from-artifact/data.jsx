// data.jsx — Seed data for Lead Tracker
// 22 leads spanning campaigns, statuses, dates. Realistic for an apparel/sewn
// goods supplier (McKenzie SewOn) — uniforms, custom merch, embroidery.

const CAMPAIGNS = [
  { id: 'apparel-q2',     name: 'Q2 Apparel Outreach',     dot: '#0F766E' },
  { id: 'tradeshow',      name: 'PromoExpo 2026 Followup', dot: '#B45309' },
  { id: 'linkedin',       name: 'LinkedIn — HR Decision Makers', dot: '#1D4ED8' },
  { id: 'inbound',        name: 'Inbound — Typeform',      dot: '#7C3AED' },
  { id: 'referral',       name: 'Referral Network',        dot: '#15803D' },
  { id: 'enterprise',     name: 'Enterprise Uniforms',     dot: '#BE185D' },
];

// Helper: ISO date string for N days ago
const daysAgo = (n) => {
  const d = new Date('2026-04-30T10:00:00Z');
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const fmtDateShort = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const fmtCurrency = (n) => {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
};
const fmtCurrencyFull = (n) => {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
};

const LEADS = [
  { id: 'l01', name: 'Marcus Chen',       email: 'm.chen@northbay-uniforms.com',     campaign: 'enterprise',   intro: daysAgo(2),  status: 'amber', orderDate: null,        amount: null,    notes: 'Wants to see a sample stitch quality before committing. Send catalog Friday.' },
  { id: 'l02', name: 'Priya Raman',       email: 'priya@castell-hospitality.com',    campaign: 'apparel-q2',   intro: daysAgo(3),  status: 'green', orderDate: daysAgo(1),  amount: 4280,    notes: '34 staff polos for the Castell Marina opening.' },
  { id: 'l03', name: 'Jordan Reeves',     email: 'jordan@reevesconstruction.net',    campaign: 'tradeshow',    intro: daysAgo(5),  status: 'green', orderDate: daysAgo(2),  amount: 12640,   notes: 'Hi-vis crew shirts + jackets, 3 sizes. Repeat customer potential.' },
  { id: 'l04', name: 'Aisha Mwangi',      email: 'aisha.mwangi@kelp-collective.co',  campaign: 'linkedin',     intro: daysAgo(6),  status: 'amber', orderDate: null,        amount: null,    notes: '' },
  { id: 'l05', name: 'Tomás Iglesias',    email: 't.iglesias@altopromo.com',         campaign: 'inbound',      intro: daysAgo(7),  status: 'green', orderDate: daysAgo(4),  amount: 2180,    notes: 'Custom embroidered caps, 200 units.' },
  { id: 'l06', name: 'Hana Watanabe',     email: 'hana@studioblossom.design',        campaign: 'referral',     intro: daysAgo(8),  status: 'red',   orderDate: null,        amount: null,    notes: 'Went with another supplier — price was the deciding factor. Worth a quarterly check-in.' },
  { id: 'l07', name: 'Daniel Petrov',     email: 'dpetrov@cohort-fitness.com',       campaign: 'apparel-q2',   intro: daysAgo(9),  status: 'green', orderDate: daysAgo(6),  amount: 6940,    notes: 'Branded gym kits for new cohort launch.' },
  { id: 'l08', name: 'Lena Ostrowski',    email: 'lena@northstar-events.org',        campaign: 'tradeshow',    intro: daysAgo(11), status: 'amber', orderDate: null,        amount: null,    notes: 'Volunteer t-shirts for fundraiser. Decision in 2 weeks.' },
  { id: 'l09', name: 'Carter Bishop',     email: 'cbishop@meridianhotels.com',       campaign: 'enterprise',   intro: daysAgo(12), status: 'green', orderDate: daysAgo(8),  amount: 18920,   notes: 'Front-of-house uniforms, 4 properties. Multi-property deal.' },
  { id: 'l10', name: 'Riya Subramanian',  email: 'riya@brightspark-edu.org',         campaign: 'linkedin',     intro: daysAgo(14), status: 'amber', orderDate: null,        amount: null,    notes: '' },
  { id: 'l11', name: 'Felix Andersen',    email: 'felix@andersen-cycles.eu',         campaign: 'inbound',      intro: daysAgo(15), status: 'green', orderDate: daysAgo(11), amount: 3420,    notes: 'Cycling jerseys, sublimation print.' },
  { id: 'l12', name: 'Nora Greenwood',    email: 'nora@greenwoodgroup.co',           campaign: 'referral',     intro: daysAgo(17), status: 'green', orderDate: daysAgo(13), amount: 8760,    notes: 'Embroidered button-downs for sales team.' },
  { id: 'l13', name: 'Samir Khoury',      email: 's.khoury@oasis-club.com',          campaign: 'apparel-q2',   intro: daysAgo(19), status: 'red',   orderDate: null,        amount: null,    notes: 'Budget pulled this quarter. Revisit in Q3.' },
  { id: 'l14', name: 'Miguel Santos',     email: 'msantos@palmcoast-resorts.com',    campaign: 'enterprise',   intro: daysAgo(22), status: 'green', orderDate: daysAgo(18), amount: 24180,   notes: 'Resort staff uniforms, 6 categories. Largest order this quarter.' },
  { id: 'l15', name: 'Brielle Okafor',    email: 'b.okafor@helio-studios.com',       campaign: 'inbound',      intro: daysAgo(24), status: 'amber', orderDate: null,        amount: null,    notes: 'Wants pricing on heat transfer vinyl vs screen print.' },
  { id: 'l16', name: 'Alistair Frye',     email: 'alistair@frye-haberdashery.uk',    campaign: 'tradeshow',    intro: daysAgo(26), status: 'green', orderDate: daysAgo(21), amount: 5280,    notes: 'Bespoke linen shirting, embroidered initials.' },
  { id: 'l17', name: 'Yasmin Karimov',    email: 'yasmin@karimov-coffee.com',        campaign: 'linkedin',     intro: daysAgo(28), status: 'green', orderDate: daysAgo(24), amount: 1820,    notes: 'Barista aprons, 12 units. Small but they refer.' },
  { id: 'l18', name: 'Owen McAllister',   email: 'owen@mcallister-tactical.com',     campaign: 'referral',     intro: daysAgo(31), status: 'green', orderDate: daysAgo(27), amount: 14640,   notes: 'Tactical gear with custom patches.' },
  { id: 'l19', name: 'Sienna Park',       email: 'sienna@park-hospitality.com',      campaign: 'enterprise',   intro: daysAgo(34), status: 'amber', orderDate: null,        amount: null,    notes: '' },
  { id: 'l20', name: 'Theo Lindberg',     email: 'tlindberg@nordic-outfitters.se',   campaign: 'apparel-q2',   intro: daysAgo(38), status: 'red',   orderDate: null,        amount: null,    notes: 'Manufacturing in-house now. Lost.' },
  { id: 'l21', name: 'Renée Beaumont',    email: 'renee@beaumont-wines.com',         campaign: 'inbound',      intro: daysAgo(42), status: 'green', orderDate: daysAgo(36), amount: 3960,    notes: 'Tasting room aprons + polos.' },
  { id: 'l22', name: 'Devon Williams',    email: 'devon@williams-aquatics.com',      campaign: 'tradeshow',    intro: daysAgo(48), status: 'green', orderDate: daysAgo(42), amount: 7480,    notes: 'Lifeguard rashguards + staff polos for summer season.' },
];

// Audit trails — keyed by lead id, kept light
const AUDIT = {
  l02: [
    { who: 'Sarah Chen', what: 'Status changed to Order Placed', when: daysAgo(1) + ' · 09:14' },
    { who: 'Sarah Chen', what: 'Order amount set to $4,280',    when: daysAgo(1) + ' · 09:14' },
    { who: 'Auto (Make)', what: 'Lead introduced via Typeform', when: daysAgo(3) + ' · 14:02' },
  ],
  l03: [
    { who: 'Mike Reeves', what: 'Order amount set to $12,640', when: daysAgo(2) + ' · 16:48' },
    { who: 'Mike Reeves', what: 'Status changed to Order Placed', when: daysAgo(2) + ' · 16:47' },
    { who: 'Auto (Instantly)', what: 'Lead replied to outreach', when: daysAgo(5) + ' · 11:20' },
  ],
  l09: [
    { who: 'Sarah Chen', what: 'Status changed to Order Placed', when: daysAgo(8) + ' · 10:32' },
    { who: 'Sarah Chen', what: 'Notes updated',                  when: daysAgo(8) + ' · 10:31' },
    { who: 'Sarah Chen', what: 'Order amount set to $18,920',    when: daysAgo(8) + ' · 10:30' },
    { who: 'Auto (Instantly)', what: 'Lead introduced',          when: daysAgo(12) + ' · 08:14' },
  ],
};

// KPI sparkline data (12 buckets, normalized 0..1)
const SPARKS = {
  leadsSent:    [0.30, 0.42, 0.38, 0.55, 0.48, 0.62, 0.58, 0.70, 0.65, 0.75, 0.82, 0.88],
  ordersClosed: [0.25, 0.30, 0.28, 0.40, 0.45, 0.42, 0.55, 0.50, 0.62, 0.65, 0.72, 0.78],
  revenue:      [0.20, 0.32, 0.42, 0.38, 0.55, 0.50, 0.62, 0.70, 0.65, 0.78, 0.84, 0.92],
  payout:       [0.18, 0.28, 0.34, 0.44, 0.40, 0.52, 0.58, 0.66, 0.72, 0.74, 0.82, 0.90],
};

// User list for settings
const USERS = [
  { name: 'Sarah Chen',    email: 'sarah@modernamenities.com', role: 'Agency Admin',  agency: true },
  { name: 'Mike Reeves',   email: 'mike@modernamenities.com',  role: 'Agency Member', agency: true },
  { name: 'Lauren McKenzie', email: 'lauren@mckenziesewon.com', role: 'Client Admin',  agency: false },
  { name: 'David Park',    email: 'david@mckenziesewon.com',   role: 'Client Member', agency: false },
  { name: 'Erin Holt',     email: 'erin@mckenziesewon.com',    role: 'Client Member', agency: false },
];

const CAMPAIGN_BY_ID = Object.fromEntries(CAMPAIGNS.map(c => [c.id, c]));

const STATUS_LABELS = {
  amber: 'Not yet closed',
  green: 'Order placed',
  red:   'Lost',
};

Object.assign(window, {
  CAMPAIGNS, CAMPAIGN_BY_ID, LEADS, AUDIT, SPARKS, USERS, STATUS_LABELS,
  daysAgo, fmtDate, fmtDateShort, fmtCurrency, fmtCurrencyFull,
});
