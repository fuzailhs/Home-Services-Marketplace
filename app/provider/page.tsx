import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTimeShort } from "@/lib/format";
import { listProviderJobs } from "@/lib/requests";
import { CATEGORY_LABELS } from "@/lib/types";

export const metadata: Metadata = { title: "My jobs" };
export const dynamic = "force-dynamic";

const VIEWS = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

export default async function ProviderPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireUser("PROVIDER");
  const params = await searchParams;
  const view: ViewKey = VIEWS.some((entry) => entry.key === params.view)
    ? (params.view as ViewKey)
    : "open";

  const all = await listProviderJobs(user.id, "all");
  const counts = {
    open: all.filter((job) => job.status === "ASSIGNED" || job.status === "IN_PROGRESS").length,
    in_progress: all.filter((job) => job.status === "IN_PROGRESS").length,
    completed: all.filter((job) => job.status === "COMPLETED").length,
    all: all.length,
  };

  const jobs = all.filter((job) => {
    if (view === "open") return job.status === "ASSIGNED" || job.status === "IN_PROGRESS";
    if (view === "in_progress") return job.status === "IN_PROGRESS";
    if (view === "completed") return job.status === "COMPLETED";
    return true;
  });

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Provider</p>
          <h1 className="mt-3 text-4xl">My jobs</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            Only jobs assigned to you appear here. Update a job as you start and finish
            it so the office and the customer see the same status.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{user.fullName}</p>
          <p className="text-xs text-muted">
            {user.category ? `${CATEGORY_LABELS[user.category]} provider` : "Service provider"}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {VIEWS.map((entry) => {
          const active = view === entry.key;
          return (
            <Link
              key={entry.key}
              href={`/provider?view=${entry.key}`}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-brand bg-brand text-paper"
                  : "border-line-strong bg-white/60 text-ink-soft hover:border-brand"
              }`}
            >
              {entry.label}
              <span className={`ml-2 text-xs ${active ? "text-paper/70" : "text-muted"}`}>
                {counts[entry.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {jobs.length === 0 ? (
        <div className="card mt-6 px-6 py-16 text-center">
          <p className="font-display text-xl">Nothing in this view</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            {view === "open"
              ? "You have no open jobs right now. New assignments appear here as soon as the office schedules them."
              : "No jobs match this filter yet."}
          </p>
          <Link href="/provider?view=all" className="btn btn-outline btn-sm mt-5">
            See all jobs
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/provider/jobs/${job.reference}`}
                className="card group flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="mono text-[0.78rem] font-semibold text-brand">
                      {job.reference}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Received {formatDateTimeShort(job.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <h2 className="mt-4 text-xl">
                  {CATEGORY_LABELS[job.category]} · {job.serviceArea}
                </h2>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
                  {job.description}
                </p>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-4">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                      Scheduled
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {job.scheduledDate ? formatDate(job.scheduledDate) : "Not set"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                      Customer
                    </p>
                    <p className="mt-0.5 text-sm">{job.customerName}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
