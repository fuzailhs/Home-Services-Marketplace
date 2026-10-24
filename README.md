# Home Services Marketplace

A small, managed request board for a local home services company — **Sample
Project 01** for the AI Vibe Coding Course.

A customer sends one request for plumbing, electrical or cleaning work and gets a
reference number. An administrator reviews the queue and assigns a provider. The
provider moves the job from **Assigned → In progress → Completed**, and the
customer can follow the latest status without calling the office.

- **Customers:** no account, one form, one reference number
- **Administrators:** queue, filters, details, assignment, internal notes, cancellation
- **Providers:** only their own jobs, forward-only status updates
- **Next.js 16 + TypeScript + Tailwind CSS**
- **PostgreSQL data model** (embedded PGlite locally, hosted Postgres in production)
- **24 automated tests** covering validation, transitions, references and the full request lifecycle

---

## Quick start

Requirements: **Node.js 20.11+** (tested on Node 24) and npm.

```bash
npm install
npm run dev
```

`npm run dev` applies the schema, seeds the demo board if it is empty, then starts
the app:

- Web app: <http://localhost:3000>
- Health check: <http://localhost:3000/api/health>

No database server, account or API key is needed for the local demo. The embedded
database is a real PostgreSQL build (PGlite) stored in `.data/pglite`.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@homeservices.local` | `Admin123!` |
| Provider (plumbing) | `maria@homeservices.local` | `Provider123!` |
| Provider (electrical) | `daniel@homeservices.local` | `Provider123!` |
| Provider (cleaning, **inactive**) | `priya@homeservices.local` | `Provider123!` |

The inactive provider is deliberately hidden from assignment — that rule is part
of the brief.

### Demo requests

| Reference | Service | Status | Customer email |
| --- | --- | --- | --- |
| `HSM-K4TQ-9WDM` | Plumbing | New | `helen.marsh@example.com` |
| `HSM-R7PN-2XCF` | Cleaning | New | `owen.brady@example.com` |
| `HSM-M8ZD-6BVL` | Plumbing | Assigned | `helen.marsh@example.com` |
| `HSM-T3WC-8KQJ` | Electrical | In progress | `aisha.rahman@example.com` |
| `HSM-B9HN-5RXT` | Plumbing | Completed | `grace.adeyemi@example.com` |
| `HSM-J6YF-3MPD` | Electrical | Cancelled | `peter.nolan@example.com` |

### 60-second demo (the definition of done)

1. Open **Request a service**, submit the form, and note the reference number.
2. Open **Staff sign in** and sign in as the administrator.
3. Find the new request in the queue, open it, choose a provider and a visit
   date, and assign it.
4. Sign out, sign in as that provider, open the job, press **Start job**, then
   **Mark completed**.
5. Sign out and use **Check status** with the reference plus the email you used.
   The full customer-safe timeline is visible, without staff names or notes.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Set up the database and start the app |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Unit and integration tests (embedded PostgreSQL) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:setup` | Apply the schema; seed only when empty |
| `npm run db:seed` | **Reset** the board to the documented demo data |

Do not run `db:seed` while `npm run dev` is running — the embedded database is
single-process.

---

## What this release includes

**In scope**

- Request form with validation and inline errors
- Unique, non-sequential reference number
- Status lookup with reference + email match
- Administrator queue with filters and request detail
- Provider assignment (active providers only)
- Status timeline, internal notes, audit trail
- Created/updated timestamps in one configured time zone

**Out of scope**

- Payments, refunds, quotes or pricing
- Provider bidding or automated matching
- Live location or GPS tracking
- Chat, video calls, ratings or reviews
- Recurring bookings
- Customer or provider self-registration
- Multi-company support

Appointments are *requested*, not booked. The office confirms the final slot.

---

## How the workflow is enforced

```
NEW ──assign──▶ ASSIGNED ──provider──▶ IN_PROGRESS ──provider──▶ COMPLETED
 │                  │
 └────admin─────────┴──────────────▶ CANCELLED
```

