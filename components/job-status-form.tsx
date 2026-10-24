"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client-api";
import { STATUS_LABELS, type Status } from "@/lib/types";

export function JobStatusForm({
  reference,
  status,
  allowed,
}: {
  reference: string;
  status: Status;
  allowed: Status[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Status | null>(null);

  if (allowed.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        No further status changes are available for a request that is{" "}
        {STATUS_LABELS[status].toLowerCase()}.
      </p>
    );
  }

  async function moveTo(next: Status) {
    setError(null);
    setPending(next);

    const response = await sendJson<{ ok: boolean }>(
      `/api/requests/${encodeURIComponent(reference)}/status`,
      "PATCH",
      { status: next, expectedStatus: status, note },
    );
    setPending(null);

    if (!response.ok) {
      setError(response.message);
      return;
    }

    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-[#e6b8a9] bg-[#fdf0ea] px-3 py-2 text-xs font-medium text-[#8c3520]">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="status-note" className="label">
          Note for the office (optional)
        </label>
        <textarea
          id="status-note"
          className="textarea"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Parts needed, a delay, or what was completed."
        />
        <p className="hint">
          Notes are internal. Customers only see the status and the public update.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {allowed.map((next) => (
          <button
            key={next}
            type="button"
            className="btn btn-primary w-full"
            disabled={pending !== null}
            onClick={() => moveTo(next)}
          >
            {pending === next
              ? "Updating…"
              : next === "IN_PROGRESS"
                ? "Start job"
                : next === "COMPLETED"
                  ? "Mark completed"
                  : `Move to ${STATUS_LABELS[next]}`}
          </button>
        ))}
      </div>

      <p className="text-[0.7rem] leading-relaxed text-muted">
        Statuses only move forward: Assigned → In progress → Completed. If the request
        changed in another tab, you will be asked to reload.
      </p>
    </div>
  );
}
