"use client";
import { DesignLead } from "@/lib/types";
import { formatUSD } from "@/lib/design-adapter";
import { CampaignChip } from "./CampaignChip";
import { StatusPill } from "./StatusPill";
import { StickyNote } from "lucide-react";

interface Props {
  leads: DesignLead[];
  onOpen: (lead: DesignLead) => void;
}

export function LeadTable({ leads, onOpen }: Props) {
  if (!leads.length) return <Empty />;
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-canvas border-b border-canvas-border text-ink-muted">
          <tr>
            <Th>Contact</Th>
            <Th>Email</Th>
            <Th>Campaign</Th>
            <Th>Date Introduced</Th>
            <Th>Status</Th>
            <Th>Date First Order</Th>
            <Th align="right">First Order Amount</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr
              key={l.id}
              onClick={() => onOpen(l)}
              className="border-b border-canvas-border last:border-0 hover:bg-brand/5 cursor-pointer transition-colors"
            >
              <Td className="font-medium">{l.contactName}</Td>
              <Td className="text-ink-subtle">{l.email}</Td>
              <Td><CampaignChip name={l.campaignName} /></Td>
              <Td>{formatDate(l.dateIntroduced)}</Td>
              <Td><StatusPill status={l.status} /></Td>
              <Td>{l.dateFirstOrder ? formatDate(l.dateFirstOrder) : <Dim />}</Td>
              <Td align="right">{l.firstOrderAmount != null ? formatUSD(l.firstOrderAmount) : <Dim />}</Td>
              <Td>{l.notes ? <StickyNote size={14} className="text-ink-muted" /> : null}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return <th className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-${align}`}>{children}</th>;
}
function Td({ children, className = "", align = "left" }: { children?: React.ReactNode; className?: string; align?: "left" | "right" }) {
  return <td className={`px-4 py-3 text-${align} ${className}`}>{children}</td>;
}
function Dim() { return <span className="text-ink-muted">—</span>; }
function Empty() {
  return (
    <div className="card p-12 text-center">
      <div className="text-4xl mb-2">📭</div>
      <div className="font-medium">No leads yet</div>
      <div className="text-sm text-ink-muted mt-1">Your first qualified handoff will appear here.</div>
    </div>
  );
}
function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