- Providers can only move a job forward one step (`Assigned → In progress → Completed`).
- Administrators can assign new or assigned work and cancel work that has not started.
- Every transition is validated on the server; skipped or reversed states are refused.
- Each update carries the status the client last saw (`expectedStatus`). If the
  request changed in another tab the server returns **409** instead of overwriting.
- Assignment and status changes run in a database transaction with a row lock, so
  the request row, the status event and the audit event are written together.

---

## Architecture

```
Browser
  Next.js App Router (server components + small client islands)
        │  public form, lookup, staff workspace
        ▼
  Route handlers (Zod validation, session check, rate limits)
        │
        ├──────────────► PostgreSQL (PGlite locally / hosted Postgres)
        └──────────────► scrypt password hashes, HTTP-only session cookie
```

### Stack

| Layer | Choice |
| --- | --- |
| Application | Next.js 16 (App Router) + TypeScript |
| Interface | Tailwind CSS v4 |
| Database | PostgreSQL |
| Data access | Drizzle ORM + SQL DDL |
| Auth | Server sessions: scrypt hashes, HTTP-only cookie, sessions table |
| Validation | Zod (shared by client and server) |
| Tests | Vitest |

The brief lists Prisma and Auth.js as examples and notes that the concrete
choices are examples. This build uses **Drizzle ORM** so the demo runs against
embedded PostgreSQL with zero setup, and a small explicit session layer so the
role and ownership checks are visible in one place. The schema mirrors the
required `User / Request / StatusEvent / InternalNote` model one-to-one, and
`DATABASE_URL` switches the same SQL to hosted PostgreSQL.

### Project layout

```
app/
  page.tsx                       Landing page and scope
  request/                       Customer request form + confirmation
  lookup/                        Customer status lookup
  sign-in/                       Staff sign in + demo credentials
  admin/                         Queue, filters, request detail
  provider/                      Own jobs, job detail
  api/                           Route handlers (see API table)
components/                      Forms, timeline, badges, audit list
lib/
  db/                            DDL, Drizzle schema, PGlite/Postgres connection
  auth.ts                        Sessions, role guards
  requests.ts                    Service layer (create, lookup, assign, update)
  validation.ts                  Zod schemas + field-error mapping
  transitions.ts                 Status rules and public status text
  reference.ts                   Non-sequential reference generator
  rate-limit.ts                  Fixed-window limits on public routes
scripts/                         setup.ts, seed.ts, seed-cli.ts
tests/                           Reference, validation, transitions, lifecycle
```

### Data model

| Table | Key columns |
| --- | --- |
| `users` | `id`, `email` (unique, case-insensitive), `full_name`, `password_hash`, `role` (`ADMIN` / `PROVIDER`), `category`, `is_active` |
| `requests` | `id`, `reference` (unique), customer name/email/phone, `service_area`, `category`, `description` (20–500), `preferred_date`, `status`, `provider_id`, `scheduled_date`, timestamps |
| `status_events` | `request_id`, `from_status`, `to_status`, `public_text`, `actor_id`, `created_at` |
| `internal_notes` | `request_id`, `author_id`, `body` (1–500), `created_at` |
| `audit_events` | `request_id`, `action`, `actor_id`, `detail`, `created_at` |
| `sessions` | `id`, `user_id`, `token_hash` (SHA-256), `expires_at` |

DDL lives in `lib/db/ddl.ts`; the typed schema in `lib/db/schema.ts`.

---

## API

All responses are JSON. Errors use one stable shape:

```json
{ "error": { "code": "VALIDATION", "message": "…", "fieldErrors": { "email": "…" } }, "requestId": "ab12cd34" }
```

| Method and path | Access | Purpose | Errors |
| --- | --- | --- | --- |
| `POST /api/requests` | Public | Create request | 400 validation, 429 rate limit, 503 retry |
| `POST /api/requests/lookup` | Public | Status lookup | 400, 404 neutral, 429 |
| `POST /api/auth/sign-in` | Public | Create session | 401 invalid sign-in, 429 |
| `POST /api/auth/sign-out` | Staff | Destroy session | — |
| `GET /api/requests` | Admin | Filtered queue | 401 / 403 |
| `GET /api/requests/:reference` | Staff | Request detail | 401 / 403 / 404 |
| `PATCH /api/requests/:reference/assign` | Admin | Assign provider | 409 stale state, 422 provider unavailable |
| `PATCH /api/requests/:reference/status` | Assigned staff | Advance status | 409 invalid transition / stale state |
| `POST /api/requests/:reference/notes` | Staff | Add internal note | 403 / 422 |
| `GET /api/providers` | Admin | Active providers | 401 / 403 |
| `GET /api/health` | Public | Liveness + database check | 503 |

