import { formatDateTimeShort } from "@/lib/format";
import { STATUS_LABELS, type Status } from "@/lib/types";

export interface TimelineEvent {
  id: string;
  toStatus: Status;
  publicText: string;
  createdAt: Date | string;
}

/**
 * Customer-safe history (FR-11). Only the status label, the public update text
 * and the timestamp are rendered — never staff names or internal notes.
 */
export function Timeline({
  events,
  compact = false,
}: {
  events: TimelineEvent[];
  compact?: boolean;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">No status updates yet.</p>;
  }

  return (
    <ol className="timeline">
      {events.map((event) => (
        <li key={event.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">{STATUS_LABELS[event.toStatus]}</p>
            <time
              className="text-xs text-muted"
              dateTime={new Date(event.createdAt).toISOString()}
            >
              {formatDateTimeShort(event.createdAt)}
            </time>
          </div>
          {!compact && (
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{event.publicText}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
