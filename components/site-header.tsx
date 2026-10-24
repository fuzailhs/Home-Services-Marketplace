import Link from "next/link";
import { HouseIcon } from "@/components/icons";
import { getSessionUser } from "@/lib/auth";

function SignOutButton() {
  return (
    <form action="/api/auth/sign-out" method="post">
      <button type="submit" className="btn btn-ghost btn-sm">
        Sign out
      </button>
    </form>
  );
}

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Home Services Marketplace, home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-paper">
            <HouseIcon className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[1.02rem] tracking-tight">Home Services</span>
            <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted">
              Marketplace
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          {user?.role === "ADMIN" && (
            <>
              <Link href="/admin" className="btn btn-ghost btn-sm">
                Request queue
              </Link>
              <span className="hidden text-xs text-muted md:inline">{user.fullName}</span>
              <SignOutButton />
            </>
          )}

          {user?.role === "PROVIDER" && (
            <>
              <Link href="/provider" className="btn btn-ghost btn-sm">
                My jobs
              </Link>
              <span className="hidden text-xs text-muted md:inline">{user.fullName}</span>
              <SignOutButton />
            </>
          )}

          {!user && (
            <>
              <Link href="/request" className="hidden btn btn-ghost btn-sm sm:inline-flex">
                Request a service
              </Link>
              <Link href="/lookup" className="hidden btn btn-ghost btn-sm sm:inline-flex">
                Check status
              </Link>
              <Link href="/sign-in" className="btn btn-outline btn-sm">
                Staff sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
