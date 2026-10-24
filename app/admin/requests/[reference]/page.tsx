import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignForm } from "@/components/assign-form";
import { AuditList } from "@/components/audit-list";
import { CancelRequestButton } from "@/components/cancel-request-button";
import { NoteForm } from "@/components/note-form";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { getRequestForStaff, listActiveProviders } from "@/lib/requests";
import { todayIso } from "@/lib/today";
import { CATEGORY_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: `${reference} · Request detail` };
}

export default async function AdminRequestPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const user = await requireUser("ADMIN");
  const { reference } = await params;

  let detail;
  try {
    detail = await getRequestForStaff(reference, user);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  const providers = await listActiveProviders();

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/admin" className="hover:text-brand">
          Request queue
        </Link>
        <span className="mx-2">/</span>
        <span className="mono">{detail.reference}</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl sm:text-4xl">
              {CATEGORY_LABELS[detail.category]} request
            </h1>
            <StatusBadge status={detail.status} />
          </div>
          <p className="mono mt-2 text-sm text-muted">{detail.reference}</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {detail.description}
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>Received {formatDateTime(detail.createdAt)}</p>
          <p className="mt-1">Last updated {formatDateTime(detail.updatedAt)}</p>
        </div>
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="details-heading">
            <h2 id="details-heading" className="text-lg">
              Request details
            </h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Customer
                </dt>
                <dd className="mt-1 text-sm font-medium">{detail.customerName}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Email
                </dt>
                <dd className="mt-1 break-all text-sm font-medium">{detail.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-sm font-medium">{detail.customerPhone}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Area
                </dt>
                <dd className="mt-1 text-sm font-medium">{detail.serviceArea}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Preferred date
                </dt>
                <dd className="mt-1 text-sm font-medium">{formatDate(detail.preferredDate)}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Scheduled visit
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {detail.scheduledDate ? formatDate(detail.scheduledDate) : "Not scheduled"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-6" aria-labelledby="notes-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="notes-heading" className="text-lg">
                Internal notes
              </h2>
              <span className="badge border-line bg-paper text-muted">Staff only</span>
            </div>
            <NoteForm reference={detail.reference} />

            <div className="mt-6 border-t border-line pt-4">
              {detail.notes.length === 0 ? (
                <p className="text-sm text-muted">
                  No internal notes yet. Notes never appear in the customer lookup.
                </p>
              ) : (
                <ul className="space-y-4">
                  {detail.notes.map((note) => (
                    <li key={note.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">{note.authorName}</p>
                        <time
                          className="text-xs text-muted"
                          dateTime={new Date(note.createdAt).toISOString()}
                        >
                          {formatDateTime(note.createdAt)}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                        {note.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="card p-6" aria-labelledby="history-heading">
            <h2 id="history-heading" className="text-lg">
              Status history
            </h2>
            <p className="mt-1 text-xs text-muted">
              This is the customer-safe timeline. Staff names are not shown to the
              customer.
            </p>
            <div className="mt-5">
              <Timeline events={detail.events} />
            </div>
          </section>

          <section className="card p-6" aria-labelledby="audit-heading">
            <h2 id="audit-heading" className="text-lg">
              Audit trail
            </h2>
            <p className="mt-1 text-xs text-muted">
              Read-only. Each tracked action records who did it and when.
            </p>
            <div className="mt-4">
              <AuditList events={detail.audit} />
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="card p-6" aria-labelledby="assign-heading">
            <h2 id="assign-heading" className="text-lg">
              Assignment
            </h2>

            <dl className="mt-4 space-y-3 border-b border-line pb-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd>
                  <StatusBadge status={detail.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Provider</dt>
                <dd className="text-right font-medium">
                  {detail.provider ? detail.provider.fullName : "Not assigned"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Visit date</dt>
                <dd className="text-right font-medium">
                  {detail.scheduledDate ? formatDate(detail.scheduledDate) : "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <AssignForm
                reference={detail.reference}
                status={detail.status}
                providers={providers.map((provider) => ({
                  id: provider.id,
                  fullName: provider.fullName,
                  category: provider.category,
                }))}
                currentProviderId={detail.providerId}
                currentScheduledDate={detail.scheduledDate}
                minDate={todayIso()}
              />
            </div>
          </section>

          {(detail.status === "NEW" || detail.status === "ASSIGNED") && (
            <section className="card p-6" aria-labelledby="actions-heading">
              <h2 id="actions-heading" className="text-lg">
                Other actions
              </h2>
              <div className="mt-4">
                <CancelRequestButton reference={detail.reference} status={detail.status} />
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
