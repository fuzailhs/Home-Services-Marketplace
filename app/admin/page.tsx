import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTimeShort } from "@/lib/format";
import { countRequestsByStatus, listRequests, type QueueFilters } from "@/lib/requests";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUSES,
  STATUS_LABELS,
  isCategory,
  isStatus,
  type Status,
} from "@/lib/types";

export const metadata: Metadata = { title: "Request queue" };
export const dynamic = "force-dynamic";

function filtersFromParams(params: Record<string, string | undefined>): QueueFilters {
  return {
    category: isCategory(params.category) ? params.category : undefined,
    status: isStatus(params.status) ? params.status : undefined,
    view: params.view === "all" ? "all" : "open",
    sort: params.sort === "preferred" ? "preferred" : "newest",
  };
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser("ADMIN");
  const params = await searchParams;
  const filters = filtersFromParams(params);

  const [rows, counts] = await Promise.all([
    listRequests(filters),
    countRequestsByStatus(),
  ]);

  const openTotal = counts.NEW + counts.ASSIGNED + counts.IN_PROGRESS;

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Administrator</p>
          <h1 className="mt-3 text-4xl">Request queue</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
            Newest first. Review the details, assign an active provider, and keep
            internal notes out of the customer view.
          </p>
        </div>
        <p className="text-xs text-muted">
          Signed in as <span className="font-semibold text-ink">{user.fullName}</span>
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map((status) => {
          const active = filters.status === status;
          return (
            <Link
              key={status}
              href={`/admin?status=${status}`}
              className={`rounded-xl border px-4 py-3 transition ${
                active
                  ? "border-brand bg-brand text-paper"
                  : "border-line bg-white/60 hover:border-line-strong hover:bg-white"
              }`}
            >
              <p className={`text-[0.66rem] uppercase tracking-[0.12em] ${active ? "text-paper/70" : "text-muted"}`}>
                {STATUS_LABELS[status]}
              </p>
              <p className="mt-1 font-display text-2xl">{counts[status as Status]}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted">
          <span className="font-semibold text-ink">{rows.length}</span>{" "}
          {rows.length === 1 ? "request" : "requests"} shown
          {filters.status
            ? ` · ${STATUS_LABELS[filters.status]}`
            : filters.view === "all"
              ? " · all statuses"
              : ` · ${openTotal} open`}
        </p>
        <Link href="/admin" className="text-xs font-semibold text-brand hover:underline">
          Clear filters
        </Link>
      </div>

      <form
        method="get"
        action="/admin"
        className="card mt-4 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end"
      >
        <div>
          <label htmlFor="category" className="label">
            Service
          </label>
          <select id="category" name="category" className="select" defaultValue={filters.category ?? ""}>
            <option value="">All services</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" name="status" className="select" defaultValue={filters.status ?? ""}>
            <option value="">Any status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="view" className="label">
            Show
          </label>
          <select id="view" name="view" className="select" defaultValue={filters.view ?? "open"}>
            <option value="open">Open only</option>
            <option value="all">Everything</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="label">
            Order
          </label>
          <select id="sort" name="sort" className="select" defaultValue={filters.sort ?? "newest"}>
            <option value="newest">Newest first</option>
            <option value="preferred">Preferred date</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          Apply filters
        </button>
      </form>

      <div className="card mt-6 overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-xl">No requests match these filters</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Try a different service or status, or clear the filters to see the whole
              board.
            </p>
            <Link href="/admin" className="btn btn-outline btn-sm mt-5">
              Clear filters
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Service</th>
                    <th scope="col">Preferred</th>
                    <th scope="col">Status</th>
                    <th scope="col">Provider</th>
                    <th scope="col">Received</th>
                    <th scope="col">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          href={`/admin/requests/${row.reference}`}
                          className="mono text-[0.8rem] font-semibold text-brand hover:underline"
                        >
                          {row.reference}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium">{row.customerName}</p>
                        <p className="text-xs text-muted">{row.serviceArea}</p>
                      </td>
                      <td className="text-ink-soft">{CATEGORY_LABELS[row.category]}</td>
                      <td className="whitespace-nowrap text-ink-soft">
                        {formatDate(row.preferredDate)}
                      </td>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="text-ink-soft">
                        {row.providerName ?? <span className="text-muted">Unassigned</span>}
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted">
                        {formatDateTimeShort(row.createdAt)}
                      </td>
                      <td>
                        <Link
                          href={`/admin/requests/${row.reference}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line md:hidden">
              {rows.map((row) => (
                <li key={row.id}>
                  <Link href={`/admin/requests/${row.reference}`} className="block px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="mono text-[0.8rem] font-semibold text-brand">
                        {row.reference}
                      </span>
                      <StatusBadge status={row.status} />
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {CATEGORY_LABELS[row.category]} · {row.customerName}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {row.serviceArea} · preferred {formatDate(row.preferredDate)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {row.providerName ? `Provider: ${row.providerName}` : "Unassigned"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
