"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client-api";
import { CATEGORY_LABELS, STATUS_LABELS, type Status } from "@/lib/types";
import type { FieldErrors } from "@/lib/validation";

interface ProviderOption {
  id: string;
  fullName: string;
  category: string | null;
}

export function AssignForm({
  reference,
  status,
  providers,
  currentProviderId,
  currentScheduledDate,
  minDate,
}: {
  reference: string;
  status: Status;
  providers: ProviderOption[];
  currentProviderId: string | null;
  currentScheduledDate: string | null;
  minDate: string;
}) {
  const router = useRouter();
  const [providerId, setProviderId] = useState(currentProviderId ?? providers[0]?.id ?? "");
  const [scheduledDate, setScheduledDate] = useState(
    currentScheduledDate ?? minDate,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const assignable = status === "NEW" || status === "ASSIGNED";

  if (!assignable) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        This request is {STATUS_LABELS[status].toLowerCase()} and can no longer be
        reassigned. Assignment is only available while a request is new or assigned.
      </p>
    );
  }

  if (providers.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted">
        There are no active providers to assign. Activate a provider account first.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setErrors({});

    if (!providerId) {
      setErrors({ providerId: "Choose a provider." });
      return;
    }
    if (!scheduledDate) {
      setErrors({ scheduledDate: "Choose the visit date." });
      return;
    }

    setSubmitting(true);
    const response = await sendJson<{ ok: boolean }>(
      `/api/requests/${encodeURIComponent(reference)}/assign`,
      "PATCH",
      { providerId, scheduledDate, expectedStatus: status },
    );
    setSubmitting(false);

    if (!response.ok) {
      setErrors(response.fieldErrors);
      setError(response.message);
      return;
    }

    setMessage("Assignment saved.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <p role="alert" className="rounded-lg border border-[#e6b8a9] bg-[#fdf0ea] px-3 py-2 text-xs font-medium text-[#8c3520]">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-lg border border-[#c2ded7] bg-brand-soft px-3 py-2 text-xs font-medium text-brand">
          {message}
        </p>
      )}

      <div>
        <label htmlFor="providerId" className="label">
          Provider
        </label>
        <select
          id="providerId"
          className="select"
          value={providerId}
          onChange={(event) => setProviderId(event.target.value)}
          aria-invalid={Boolean(errors.providerId)}
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.fullName}
              {provider.category ? ` · ${CATEGORY_LABELS[provider.category as keyof typeof CATEGORY_LABELS]}` : ""}
            </option>
          ))}
        </select>
        {errors.providerId && <p className="error-text" role="alert">{errors.providerId}</p>}
      </div>

      <div>
        <label htmlFor="scheduledDate" className="label">
          Visit date
        </label>
        <input
          id="scheduledDate"
          type="date"
          className="input"
          min={minDate}
          value={scheduledDate}
          onChange={(event) => setScheduledDate(event.target.value)}
          aria-invalid={Boolean(errors.scheduledDate)}
        />
        {errors.scheduledDate && (
          <p className="error-text" role="alert">{errors.scheduledDate}</p>
        )}
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
        {submitting ? "Saving…" : status === "NEW" ? "Assign provider" : "Update assignment"}
      </button>
      <p className="text-[0.7rem] leading-relaxed text-muted">
        Only active providers appear here. Saving moves the request to Assigned and
        adds a timestamped event to the history.
      </p>
    </form>
  );
}
