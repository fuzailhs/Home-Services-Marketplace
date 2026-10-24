import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuditList } from "@/components/audit-list";
import { JobStatusForm } from "@/components/job-status-form";
import { NoteForm } from "@/components/note-form";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { getRequestForStaff } from "@/lib/requests";
import { nextStatusesFor } from "@/lib/transitions";
import { CATEGORY_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: `${reference} · Job` };
}

export default async function ProviderJobPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const user = await requireUser("PROVIDER");
  const { reference } = await params;

  let job;
  try {
    job = await getRequestForStaff(reference, user);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }

  const allowed = nextStatusesFor(job.status, "PROVIDER");

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/provider" className="hover:text-brand">
          My jobs
        </Link>
        <span className="mx-2">/</span>
        <span className="mono">{job.reference}</span>
      </nav>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl sm:text-4xl">
              {CATEGORY_LABELS[job.category]} · {job.serviceArea}
            </h1>
            <StatusBadge status={job.status} />
          </div>
          <p className="mono mt-2 text-sm text-muted">{job.reference}</p>
        </div>
        <div className="text-right text-xs text-muted">
          <p>Scheduled {job.scheduledDate ? formatDate(job.scheduledDate) : "not set"}</p>
          <p className="mt-1">Updated {formatDateTime(job.updatedAt)}</p>
        </div>
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="card p-6" aria-labelledby="job-heading">
            <h2 id="job-heading" className="text-lg">
              Job details
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {job.description}
            </p>
            <dl className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Customer
                </dt>
                <dd className="mt-1 text-sm font-medium">{job.customerName}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-sm font-medium">{job.customerPhone}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Email
                </dt>
                <dd className="mt-1 break-all text-sm font-medium">{job.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] uppercase tracking-[0.12em] text-muted">
                  Preferred date
                </dt>
                <dd className="mt-1 text-sm font-medium">{formatDate(job.preferredDate)}</dd>
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
            <NoteForm reference={job.reference} />
            <div className="mt-6 border-t border-line pt-4">
              {job.notes.length === 0 ? (
                <p className="text-sm text-muted">No notes yet.</p>
              ) : (
                <ul className="space-y-4">
                  {job.notes.map((note) => (
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
            <div className="mt-4">
              <Timeline events={job.events} />
            </div>
          </section>

          <section className="card p-6" aria-labelledby="audit-heading">
            <h2 id="audit-heading" className="text-lg">
              Audit trail
            </h2>
            <div className="mt-4">
              <AuditList events={job.audit} />
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <section className="card p-6" aria-labelledby="status-heading">
            <h2 id="status-heading" className="text-lg">
              Update status
            </h2>
            <p className="mt-1 text-xs text-muted">
              Current status: {job.status.replace("_", " ").toLowerCase()}
            </p>
            <div className="mt-5">
              <JobStatusForm reference={job.reference} status={job.status} allowed={allowed} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
