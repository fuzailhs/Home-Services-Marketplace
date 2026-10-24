import Link from "next/link";
import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  SparkleIcon,
  UsersIcon,
  WrenchIcon,
} from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORIES, CATEGORY_BLURBS, CATEGORY_LABELS } from "@/lib/types";

const CATEGORY_ICONS = {
  PLUMBING: WrenchIcon,
  ELECTRICAL: BoltIcon,
  CLEANING: SparkleIcon,
} as const;

const STEPS = [
  {
    number: "01",
    title: "Request",
    body: "Pick a category, describe the job and choose a preferred date. It takes about two minutes.",
  },
  {
    number: "02",
    title: "Review",
    body: "The office reads the request and confirms the appointment with you by email or phone.",
  },
  {
    number: "03",
    title: "Assign",
    body: "A provider is matched to the job and the visit is added to their schedule.",
  },
  {
    number: "04",
    title: "Complete",
    body: "The provider updates progress as the work moves along. Your reference shows the latest status.",
  },
];

function HeroCard() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden
        className="absolute -inset-8 rounded-[2.5rem] bg-brand-soft/70 blur-2xl"
      />
      <div
        aria-hidden
        className="absolute -right-4 -top-6 h-24 w-24 rounded-full border border-dashed border-line-strong/70"
      />

      <div className="card card-shadow relative -rotate-1 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Request
            </p>
            <p className="mono mt-1 text-sm font-semibold">HSM-4KQ2-9TDM</p>
          </div>
          <StatusBadge status="IN_PROGRESS" />
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <p className="font-display text-xl">Kitchen tap leaking under the sink</p>
          <p className="mt-1 text-sm text-muted">Plumbing · Riverside · preferred Thu 29 Oct</p>
        </div>

        <ol className="timeline mt-6">
          <li>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">Request received</p>
              <span className="text-xs text-muted">Mon 09:12</span>
            </div>
          </li>
          <li>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">Provider assigned</p>
              <span className="text-xs text-muted">Mon 10:40</span>
            </div>
          </li>
          <li>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">In progress</p>
              <span className="text-xs text-muted">Tue 08:05</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Your provider has started work on the request.
            </p>
          </li>
        </ol>

        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[0.7rem] font-semibold text-paper">
              MS
            </span>
            <div>
              <p className="text-xs font-semibold">Maria S.</p>
              <p className="text-[0.68rem] text-muted">Plumbing provider</p>
            </div>
          </div>
          <span className="text-[0.68rem] font-medium text-brand">Visit Thu 09:00</span>
        </div>
      </div>

      <div className="card absolute -bottom-6 -left-3 flex items-center gap-2 px-3.5 py-2.5 shadow-sm sm:-left-6">
        <ClockIcon className="h-4 w-4 text-brand" />
        <span className="text-[0.7rem] font-medium">Updated 2 hours ago</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 420px at 78% -10%, rgba(15,76,70,0.10), transparent 65%), radial-gradient(600px 300px at 8% 10%, rgba(217,120,66,0.10), transparent 70%)",
          }}
        />
        <div className="container-page grid items-center gap-16 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Local home services · one trusted team
            </p>

            <h1 className="mt-5 text-balance text-[2.35rem] leading-[1.04] sm:text-[3.2rem] lg:text-[3.4rem]">
              Home repairs,
              <br />
              <span className="italic text-brand">without the phone tag.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-ink-soft">
              Send one request for plumbing, electrical or cleaning work. We log it,
              assign the right tradesperson, and give you a reference number — so you
              always know where things stand.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/request" className="btn btn-primary">
                Request a service
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/lookup" className="btn btn-outline">
                Check my request
              </Link>
            </div>

            <dl className="mt-10 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
              {[
                ["No account needed", "Just a reference and your email."],
                ["One reference per job", "Read it out or save it, no login."],
                ["Reviewed by a person", "Every request is checked by the office."],
              ].map(([title, body]) => (
                <div key={title}>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <CheckIcon className="h-3.5 w-3.5 text-brand" />
                    {title}
                  </dt>
                  <dd className="mt-1 text-xs leading-relaxed text-muted">{body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroCard />
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-y border-line bg-paper-deep/50">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-balance text-3xl sm:text-[2.4rem]">
              Four steps from request to finished job.
            </h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft">
              The board is deliberately small: a person reviews every request, assigns a
              provider, and the status moves forward one step at a time.
            </p>
          </div>

          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.number} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-paper font-display text-sm text-brand">
                    {step.number}
                  </span>
                  <span className="h-px flex-1 bg-line" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-16 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow">What we cover</p>
            <h2 className="mt-3 text-3xl sm:text-[2.4rem]">Three trades, one request board.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            One city, one company. If the job needs a specialist outside these three
            categories, the office will tell you before anything is booked.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <article key={category} className="card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl">{CATEGORY_LABELS[category]}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {CATEGORY_BLURBS[category]}
                </p>
                <Link
                  href={`/request?category=${category}`}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:gap-2.5"
                >
                  Request {CATEGORY_LABELS[category].toLowerCase()}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-page pb-16 sm:pb-24">
        <div className="card grid gap-10 p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Release scope</p>
            <h2 className="mt-3 text-3xl">What this release does — and doesn&apos;t.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The first version is a managed request board, not a full marketplace.
              Keeping the scope small is what makes the workflow reliable.
            </p>
            <div className="mt-6 rounded-xl border border-line bg-paper px-4 py-3 text-xs leading-relaxed text-ink-soft">
              <span className="font-semibold">Appointments are requested, not booked.</span>{" "}
              The office confirms the final date and time with you.
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand">
                <ClipboardIcon className="h-4 w-4" /> Included
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  "Request form with validation",
                  "Reference number confirmation",
                  "Status lookup with email match",
                  "Admin queue, filters and details",
                  "Provider assignment",
                  "Status updates and internal notes",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-ink-soft">
                    <CheckIcon className="mt-0.5 h-4 w-4 flex-none text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted">
                <UsersIcon className="h-4 w-4" /> Out of scope
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  "Online payments or refunds",
                  "Bidding, quotes or pricing",
                  "Live location or GPS tracking",
                  "Chat, video calls or ratings",
                  "Recurring bookings",
                  "Self-registration for customers",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-muted">
                    <span className="mt-2 h-1 w-3 flex-none rounded-full bg-line-strong" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-[1.6rem] bg-brand px-7 py-10 text-paper sm:px-12 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-paper/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 right-24 h-56 w-56 rounded-full border border-paper/10"
          />

          <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-paper/60">
                For the office and providers
              </p>
              <h2 className="mt-4 text-3xl text-paper sm:text-[2.5rem]">
                A shared view of every job.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/75">
                Administrators see the queue, assign active providers and keep internal
                notes. Providers see only their own jobs and can move each one from
                assigned to in progress to completed.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/sign-in" className="btn btn-accent">
                  Staff sign in
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <span className="text-xs text-paper/60">Demo accounts are listed on the sign-in page.</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-paper/15 bg-paper/5 p-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-paper/50">
                  Admin queue
                </p>
                <p className="mt-2 font-display text-3xl">6</p>
                <p className="mt-1 text-xs text-paper/65">requests across every status</p>
                <div className="mt-4 space-y-2">
                  {["New", "Assigned", "In progress"].map((label) => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-paper/10 px-2.5 py-1.5 text-[0.7rem]">
                      <span>{label}</span>
                      <span className="text-paper/60">•</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-paper/15 bg-paper/5 p-4">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-paper/50">
                  Provider view
                </p>
                <p className="mt-2 font-display text-3xl">2</p>
                <p className="mt-1 text-xs text-paper/65">active jobs on the schedule</p>
                <div className="mt-4 rounded-lg bg-paper/10 px-3 py-2">
                  <p className="text-[0.7rem] font-medium">Next visit</p>
                  <p className="mt-0.5 text-[0.7rem] text-paper/65">Thu · 09:00–11:00</p>
                </div>
                <div className="mt-2 rounded-lg bg-paper/10 px-3 py-2">
                  <p className="text-[0.7rem] font-medium">Reference lookup</p>
                  <p className="mt-0.5 text-[0.7rem] text-paper/65">HSM-••••-••••</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
