import { formatDateTimeShort } from "@/lib/format";
import type { AuditEventRecord } from "@/lib/requests";

const ACTION_LABELS: Record<string, string> = {
  "request.created": "Request created",
  "request.provider_assigned": "Provider assigned",
  "request.status_changed": "Status changed",
  "request.note_added": "Internal note added",
  "request.cancelled": "Request cancelled",
};

/** FR-12: read-only audit trail. Each action has an actor and a timestamp. */
export function AuditList({
  events,
}: {
  events: (AuditEventRecord & { actorName: string | null })[];
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">No recorded actions.</p>;
  }

  return (
    <ul className="divide-y divide-line/80">
      {events.map((event) => (
        <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
          <div>
            <p className="text-sm font-medium">{ACTION_LABELS[event.action] ?? event.action}</p>
            <p className="text-xs text-muted">
              {event.detail} · {event.actorName ?? "System"}
            </p>
          </div>
          <time
            className="text-xs text-muted"
            dateTime={new Date(event.createdAt).toISOString()}
          >
            {formatDateTimeShort(event.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
