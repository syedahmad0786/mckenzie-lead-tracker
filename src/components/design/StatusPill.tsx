import { LeadStatus } from "@/lib/types";

const styles: Record<LeadStatus, string> = {
  order_placed:   "bg-status-placed/10 text-status-placed border-status-placed/30",
  not_yet_closed: "bg-status-pending/10 text-status-pending border-status-pending/30",
  lost:           "bg-status-lost/10 text-status-lost border-status-lost/30",
};

const labels: Record<LeadStatus, string> = {
  order_placed:   "Order Placed",
  not_yet_closed: "Not Yet Closed",
  lost:           "Lost",
};

export function StatusPill({ status }: { status: LeadStatus }) {
  return <span className={`pill border ${styles[status]}`}>{labels[status]}</span>;
}
