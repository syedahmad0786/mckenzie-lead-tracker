"use client";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/design/DashboardShell";
import { FilterBar } from "@/components/design/FilterBar";
import { KpiTile } from "@/components/design/KpiTile";
import { LeadDrawer } from "@/components/design/LeadDrawer";
import { LeadTable } from "@/components/design/LeadTable";
import { formatUSD } from "@/lib/design-adapter";
import { DesignLead, ScoreboardKpis } from "@/lib/types";

interface PipelineResponse {
  clientId: string;
  totalLeads: number;
  leads: DesignLead[];
  kpis: ScoreboardKpis;
}

const CAMPAIGNS = [
  { id: "tourist-gift-shop",   name: "Tourist Gift Shop" },
  { id: "museum-donors",       name: "Museum Donors" },
  { id: "acquisitions",        name: "Acquisitions" },
  { id: "construction",        name: "Construction" },
  { id: "banks-credit-unions", name: "Banks & Credit Unions" },
  { id: "schools",             name: "Schools" },
];

export default function Page() {
  const [data, setData] = useState<PipelineResponse | null>(null);
  const [selCamps, setSelCamps] = useState<string[]>([]);
  const [selStatuses, setSelStatuses] = useState<string[]>([]);
  const [datePreset, setDatePreset] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<DesignLead | null>(null);

  async function load() {
    const params = new URLSearchParams();
    selCamps.forEach((c) => params.append("campaign", c));
    selStatuses.forEach((s) => params.append("status", s));
    if (search) params.set("q", search);
    const { from, to } = presetToDates(datePreset);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/leads/pipeline?${params}`);
    const json = (await res.json()) as PipelineResponse;
    setData(json);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20_000); // mirror onboarding's 20s poll
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selCamps.join(","), selStatuses.join(","), datePreset, search]);

  const filtersActive = useMemo(
    () => selCamps.length > 0 || selStatuses.length > 0 || !!search || datePreset !== "all",
    [selCamps, selStatuses, search, datePreset],
  );

  function exportCsv() {
    if (!data) return;
    const header = ["Contact", "Email", "Campaign", "Date Introduced", "Status", "Date First Order", "First Order Amount"];
    const rows = data.leads.map((l) => [
      l.contactName,
      l.email,
      l.campaignName,
      l.dateIntroduced,
      l.status,
      l.dateFirstOrder ?? "",
      l.firstOrderAmount ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mckenzie-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell
      clientName="McKenzie SewOn"
      logoUrl="http://www.mcsewon.com/wp-content/uploads/2016/03/mcsewon-LogoBlack-350x71.png"
      totalCount={data?.totalLeads ?? 0}
      filteredCount={data?.leads.length ?? 0}
      filtersActive={filtersActive}
      onExportCsv={exportCsv}
      onOpenSettings={() => alert("Settings panel — coming v1.1")}
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Leads Sent"        value={data?.kpis.leadsSent ?? 0} />
        <KpiTile label="Orders Closed"     value={data?.kpis.ordersClosed ?? 0} />
        <KpiTile label="Revenue Generated" value={formatUSD(data?.kpis.revenueGenerated ?? 0)} />
        <KpiTile label="Payout Owed"       value="" hidden hiddenLabel="Coming soon" />
      </section>

      <FilterBar
        campaigns={CAMPAIGNS}
        selectedCampaigns={selCamps}
        setSelectedCampaigns={setSelCamps}
        selectedStatuses={selStatuses}
        setSelectedStatuses={setSelStatuses}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        search={search}
        setSearch={setSearch}
      />

      <LeadTable leads={data?.leads ?? []} onOpen={setOpen} />

      <LeadDrawer
        lead={open}
        onClose={() => setOpen(null)}
        onSaved={() => load()}
        canSeeAudit={true /* TODO: gate on user role once auth lands */}
      />
    </DashboardShell>
  );
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function presetToDates(p: "7d" | "30d" | "90d" | "all"): { from?: string; to?: string } {
  if (p === "all") return {};
  const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
