import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-deep/60">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg">Home Services Marketplace</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            One request board for a local plumbing, electrical and cleaning team.
            Submit once, get a reference number, and follow the job without
            calling the office.
          </p>
          <p className="mt-4 text-xs text-muted">
            One city · one company · three service categories
          </p>
        </div>

        <div>
          <p className="eyebrow">Customers</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="hover:text-brand" href="/request">
                Request a service
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand" href="/lookup">
                Check request status
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand" href="/#how-it-works">
                How it works
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Staff</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="hover:text-brand" href="/sign-in">
                Sign in to the workspace
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand" href="/sign-in#demo">
                Demo credentials
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/80">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Sample Project 01 · AI Vibe Coding Course</p>
          <p>Requests are reviewed by a person. No payments, quotes or live tracking in this release.</p>
        </div>
      </div>
    </footer>
  );
}
