"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client-api";

export function CancelRequestButton({
  reference,
  status,
}: {
  reference: string;
  status: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function cancel() {
    const confirmed = window.confirm(
      "Cancel this request? The customer will see a cancelled status and the action is recorded in the audit trail.",
    );
    if (!confirmed) return;

    setError(null);
    setSubmitting(true);
    const response = await sendJson<{ ok: boolean }>(
      `/api/requests/${encodeURIComponent(reference)}/status`,
      "PATCH",
      { status: "CANCELLED", expectedStatus: status },
    );
    setSubmitting(false);

    if (!response.ok) {
      setError(response.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-outline btn-sm w-full border-[#d9b3a5] text-[#8c3520] hover:border-[#b3402c] hover:bg-[#fdf0ea]"
        onClick={cancel}
        disabled={submitting}
      >
        {submitting ? "Cancelling…" : "Cancel request"}
      </button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <p className="mt-2 text-[0.7rem] leading-relaxed text-muted">
        Only new or assigned requests can be cancelled, and the cancellation is logged.
      </p>
    </div>
  );
}
