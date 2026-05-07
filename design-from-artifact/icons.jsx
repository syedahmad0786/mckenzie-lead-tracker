// icons.jsx — Inline SVG icons (Lucide-style, 1.5px stroke).
// Inline rather than CDN to avoid CDN drift / racing the React render.

const _Svg = ({ children, size = 16, className = '', ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className={className}
    {...rest}
  >{children}</svg>
);

const Icons = {
  Search:   (p) => <_Svg {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></_Svg>,
  Plus:     (p) => <_Svg {...p}><path d="M12 5v14M5 12h14"/></_Svg>,
  X:        (p) => <_Svg {...p}><path d="M18 6 6 18M6 6l12 12"/></_Svg>,
  Check:    (p) => <_Svg {...p}><path d="M20 6 9 17l-5-5"/></_Svg>,
  ChevronDown: (p) => <_Svg {...p}><path d="m6 9 6 6 6-6"/></_Svg>,
  ChevronRight: (p) => <_Svg {...p}><path d="m9 18 6-6-6-6"/></_Svg>,
  ChevronLeft: (p) => <_Svg {...p}><path d="m15 18-6-6 6-6"/></_Svg>,
  ArrowUp:   (p) => <_Svg {...p}><path d="M12 19V5M5 12l7-7 7 7"/></_Svg>,
  ArrowDown: (p) => <_Svg {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></_Svg>,
  ArrowRight:(p) => <_Svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></_Svg>,
  Settings: (p) => <_Svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.27 7.18l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></_Svg>,
  Download: (p) => <_Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></_Svg>,
  Filter:   (p) => <_Svg {...p}><path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/></_Svg>,
  Calendar: (p) => <_Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></_Svg>,
  Inbox:    (p) => <_Svg {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></_Svg>,
  FileText: (p) => <_Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></_Svg>,
  MessageSquare: (p) => <_Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></_Svg>,
  Users:    (p) => <_Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></_Svg>,
  TrendingUp: (p) => <_Svg {...p}><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></_Svg>,
  Info:     (p) => <_Svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></_Svg>,
  MoreH:    (p) => <_Svg {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></_Svg>,
  Mail:     (p) => <_Svg {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></_Svg>,
  Lock:     (p) => <_Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></_Svg>,
  Sparkles: (p) => <_Svg {...p}><path d="M12 3l1.9 4.1L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.9L12 3zM19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM5 16l.7 1.5L7 18l-1.3.5L5 20l-.7-1.5L3 18l1.3-.5L5 16z"/></_Svg>,
  LogOut:   (p) => <_Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></_Svg>,
  CircleDot:(p) => <_Svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></_Svg>,
  Building: (p) => <_Svg {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></_Svg>,
  Tag:      (p) => <_Svg {...p}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/></_Svg>,
  Edit:     (p) => <_Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></_Svg>,
  Trash:    (p) => <_Svg {...p}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></_Svg>,
  Zap:      (p) => <_Svg {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></_Svg>,
  Eye:      (p) => <_Svg {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></_Svg>,
  Palette:  (p) => <_Svg {...p}><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.4a2.5 2.5 0 0 1-.4-1.4c0-1.1.9-2 2-2h2.4c2.5 0 4.6-2.1 4.6-4.6V12c0-5.5-4.5-10-10-10z"/></_Svg>,
};

window.Icons = Icons;
