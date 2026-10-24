import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditEvents,
  internalNotes,
  requests,
  statusEvents,
  users,
} from "@/lib/db/schema";
import { AppError, notFoundError, staleStateError } from "@/lib/errors";
import { generateReference, normaliseReference } from "@/lib/reference";
import type { SessionUser } from "@/lib/auth";
import {
  canTransition,
  nextStatusesFor,
  PUBLIC_STATUS_TEXT,
  AUDIT_ACTIONS,
} from "@/lib/transitions";
import { OPEN_STATUSES, type Category, type Status } from "@/lib/types";
import type { RequestInput } from "@/lib/validation";

export type RequestRecord = typeof requests.$inferSelect;
export type StatusEventRecord = typeof statusEvents.$inferSelect;
export type InternalNoteRecord = typeof internalNotes.$inferSelect;
export type AuditEventRecord = typeof auditEvents.$inferSelect;

export interface ProviderSummary {
  id: string;
  fullName: string;
  category: Category | null;
  isActive: boolean;
}

export interface RequestListItem extends RequestRecord {
  providerName: string | null;
}

export interface RequestDetail extends RequestRecord {
  provider: ProviderSummary | null;
  events: StatusEventRecord[];
  notes: (InternalNoteRecord & { authorName: string })[];
  audit: (AuditEventRecord & { actorName: string | null })[];
}

export interface QueueFilters {
  category?: Category;
  status?: Status;
  view?: "open" | "all";
  sort?: "newest" | "preferred";
}

const MAX_REFERENCE_ATTEMPTS = 6;

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "23505" || code === "23514" ? code === "23505" : false;
}

/* -------------------------------------------------------------------------- */
/* Customer-facing                                                            */
/* -------------------------------------------------------------------------- */

