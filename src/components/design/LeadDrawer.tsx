"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { DesignLead, LeadStatus } from "@/lib/types";
import { formatUSD, prettyStatus } from "@/lib/design-adapter";
import { CampaignChip } from "./CampaignChip";
import { StatusPill } from "./StatusPill";

interface Props {
  lead: DesignLead | null;
  onClose: () => void;
  onSaved: () => void;
  canSeeAudit: boolean;       // false for client_member if Ryan/Kody decide that way
}

export function LeadDrawer({ lead, onClose, onSaved, canSeeAudit }: Props) {
  const [draft, setDraft] = useState<{
    status: LeadStatus;
    dateFirstOrder: string | null;
    firstOrderAmount: number | null;
    notes: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setDraft({
        status: lead.status,
        dateFirstOrder: lead.dateFirstOrder,
        firstOrderAmount: lead.firstOrderAmount,
        notes: lead.notes,
      });
    } else {
      setDraft(null);
    }
  }, [lead]);

  if (!lead || !draft) return null;

  async function save() {
    if (!lead || !draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/leads/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ airtableId: lead.id, ...draft }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Failed to save");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/30" />
      <aside
        className="relative bg-canvas-card w-[480px] max-w-[90vw] h-full shadow-xl border-l border-canvas-border overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-canvas-border flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-ink-muted">{lead.email}</div>
            <h2 className="text-lg font-semibold mt-0.5">{lead.contactName}</h2>
            <div className="flex gap-2 mt-2">
              <CampaignChip name={lead.campaignName} />
              <StatusPill status={lead.status} />
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost"><X size={16} /></button>
        </header>

        <section className="p-5 grid gap-4">
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as LeadStatus })}
              className="border border-canvas-border rounded-md px-2 py-1.5 text-sm w-full"
            >
              <option value="not_yet_closed">{prettyStatus("not_yet_closed")}</option>
              <option value="order_placed">{prettyStatus("order_placed")}</option>
              <option value="lost">{prettyStatus("lost")}</option>
            </select>
          </Field>

          {draft.status === "order_placed" && (
            <>
              <Field label="Date First Order">
                <input
                  type="date"
                  value={draft.dateFirstOrder ?? ""}
                  onChange={(e) => setDraft({ ...draft, dateFirstOrder: e.target.value || null })}
                  className="border border-canvas-border rounded-md px-2 py-1.5 text-sm w-full"
                />
              </Field>
              <Field label="First Order Amount (USD)">
                <input
                  type="number"
                  min={0}
                  value={draft.firstOrderAmount ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      firstOrderAmount: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="border border-canvas-border rounded-md px-2 py-1.5 text-sm w-full"
                />
              </Field>
            </>
          )}

          <Field label="Notes">
            <textarea
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })}
              rows={3}
              className="border border-canvas-border rounded-md px-2 py-1.5 text-sm w-full"
            />
          </Field>

          {/* Payout — hidden in v1 per Ryan + Kody */}
          {lead.payoutVisible && (
            <Field label="Payout (auto-calculated)">
              <div className="text-sm font-medium">{formatUSD(lead.payoutAmount)}</div>
            </Field>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-pri">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </section>

        {canSeeAudit && (
          <section className="px-5 py-4 border-t border-canvas-border">
            <h3 className="text-xs uppercase tracking-wider text-ink-muted mb-3">Timeline</h3>
            <ol className="relative border-l border-canvas-border ml-2 space-y-3">
              {lead.timeline.map((e, i) => (
                <li key={i} className="ml-4">
                  <div className="absolute -left-[5px] mt-1 w-2.5 h-2.5 rounded-full bg-brand" />
                  <div className="text-sm font-medium">{e.label}</div>
                  <div className="text-xs text-ink-muted">{new Date(e.at).toLocaleString()}</div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
