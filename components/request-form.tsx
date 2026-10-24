"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { sendJson } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import {
  CATEGORIES,
  CATEGORY_BLURBS,
  CATEGORY_LABELS,
  type Category,
} from "@/lib/types";
import {
  requestInputSchema,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation";

interface SuccessPayload {
  request: {
    reference: string;
    category: Category;
    preferredDate: string;
    email: string;
  };
}

const FIELD_ORDER = [
  "customerName",
  "email",
  "phone",
  "serviceArea",
  "category",
  "preferredDate",
  "description",
] as const;

function describedBy(id: string, hasHint: boolean, hasError: boolean) {
  const ids: string[] = [];
  if (hasHint) ids.push(`${id}-hint`);
  if (hasError) ids.push(`${id}-error`);
  return ids.length ? ids.join(" ") : undefined;
}

export function RequestForm({
  minDate,
  initialCategory,
}: {
  minDate: string;
  initialCategory?: Category;
}) {
  const [category, setCategory] = useState<Category>(initialCategory ?? "PLUMBING");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SuccessPayload["request"] | null>(null);
  const [copied, setCopied] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  function clearError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function focusFirstError(fieldErrors: FieldErrors) {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (!first) return;
    const element = document.getElementById(first);
    element?.focus();
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setCopied(false);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      customerName: String(data.get("customerName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      serviceArea: String(data.get("serviceArea") ?? ""),
      category,
      preferredDate: String(data.get("preferredDate") ?? ""),
      description: String(data.get("description") ?? ""),
    };

    const parsed = requestInputSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      setErrors(fieldErrors);
      setFormError("Check the highlighted fields and try again.");
      focusFirstError(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const response = await sendJson<SuccessPayload>("/api/requests", "POST", payload);
    setSubmitting(false);

    if (!response.ok) {
      setErrors(response.fieldErrors);
      setFormError(response.message);
      focusFirstError(response.fieldErrors);
      return;
    }

    setResult(response.data.request);
    form.reset();
    setDescription("");
  }

  async function copyReference() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.reference);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (result) {
    return (
      <div className="card card-shadow p-7 sm:p-9" aria-live="polite">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <CheckIcon className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-3xl">Request received</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
          Your request is saved and waiting for the office to review it. Keep this
          reference number — it is all you need to check progress, together with the
          email address you used.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-paper px-5 py-4">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Your reference
            </p>
            <p className="mono mt-1 text-2xl font-semibold tracking-[0.08em]">
              {result.reference}
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={copyReference}>
            <CopyIcon className="h-4 w-4" />
            {copied ? "Copied" : "Copy reference"}
          </button>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">Service</dt>
            <dd className="mt-1 text-sm font-medium">{CATEGORY_LABELS[result.category]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">
              Preferred date
            </dt>
            <dd className="mt-1 text-sm font-medium">{formatDate(result.preferredDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">Confirmation to</dt>
            <dd className="mt-1 truncate text-sm font-medium">{result.email}</dd>
          </div>
        </dl>

        <div className="mt-7 rounded-xl bg-brand-soft/60 p-5">
          <p className="text-sm font-semibold">What happens next</p>
          <ol className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>1. The office checks the details and confirms the appointment.</li>
            <li>2. A provider is assigned and the status changes to Assigned.</li>
            <li>3. You can check the latest status at any time with your reference.</li>
          </ol>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/lookup?reference=${encodeURIComponent(result.reference)}`}
            className="btn btn-primary"
          >
            Check this request
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setResult(null);
              setFormKey((key) => key + 1);
            }}
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      key={formKey}
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="card card-shadow p-6 sm:p-8"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl">Tell us about the job</h2>
        <span className="text-xs text-muted">* required</span>
      </div>

      {formError && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-[#e6b8a9] bg-[#fdf0ea] px-4 py-3 text-sm font-medium text-[#8c3520]"
        >
          {formError}
        </p>
      )}

      <fieldset className="mt-6">
        <legend className="label">
          What do you need? <span className="text-accent">*</span>
        </legend>
        <div className="mt-1 grid gap-3 sm:grid-cols-3">
          {CATEGORIES.map((option) => {
            const active = category === option;
            return (
              <label
                key={option}
                className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                  active
                    ? "border-brand bg-brand-soft/70 ring-1 ring-brand"
                    : "border-line-strong bg-white/60 hover:border-brand/50"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={option}
                  checked={active}
                  onChange={() => {
                    setCategory(option);
                    clearError("category");
                  }}
                  className="sr-only"
                />
                <span className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{CATEGORY_LABELS[option]}</span>
                  <span
                    aria-hidden
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      active ? "border-brand bg-brand text-white" : "border-line-strong"
                    }`}
                  >
                    {active && <CheckIcon className="h-3 w-3" />}
                  </span>
                </span>
                <span className="mt-1.5 text-xs leading-relaxed text-muted">
                  {CATEGORY_BLURBS[option]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="customerName" className="label">
            Full name <span className="text-accent">*</span>
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            autoComplete="name"
            className="input"
            aria-invalid={Boolean(errors.customerName)}
            aria-describedby={describedBy("customerName", false, Boolean(errors.customerName))}
            onChange={() => clearError("customerName")}
          />
          {errors.customerName && (
            <p id="customerName-error" className="error-text" role="alert">
              {errors.customerName}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email <span className="text-accent">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="input"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email", true, Boolean(errors.email))}
            onChange={() => clearError("email")}
          />
          <p id="email-hint" className="hint">
            Used to confirm the appointment and to check status later.
          </p>
          {errors.email && (
            <p id="email-error" className="error-text" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Phone <span className="text-accent">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="input"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy("phone", true, Boolean(errors.phone))}
            onChange={() => clearError("phone")}
          />
          <p id="phone-hint" className="hint">
            Only used to arrange this visit.
          </p>
          {errors.phone && (
            <p id="phone-error" className="error-text" role="alert">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="serviceArea" className="label">
            Area or postcode <span className="text-accent">*</span>
          </label>
          <input
            id="serviceArea"
            name="serviceArea"
            type="text"
            autoComplete="address-level2"
            className="input"
            aria-invalid={Boolean(errors.serviceArea)}
            aria-describedby={describedBy("serviceArea", false, Boolean(errors.serviceArea))}
            onChange={() => clearError("serviceArea")}
          />
          {errors.serviceArea && (
            <p id="serviceArea-error" className="error-text" role="alert">
              {errors.serviceArea}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="preferredDate" className="label">
            Preferred date <span className="text-accent">*</span>
          </label>
          <input
            id="preferredDate"
            name="preferredDate"
            type="date"
            min={minDate}
            className="input"
            aria-invalid={Boolean(errors.preferredDate)}
            aria-describedby={describedBy("preferredDate", true, Boolean(errors.preferredDate))}
            onChange={() => clearError("preferredDate")}
          />
          <p id="preferredDate-hint" className="hint">
            The office confirms the final date and time with you.
          </p>
          {errors.preferredDate && (
            <p id="preferredDate-error" className="error-text" role="alert">
              {errors.preferredDate}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">
            What is happening? <span className="text-accent">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            className="textarea"
            rows={5}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearError("description");
            }}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("description", true, Boolean(errors.description))}
            placeholder="For example: the kitchen tap is dripping under the sink and the cupboard floor is getting wet."
          />
          <div className="flex items-start justify-between gap-4">
            <p id="description-hint" className="hint">
              Include what is wrong, where it is, and anything a tradesperson should know.
            </p>
            <span
              className={`hint tabular-nums ${
                description.length > 500 ? "text-[#a63a26]" : ""
              }`}
            >
              {description.length}/500
            </span>
          </div>
          {errors.description && (
            <p id="description-error" className="error-text" role="alert">
              {errors.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Sending…" : "Send request"}
        </button>
        <p className="text-xs text-muted">
          You will get a reference number straight away. No account needed.
        </p>
      </div>
    </form>
  );
}
