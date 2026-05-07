import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  delta?: { pct: number; direction: "up" | "down" | "flat" } | null;
  sparkline?: number[];
  hidden?: boolean;
  hiddenLabel?: string;
}

export function KpiTile({ label, value, delta, sparkline, hidden, hiddenLabel = "Coming soon" }: Props) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="text-xs uppercase tracking-wider text-ink-muted">{label}</div>
      {hidden ? (
        <div className="text-2xl font-medium text-ink-muted">{hiddenLabel}</div>
      ) : (
        <>
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
          <div className="flex items-center justify-between">
            {delta ? (
              <span
                className={
                  "text-xs font-medium " +
                  (delta.direction === "up"
                    ? "text-status-placed"
                    : delta.direction === "down"
                    ? "text-status-lost"
                    : "text-ink-muted")
                }
              >
                {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—"} {Math.abs(delta.pct)}%
              </span>
            ) : <span />}
            {sparkline && <Spark data={sparkline} />}
          </div>
        </>
      )}
    </div>
  );
}

function Spark({ data }: { data: number[] }) {
  if (!data.length) return null;
  const w = 80, h = 24;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => `${(i * w) / (data.length - 1 || 1)},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand" />
      <polygon points={`0,${h} ${points} ${w},${h}`} className="fill-brand/15" />
    </svg>
  );
}
