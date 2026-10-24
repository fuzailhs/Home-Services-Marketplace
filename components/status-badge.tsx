import { STATUS_LABELS, type Status } from "@/lib/types";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="badge" data-status={status}>
      {STATUS_LABELS[status]}
    </span>
  );
}
