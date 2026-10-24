import type { Metadata } from "next";
import Link from "next/link";
import { LookupForm } from "@/components/lookup-form";
import { ClipboardIcon, LockIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Check request status",
  description: "Look up a home service request with your reference number and email.",
};

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Customer lookup</p>
        <h1 className="mt-3 text-4xl sm:text-[2.9rem]">Where is my request?</h1>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
          No account, no password. Enter the reference number from your confirmation
          and the email address you used, and you will see the latest customer-safe
          status.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <LookupForm initialReference={params.reference ?? ""} />

        <aside className="space-y-5">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg">
              <ClipboardIcon className="h-4 w-4 text-brand" />
              Where is my reference?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              It was shown immediately after you sent the request, in the format{" "}
              <span className="mono text-ink">HSM-ABCD-2345</span>. Save it, screenshot
              it, or read it out — it never changes.
            </p>
          </div>

          <div className="card bg-brand-soft/50 p-6">
            <h2 className="flex items-center gap-2 text-lg">
              <LockIcon className="h-4 w-4 text-brand" />
              Why both fields?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              A reference alone would let anyone read a stranger&apos;s job. Requiring
              the email on the request is a light privacy safeguard, not a production
              identity system.
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-lg">Nothing found?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Check for typos in the reference and make sure the email matches exactly.
              If it still fails,{" "}
              <Link href="/request" className="font-semibold text-brand underline underline-offset-2">
                send a new request
              </Link>{" "}
              or call the office.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