### Rate limits

- Request creation: 10 per IP per 10 minutes
- Status lookup: 20 per IP per 10 minutes
- Staff sign-in: 8 attempts per IP per 5 minutes

---

## Privacy and security

- Passwords are stored as salted **scrypt** hashes, never in plain text.
- Session tokens are random, stored only as SHA-256 hashes, and sent in an
  **HTTP-only, SameSite=Lax** cookie (Secure in production).
- Every protected page and route checks the role, and providers are limited to
  their own assigned jobs.
- The lookup returns the **same neutral 404** for a wrong reference or a wrong
  email, so references cannot be probed.
- Customer-safe responses contain no provider identity, staff names, internal
  notes or audit data.
- Zod allowlists categories and statuses; the database repeats the checks with
  `CHECK` constraints.
- Unexpected failures log a correlation id only — never request bodies, passwords
  or stack traces in the response.

---

## Accessibility

- Visible labels on every input, errors linked with `aria-describedby`
- `aria-invalid`, `role="alert"` and focus moved to the first invalid field
- Status is conveyed by text, not colour alone
- Skip link, visible focus rings, 44px minimum touch targets
- Layout verified from 360px up; tables become cards on small screens
- Reduced-motion support

---

## Environment variables

Copy `.env.example` to `.env.local` only if you want to change defaults.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | *(empty)* | Hosted PostgreSQL; when set, PGlite is not used |
| `PGSSL` | `false` | `true` if the hosted database requires TLS |
| `PGLITE_DATA_DIR` | `.data/pglite` | Local embedded database directory (`memory://` for tests) |
| `AUTH_SECRET` | demo value | Session signing secret — **required in production** |
| `APP_BASE_URL` | `http://localhost:3000` | Public base URL |
| `SESSION_MAX_AGE` | `28800` | Staff session lifetime in seconds |
| `APP_TIME_ZONE` | `Europe/London` | Display zone for all timestamps |

The app refuses to start in production with the demo `AUTH_SECRET`.

---

## Deployment

The app is a single Next.js service plus PostgreSQL.

1. Create a PostgreSQL database and copy its connection string.
2. Set `DATABASE_URL`, `AUTH_SECRET` (32+ random characters), `APP_BASE_URL`,
   `APP_TIME_ZONE` and `NODE_ENV=production`.
3. Build with `npm run build`, start with `npm start`.
4. Run `npm run db:setup` once to create the tables. It seeds demo data only if
   the database is empty — use `npm run db:seed` deliberately, or skip it and
   create real staff accounts.
5. Smoke test: health check, one request submission, one lookup, admin sign-in,
   provider assignment, provider status update.

Railway, Render, Fly.io and any Node host with Postgres work the same way.

---

## Tests

```bash
npm test
```

| Suite | Covers |
| --- | --- |
| `tests/reference.test.ts` | Format, ambiguous characters, non-sequential output, normalisation |
| `tests/validation.test.ts` | Required fields, email/phone rules, 20–500 description, future date, category allowlist |
| `tests/transitions.test.ts` | Provider/admin transitions, skipped and reversed states, closed requests |
| `tests/requests.test.ts` | Real PostgreSQL lifecycle: create, neutral 404, assign, progress, complete, stale state, ownership, inactive provider, note privacy |

---

## Known limits

- Rate limiting is in-process; a multi-instance deployment should move it to a
  shared store.
- There is no email delivery. The reference is shown on screen; confirmation is
  handled by the office, as the brief specifies.
- Cancellation is available only before work starts.
- The demo seed contains fictional customers and must be replaced before real use.
