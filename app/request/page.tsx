import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "@/components/request-form";
import { ClockIcon, LockIcon } from "@/components/icons";
import { todayIso } from "@/lib/today";
import { isCategory, type Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Request a service",
  description:
    "Send a plumbing, electrical or cleaning request and get a reference number straight away.",
};

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const initialCategory: Category | undefined = isCategory(params.category)
    ? params.category
    : undefined;

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Customer request</p>
        <h1 className="mt-3 text-4xl sm:text-[2.9rem]">Request a service</h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
          One form, one reference number. The office reviews every request before a
          provider is assigned, so the visit is confirmed by a person — not an
          algorithm.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.65fr_1fr] lg:items-start">
        <RequestForm minDate={todayIso()} initialCategory={initialCategory} />

        <aside className="space-y-5">
          <div className="card p-6">
            <h2 className="text-lg">Before you send</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                Describe the problem in your own words — 20 characters minimum.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                Pick a preferred date. The office will confirm the actual slot.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                Keep the reference number we show you. It is how you check progress.
              </li>
            </ul>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg">
              <ClockIcon className="h-4 w-4 text-brand" />
              Office hours
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Monday to Friday, 8:00–17:00. Requests sent outside these hours are
              reviewed the next working day.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Urgent leak or electrical danger? Call the office rather than waiting for
              the board.
            </p>
          </div>

          <div className="card bg-brand-soft/50 p-6">
            <h2 className="flex items-center gap-2 text-lg">
              <LockIcon className="h-4 w-4 text-brand" />
              Your details stay with the office
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Staff notes are internal. The public lookup shows only the status and
              customer-safe updates, and only when the reference and email both match.
            </p>
            <p className="mt-4 text-sm">
              Already sent a request?{" "}
              <Link href="/lookup" className="font-semibold text-brand underline underline-offset-2">
                Check its status
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