/** FR-01 + FR-02: store one request and return a unique public reference. */
export async function createRequest(input: RequestInput): Promise<{ reference: string }> {
  const db = await getDb();

  for (let attempt = 0; attempt < MAX_REFERENCE_ATTEMPTS; attempt += 1) {
    const reference = generateReference();
    const id = randomUUID();
    const now = new Date();

    try {
      await db.transaction(async (tx) => {
        await tx.insert(requests).values({
          id,
          reference,
          customerName: input.customerName,
          customerEmail: input.email,
          customerPhone: input.phone,
          serviceArea: input.serviceArea,
          category: input.category,
          description: input.description,
          preferredDate: input.preferredDate,
          status: "NEW",
          createdAt: now,
          updatedAt: now,
        });

        await tx.insert(statusEvents).values({
          id: randomUUID(),
          requestId: id,
          fromStatus: null,
          toStatus: "NEW",
          publicText: PUBLIC_STATUS_TEXT.NEW,
          actorId: null,
          createdAt: now,
        });

        await tx.insert(auditEvents).values({
          id: randomUUID(),
          requestId: id,
          action: AUDIT_ACTIONS.REQUEST_CREATED,
          actorId: null,
          detail: `Request received from ${input.customerName}`,
          createdAt: now,
        });
      });

      return { reference };
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  // FR-02: if no reference can be issued, save nothing and invite a retry.
  throw new AppError(
    "REFERENCE_UNAVAILABLE",
    503,
    "We could not issue a reference number. Nothing was saved — please try again.",
  );
}

/** FR-03 + FR-11: reference plus email, returning only customer-safe history. */
export async function lookupRequest(
  reference: string,
  email: string,
): Promise<{ request: RequestRecord; events: StatusEventRecord[] }> {
  const db = await getDb();
  const normalised = normaliseReference(reference).toUpperCase();

  const rows = await db
    .select()
    .from(requests)
    .where(
      and(
        eq(sql`upper(${requests.reference})`, normalised),
        eq(sql`lower(${requests.customerEmail})`, email.trim().toLowerCase()),
      ),
    )
    .limit(1);

  const request = rows[0];
  if (!request) throw notFoundError();

  const events = await db
    .select()
    .from(statusEvents)
    .where(eq(statusEvents.requestId, request.id))
    .orderBy(asc(statusEvents.createdAt));

  return { request, events };
}

/* -------------------------------------------------------------------------- */
/* Staff-facing                                                               */
/* -------------------------------------------------------------------------- */

export async function listRequests(filters: QueueFilters): Promise<RequestListItem[]> {
  const db = await getDb();
  const conditions = [];

  if (filters.category) conditions.push(eq(requests.category, filters.category));
  if (filters.status) conditions.push(eq(requests.status, filters.status));
  if (!filters.status && filters.view !== "all") {
    conditions.push(inArray(requests.status, OPEN_STATUSES));
  }

  const rows = await db
    .select({
      request: requests,
      providerName: users.fullName,
    })
    .from(requests)
    .leftJoin(users, eq(users.id, requests.providerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      filters.sort === "preferred"
        ? asc(requests.preferredDate)
        : desc(requests.createdAt),
    )
    .limit(200);

  return rows.map((row) => ({ ...row.request, providerName: row.providerName ?? null }));
}

export async function countRequestsByStatus(): Promise<Record<Status, number>> {
  const db = await getDb();
  const rows = await db
    .select({ status: requests.status, total: sql<number>`count(*)::int` })
    .from(requests)
    .groupBy(requests.status);

  const counts = {
    NEW: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  } as Record<Status, number>;

  for (const row of rows) counts[row.status] = Number(row.total);
  return counts;
}

export async function listActiveProviders(): Promise<ProviderSummary[]> {
  const db = await getDb();
  return db
    .select({
      id: users.id,
      fullName: users.fullName,
      category: users.category,
      isActive: users.isActive,
    })
    .from(users)
    .where(and(eq(users.role, "PROVIDER"), eq(users.isActive, true)))
    .orderBy(asc(users.fullName));
}

async function loadDetail(request: RequestRecord): Promise<RequestDetail> {
  const db = await getDb();

  const [providerRows, eventRows, noteRows, auditRows] = await Promise.all([
    request.providerId
      ? db
          .select({
            id: users.id,
            fullName: users.fullName,
            category: users.category,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.id, request.providerId))
          .limit(1)
      : Promise.resolve([]),
    db
      .select()
      .from(statusEvents)
      .where(eq(statusEvents.requestId, request.id))
      .orderBy(asc(statusEvents.createdAt)),
    db
      .select({
        note: internalNotes,
        authorName: users.fullName,
      })
      .from(internalNotes)
      .innerJoin(users, eq(users.id, internalNotes.authorId))
      .where(eq(internalNotes.requestId, request.id))
      .orderBy(desc(internalNotes.createdAt)),
    db
      .select({
        event: auditEvents,
        actorName: users.fullName,
      })
      .from(auditEvents)
      .leftJoin(users, eq(users.id, auditEvents.actorId))
      .where(eq(auditEvents.requestId, request.id))
      .orderBy(desc(auditEvents.createdAt)),
  ]);

  return {
    ...request,
    provider: providerRows[0] ?? null,
    events: eventRows,
    notes: noteRows.map((row) => ({ ...row.note, authorName: row.authorName })),
    audit: auditRows.map((row) => ({ ...row.event, actorName: row.actorName ?? null })),
  };
}

/** FR-06: one request with its assignment, notes and history. */
export async function getRequestForStaff(
  reference: string,
  viewer: SessionUser,
): Promise<RequestDetail> {
  const db = await getDb();
  const normalised = normaliseReference(reference);

  const rows = await db
    .select()
    .from(requests)
    .where(eq(sql`upper(${requests.reference})`, normalised))
    .limit(1);

  const request = rows[0];
  if (!request) throw notFoundError();

  // FR-08 / release criterion 6: a provider never sees another provider's job.
  if (viewer.role === "PROVIDER" && request.providerId !== viewer.id) {
    throw notFoundError();
  }

  return loadDetail(request);
}

export async function getRequestByReference(reference: string): Promise<RequestDetail | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(requests)
    .where(eq(sql`upper(${requests.reference})`, normaliseReference(reference)))
    .limit(1);

  return rows[0] ? loadDetail(rows[0]) : null;
}

/** FR-07: assign or change the provider. Rejects inactive providers and past dates. */
export async function assignProvider(params: {
  reference: string;
  providerId: string;
  scheduledDate: string;
  expectedStatus: Status;
  actor: SessionUser;
}): Promise<void> {
  const db = await getDb();

  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(requests)
      .where(eq(sql`upper(${requests.reference})`, normaliseReference(params.reference)))
      .limit(1)
      .for("update");

    const request = rows[0];
    if (!request) throw notFoundError();

    if (request.status !== params.expectedStatus) throw staleStateError();
    if (!["NEW", "ASSIGNED"].includes(request.status)) {
      throw new AppError(
        "INVALID_STATE",
        409,
        "Only a new or assigned request can be assigned to a provider.",
      );
    }

    const providerRows = await tx
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, params.providerId),
          eq(users.role, "PROVIDER"),
          eq(users.isActive, true),
        ),
      )
      .limit(1);

    const provider = providerRows[0];
    if (!provider) {
      throw new AppError(
        "PROVIDER_UNAVAILABLE",
        422,
        "That provider is not available for assignment.",
        { providerId: "Choose an active provider." },
      );
    }

    const now = new Date();
    const changed = request.status !== "ASSIGNED" || request.providerId !== provider.id;

    await tx
      .update(requests)
      .set({
        providerId: provider.id,
        scheduledDate: params.scheduledDate,
        status: "ASSIGNED",
        updatedAt: now,
      })
      .where(eq(requests.id, request.id));

    if (changed) {
      await tx.insert(statusEvents).values({
        id: randomUUID(),
        requestId: request.id,
        fromStatus: request.status,
        toStatus: "ASSIGNED",
        publicText: PUBLIC_STATUS_TEXT.ASSIGNED,
        actorId: params.actor.id,
        createdAt: now,
      });

      await tx.insert(auditEvents).values({
        id: randomUUID(),
        requestId: request.id,
        action: AUDIT_ACTIONS.PROVIDER_ASSIGNED,
        actorId: params.actor.id,
        detail: `${provider.fullName} assigned for ${params.scheduledDate}`,
        createdAt: now,
      });
    }
  });
}

