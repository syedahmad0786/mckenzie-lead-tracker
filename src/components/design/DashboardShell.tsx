"use client";
import Image from "next/image";
import { Settings as SettingsIcon, Download } from "lucide-react";

interface Props {
  clientName: string;
  logoUrl?: string | null;
  totalCount: number;
  filteredCount: number;
  filtersActive: boolean;
  onExportCsv: () => void;
  onOpenSettings: () => void;
  children: React.ReactNode;
}

export function DashboardShell({
  clientName,
  logoUrl,
  totalCount,
  filteredCount,
  filtersActive,
  onExportCsv,
  onOpenSettings,
  children,
}: Props) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-canvas-border bg-canvas-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image src={logoUrl} alt={clientName} width={140} height={40} unoptimized />
            ) : (
              <div className="w-9 h-9 bg-brand rounded-md" />
            )}
            <div className="hidden sm:block">
              <div className="text-sm text-ink-muted">Lead Tracker</div>
              <div className="font-semibold leading-tight">{clientName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted mr-2">
              {filtersActive
                ? `Showing ${filteredCount} of ${totalCount} total leads`
                : `${totalCount} leads`}
            </span>
            <button onClick={onExportCsv} className="btn-ghost"><Download size={14} /> Export CSV</button>
            <button onClick={onOpenSettings} className="btn-ghost"><SettingsIcon size={14} /></button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">{children}</main>
    </div>
  );
}
