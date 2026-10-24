import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Staff sign in",
};

const DEMO_ACCOUNTS = [
  {
    role: "Administrator",
    email: "admin@homeservices.local",
    password: "Admin123!",
    note: "Queue, assignment, notes and cancellation.",
  },
  {
    role: "Provider",
    email: "maria@homeservices.local",
    password: "Provider123!",
    note: "Plumbing provider — sees only her own jobs.",
  },
];

export default async function SignInPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === "ADMIN" ? "/admin" : "/provider");

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1 className="mt-3 text-4xl sm:text-[2.9rem]">Sign in to the board</h1>
          <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-ink-soft">
            Administrators see every request and assign providers. Providers see only
            the jobs assigned to them and can move each job forward one step at a time.
          </p>

          <div className="mt-8 space-y-4">
            <div className="card p-5">
              <p className="text-sm font-semibold">Administrator</p>
              <p className="mt-1 text-sm text-muted">
                Full queue, filters, request details, provider assignment, internal
                notes and cancellation.
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm font-semibold">Service provider</p>
              <p className="mt-1 text-sm text-muted">
                Own schedule only. Assigned → In progress → Completed. No access to
                other providers&apos; jobs.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <SignInForm />

          <div id="demo" className="card bg-paper-deep/60 p-6">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">
              Demo credentials
            </p>
            <div className="mt-3 space-y-3">
              {DEMO_ACCOUNTS.map((account) => (
                <div key={account.email} className="rounded-lg border border-line bg-paper px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">
                    {account.role}
                  </p>
                  <p className="mono mt-1 text-[0.8rem]">{account.email}</p>
                  <p className="mono text-[0.8rem] text-muted">{account.password}</p>
                  <p className="mt-1 text-xs text-muted">{account.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[0.7rem] leading-relaxed text-muted">
              Seeded demo accounts for this course build. Change or remove them before
              using real data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
