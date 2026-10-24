"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { sendJson } from "@/lib/client-api";
import { formatDate, formatDateTimeShort } from "@/lib/format";
import {
  CATEGORY_LABELS,
  STATUS_CUSTOMER_TEXT,
  type Category,
  type Status,
} from "@/lib/types";
import { lookupSchema, toFieldErrors, type FieldErrors } from "@/lib/validation";

interface LookupPayload {
  request: {
    reference: string;
    category: Category;
    status: Status;
    serviceArea: string;
    description: string;
    preferredDate: string;
    scheduledDate: string | null;
    createdAt: string;
    updatedAt: string;
  };
  events: {
    id: string;
    toStatus: Status;
    publicText: string;
    createdAt: string;
  }[];
}

export function LookupForm({ initialReference = "" }: { initialReference?: string }) {
  const [reference, setReference] = useState(initialReference);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LookupPayload | null>(null);

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const payload = { reference, email };
    const parsed = lookupSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      setErrors(fieldErrors);
      setFormError("Check the highlighted fields and try again.");
      document.getElementById(fieldErrors.reference ? "reference" : "email")?.focus();
      return;
    }

    setErrors({});
    setSubmitting(true);
    const response = await sendJson<LookupPayload>(
      "/api/requests/lookup",
      "POST",
      parsed.data,
    );
    setSubmitting(false);

    if (!response.ok) {
      setErrors(response.fieldErrors);
      setFormError(response.message);
      setResult(null);
      return;
    }

    setResult(response.data);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} noValidate className="card card-shadow p-6 sm:p-8">
        <h2 className="text-2xl">Look up your request</h2>
        <p className="mt-1.5 text-sm text-muted">
          Enter the reference we gave you and the email address on the request.
        </p>

        {formError && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-[#e6b8a9] bg-[#fdf0ea] px-4 py-3 text-sm font-medium text-[#8c3520]"
          >
            {formError}
          </p>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr]">
          <div>
            <label htmlFor="reference" className="label">
              Reference number
            </label>
            <input
              id="reference"
              name="reference"
              type="text"
              className="input mono uppercase"
              placeholder="HSM-ABCD-2345"
              autoComplete="off"
              spellCheck={false}
              value={reference}
              onChange={(event) => {
                setReference(event.target.value.toUpperCase());
                clearError("reference");
              }}
              aria-invalid={Boolean(errors.reference)}
              aria-describedby={errors.reference ? "reference-error" : "reference-hint"}
            />
            <p id="reference-hint" className="hint">
              It looks like HSM-ABCD-2345.
            </p>
            {errors.reference && (
              <p id="reference-error" className="error-text" role="alert">
                {errors.reference}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email on the request
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError("email");
              }}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="error-text" role="alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Checking…" : "Check status"}
          </button>
          <p className="text-xs text-muted">
            Both values must match the original request.
          </p>
        </div>
      </form>

      <div aria-live="polite">
        {result && (
          <div className="card card-shadow overflow-hidden">
            <div className="border-b border-line bg-paper-deep/50 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted">
                    Reference
                  </p>
                  <p className="mono mt-1 text-xl font-semibold">{result.request.reference}</p>
                </div>
                <StatusBadge status={result.request.status} />
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl">
                {CATEGORY_LABELS[result.request.category]} request
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {STATUS_CUSTOMER_TEXT[result.request.status]}
              </p>

              <dl className="mt-6 grid gap-5 border-y border-line py-5 sm:grid-cols-4">
                <div>
                  <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                    Preferred date
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDate(result.request.preferredDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                    Scheduled visit
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {result.request.scheduledDate
                      ? formatDate(result.request.scheduledDate)
                      : "Not scheduled yet"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                    Area
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{result.request.serviceArea}</dd>
                </div>
                <div>
                  <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                    Last updated
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDateTimeShort(result.request.updatedAt)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">
                  Your request
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {result.request.description}
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">
                  Progress
                </h3>
                <div className="mt-4">
                  <Timeline events={result.events} />
                </div>
              </div>

              <p className="mt-8 rounded-lg bg-paper px-4 py-3 text-xs leading-relaxed text-muted">
                This is the customer view. Internal staff notes and staff names are
                never shown here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
