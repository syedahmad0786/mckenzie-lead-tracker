"use client";
import { Search } from "lucide-react";

interface Campaign { id: string; name: string }
type DatePreset = "7d" | "30d" | "90d" | "all";
const STATUSES = [
  { id: "order_placed",   label: "Order Placed" },
  { id: "not_yet_closed", label: "Not Yet Closed" },
  { id: "lost",           label: "Lost" },
] as const;

interface Props {
  campaigns: Campaign[];
  selectedCampaigns: string[];
  setSelectedCampaigns: (ids: string[]) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (ids: string[]) => void;
  datePreset: DatePreset;
  setDatePreset: (p: DatePreset) => void;
  search: string;
  setSearch: (s: string) => void;
}

export function FilterBar(p: Props) {
  return (
    <div className="card p-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-md border border-canvas-border bg-canvas">
        <Search size={14} className="text-ink-muted" />
        <input
          value={p.search}
          onChange={(e) => p.setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="bg-transparent outline-none text-sm w-56"
        />
      </div>

      <Divider />

      {(["7d", "30d", "90d", "all"] as const).map((d) => (
        <button
          key={d}
          onClick={() => p.setDatePreset(d)}
          className={
            "btn-ghost text-xs " +
            (p.datePreset === d ? "bg-brand/10 text-brand" : "")
          }
        >
          {d === "all" ? "All time" : d.toUpperCase()}
        </button>
      ))}

      <Divider />

      <MultiChip
        label="Campaign"
        items={p.campaigns}
        selected={p.selectedCampaigns}
        onToggle={(id) =>
          p.setSelectedCampaigns(
            p.selectedCampaigns.includes(id)
              ? p.selectedCampaigns.filter((x) => x !== id)
              : [...p.selectedCampaigns, id],
          )
        }
      />

      <MultiChip
        label="Status"
        items={STATUSES.map((s) => ({ id: s.id, name: s.label }))}
        selected={p.selectedStatuses}
        onToggle={(id) =>
          p.setSelectedStatuses(
            p.selectedStatuses.includes(id)
              ? p.selectedStatuses.filter((x) => x !== id)
              : [...p.selectedStatuses, id],
          )
        }
      />
    </div>
  );
}

function Divider() { return <span className="w-px h-5 bg-canvas-border" />; }

function MultiChip({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-ink-muted mr-0.5">{label}:</span>
      {items.map((it) => {
        const active = selected.includes(it.id);
        return (
          <button
            key={it.id}
            onClick={() => onToggle(it.id)}
            className={
              "chip " +
              (active
                ? "border-brand text-brand bg-brand/10"
                : "border-canvas-border text-ink-subtle")
            }
          >
            {it.name}
          </button>
        );
      })}
    </div>
  );
}