/** FR-09: provider advances the job. Invalid or reversed transitions are refused. */
export async function updateStatus(params: {
  reference: string;
  status: Status;
  expectedStatus: Status;
  note?: string;
  actor: SessionUser;
}): Promise<void> {
  const db = await getDb();

  await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(requests)
      .where(eq(sql`upper(${requests.reference})`, normaliseReference(params.reference)))
      .limit(1)
      .for("update");

    const request = rows[0];
    if (!request) throw notFoundError();

    if (params.actor.role === "PROVIDER" && request.providerId !== params.actor.id) {
      throw notFoundError();
    }

    if (request.status !== params.expectedStatus) throw staleStateError();

    if (!canTransition(request.status, params.status, params.actor.role)) {
      throw new AppError(
        "INVALID_TRANSITION",
        409,
        `A request cannot move from ${request.status.toLowerCase()} to ${params.status
          .toLowerCase()
          .replace("_", " ")}.`,
      );
    }

    const now = new Date();

    await tx
      .update(requests)
      .set({ status: params.status, updatedAt: now })
      .where(eq(requests.id, request.id));

    await tx.insert(statusEvents).values({
      id: randomUUID(),
      requestId: request.id,
      fromStatus: request.status,
      toStatus: params.status,
      publicText: PUBLIC_STATUS_TEXT[params.status],
      actorId: params.actor.id,
      createdAt: now,
    });

    await tx.insert(auditEvents).values({
      id: randomUUID(),
      requestId: request.id,
      action:
        params.status === "CANCELLED"
          ? AUDIT_ACTIONS.REQUEST_CANCELLED
          : AUDIT_ACTIONS.STATUS_CHANGED,
      actorId: params.actor.id,
      detail: `Status changed from ${request.status} to ${params.status}`,
      createdAt: now,
    });

    const note = params.note?.trim();
    if (note) {
      await tx.insert(internalNotes).values({
        id: randomUUID(),
        requestId: request.id,
        authorId: params.actor.id,
        body: note,
        createdAt: now,
      });

      await tx.insert(auditEvents).values({
        id: randomUUID(),
        requestId: request.id,
        action: AUDIT_ACTIONS.NOTE_ADDED,
        actorId: params.actor.id,
        detail: "Internal note added with the status update",
        createdAt: now,
      });
    }
  });
}

/** FR-10: internal note, never shown to the customer. */
export async function addInternalNote(params: {
  reference: string;
  body: string;
  actor: SessionUser;
}): Promise<void> {
  const db = await getDb();
  const normalised = normaliseReference(params.reference);

  const rows = await db
    .select()
    .from(requests)
    .where(eq(sql`upper(${requests.reference})`, normalised))
    .limit(1);

  const request = rows[0];
  if (!request) throw notFoundError();
  if (params.actor.role === "PROVIDER" && request.providerId !== params.actor.id) {
    throw notFoundError();
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(internalNotes).values({
      id: randomUUID(),
      requestId: request.id,
      authorId: params.actor.id,
      body: params.body,
      createdAt: now,
    });

    await tx.insert(auditEvents).values({
      id: randomUUID(),
      requestId: request.id,
      action: AUDIT_ACTIONS.NOTE_ADDED,
      actorId: params.actor.id,
      detail: "Internal note added",
      createdAt: now,
    });
  });
}

/** FR-08: a provider's own jobs, ordered by scheduled date. */
export async function listProviderJobs(
  providerId: string,
  view: "open" | "in_progress" | "completed" | "all" = "open",
): Promise<RequestListItem[]> {
  const db = await getDb();
  const conditions = [eq(requests.providerId, providerId)];

  if (view === "open") {
    conditions.push(or(eq(requests.status, "ASSIGNED"), eq(requests.status, "IN_PROGRESS"))!);
  } else if (view === "in_progress") {
    conditions.push(eq(requests.status, "IN_PROGRESS"));
  } else if (view === "completed") {
    conditions.push(eq(requests.status, "COMPLETED"));
  }

  const rows = await db
    .select({ request: requests, providerName: users.fullName })
    .from(requests)
    .leftJoin(users, eq(users.id, requests.providerId))
    .where(and(...conditions))
    .orderBy(asc(requests.scheduledDate), asc(requests.preferredDate))
    .limit(200);

  return rows.map((row) => ({ ...row.request, providerName: row.providerName ?? null }));
}

export function allowedNextStatuses(status: Status, role: SessionUser["role"]): Status[] {
  return nextStatusesFor(status, role);
}
