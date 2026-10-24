import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  auditEvents,
  internalNotes,
  requests,
  sessions,
  statusEvents,
  users,
} from "@/lib/db/schema";
import { hashPassword } from "@/lib/password";
import { PUBLIC_STATUS_TEXT, AUDIT_ACTIONS } from "@/lib/transitions";
import { todayIso } from "@/lib/today";
import type { Category, Status } from "@/lib/types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function isoDate(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * DAY);
  return todayIso(date);
}

function ago(hours: number): Date {
  return new Date(Date.now() - hours * HOUR);
}

interface SeedRequest {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceArea: string;
  category: Category;
  description: string;
  preferredDate: string;
  status: Status;
  providerEmail?: string;
  scheduledDate?: string;
  createdAt: Date;
  notes?: { authorEmail: string; body: string; createdAt: Date }[];
}

const SEED_REQUESTS: SeedRequest[] = [
  {
    reference: "HSM-K4TQ-9WDM",
    customerName: "Helen Marsh",
    customerEmail: "helen.marsh@example.com",
    customerPhone: "07700 900112",
    serviceArea: "Riverside",
    category: "PLUMBING",
    description:
      "The kitchen tap is dripping under the sink and the cupboard floor is getting wet. It started after the cold weather.",
    preferredDate: isoDate(2),
    status: "NEW",
    createdAt: ago(5),
  },
  {
    reference: "HSM-R7PN-2XCF",
    customerName: "Owen Brady",
    customerEmail: "owen.brady@example.com",
    customerPhone: "07700 900233",
    serviceArea: "Northfield",
    category: "CLEANING",
    description:
      "End-of-tenancy clean for a two-bedroom flat. Needs to be finished before the keys are handed back on Friday.",
    preferredDate: isoDate(3),
    status: "NEW",
    createdAt: ago(9),
  },
  {
    reference: "HSM-M8ZD-6BVL",
    customerName: "Helen Marsh",
    customerEmail: "helen.marsh@example.com",
    customerPhone: "07700 900112",
    serviceArea: "Riverside",
    category: "PLUMBING",
    description:
      "The bathroom radiator is not heating up and the valve is stiff. Looking for someone to check and replace it if needed.",
    preferredDate: isoDate(1),
    status: "ASSIGNED",
    providerEmail: "maria@homeservices.local",
    scheduledDate: isoDate(3),
    createdAt: ago(30),
    notes: [
      {
        authorEmail: "admin@homeservices.local",
        body: "Customer prefers a morning visit. Parts for this valve are already in the van.",
        createdAt: ago(27),
      },
    ],
  },
  {
    reference: "HSM-T3WC-8KQJ",
    customerName: "Aisha Rahman",
    customerEmail: "aisha.rahman@example.com",
    customerPhone: "07700 900344",
    serviceArea: "Harbourside",
    category: "ELECTRICAL",
    description:
      "Two sockets in the front room stopped working after a trip at the fuse board. Everything else in the flat is fine.",
    preferredDate: isoDate(0),
    status: "IN_PROGRESS",
    providerEmail: "daniel@homeservices.local",
    scheduledDate: isoDate(0),
    createdAt: ago(52),
    notes: [
      {
        authorEmail: "daniel@homeservices.local",
        body: "Socket ring tested. One back-box has a loose neutral; replacing it today.",
        createdAt: ago(3),
      },
    ],
  },
  {
    reference: "HSM-B9HN-5RXT",
    customerName: "Grace Adeyemi",
    customerEmail: "grace.adeyemi@example.com",
    customerPhone: "07700 900455",
    serviceArea: "Riverside",
    category: "PLUMBING",
    description:
      "Outside tap was replaced and the pipework lagged. Everything is working again, leaving this here for the record.",
    preferredDate: isoDate(-4),
    status: "COMPLETED",
    providerEmail: "maria@homeservices.local",
    scheduledDate: isoDate(-3),
    createdAt: ago(120),
    notes: [
      {
        authorEmail: "maria@homeservices.local",
        body: "Job finished. Old tap left with the customer for disposal.",
        createdAt: ago(70),
      },
    ],
  },
  {
    reference: "HSM-J6YF-3MPD",
    customerName: "Peter Nolan",
    customerEmail: "peter.nolan@example.com",
    customerPhone: "07700 900566",
    serviceArea: "Northfield",
    category: "ELECTRICAL",
    description:
      "Wanted a quote for garden lighting. Cancelled after deciding to wait until the spring.",
    preferredDate: isoDate(-2),
    status: "CANCELLED",
    createdAt: ago(96),
    notes: [
      {
        authorEmail: "admin@homeservices.local",
        body: "Customer called to cancel. No visit was scheduled.",
        createdAt: ago(90),
      },
    ],
  },
];

const EVENT_PLANS: Record<Status, { to: Status; hoursAgo: number }[]> = {
  NEW: [{ to: "NEW", hoursAgo: 5 }],
  ASSIGNED: [
    { to: "NEW", hoursAgo: 30 },
    { to: "ASSIGNED", hoursAgo: 26 },
  ],
  IN_PROGRESS: [
    { to: "NEW", hoursAgo: 52 },
    { to: "ASSIGNED", hoursAgo: 48 },
    { to: "IN_PROGRESS", hoursAgo: 3 },
  ],
  COMPLETED: [
    { to: "NEW", hoursAgo: 120 },
    { to: "ASSIGNED", hoursAgo: 116 },
    { to: "IN_PROGRESS", hoursAgo: 74 },
    { to: "COMPLETED", hoursAgo: 70 },
  ],
  CANCELLED: [
    { to: "NEW", hoursAgo: 96 },
    { to: "CANCELLED", hoursAgo: 90 },
  ],
};

export async function seedDatabase(): Promise<void> {
  const db = await getDb();

  // Demo data only: clear the board so the seed is repeatable.
  await db.delete(sessions);
  await db.delete(auditEvents);
  await db.delete(internalNotes);
  await db.delete(statusEvents);
  await db.delete(requests);
  await db.delete(users);

  const adminId = randomUUID();
  const mariaId = randomUUID();
  const danielId = randomUUID();
  const priyaId = randomUUID();

  const [adminHash, mariaHash, danielHash, priyaHash] = await Promise.all([
    hashPassword("Admin123!"),
    hashPassword("Provider123!"),
    hashPassword("Provider123!"),
    hashPassword("Provider123!"),
  ]);

  await db.insert(users).values([
    {
      id: adminId,
      email: "admin@homeservices.local",
      fullName: "Amina Okafor",
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "01632 960001",
      isActive: true,
      createdAt: ago(2000),
    },
    {
      id: mariaId,
      email: "maria@homeservices.local",
      fullName: "Maria Santos",
      passwordHash: mariaHash,
      role: "PROVIDER",
      category: "PLUMBING",
      phone: "07700 900701",
      isActive: true,
      createdAt: ago(1900),
    },
    {
      id: danielId,
      email: "daniel@homeservices.local",
      fullName: "Daniel Boateng",
      passwordHash: danielHash,
      role: "PROVIDER",
      category: "ELECTRICAL",
      phone: "07700 900702",
      isActive: true,
      createdAt: ago(1800),
    },
    {
      id: priyaId,
      email: "priya@homeservices.local",
      fullName: "Priya Raman",
      passwordHash: priyaHash,
      role: "PROVIDER",
      category: "CLEANING",
      phone: "07700 900703",
      isActive: false,
      createdAt: ago(1700),
    },
  ]);

  const providerIdByEmail: Record<string, string> = {
    "maria@homeservices.local": mariaId,
    "daniel@homeservices.local": danielId,
    "priya@homeservices.local": priyaId,
    "admin@homeservices.local": adminId,
  };

  const providerNameByEmail: Record<string, string> = {
    "maria@homeservices.local": "Maria Santos",
    "daniel@homeservices.local": "Daniel Boateng",
    "priya@homeservices.local": "Priya Raman",
    "admin@homeservices.local": "Amina Okafor",
  };

  for (const seed of SEED_REQUESTS) {
    const id = randomUUID();
    const providerId = seed.providerEmail ? providerIdByEmail[seed.providerEmail] : null;
    const plan = EVENT_PLANS[seed.status];
    const lastEvent = plan[plan.length - 1];

    await db.insert(requests).values({
      id,
      reference: seed.reference,
      customerName: seed.customerName,
      customerEmail: seed.customerEmail,
      customerPhone: seed.customerPhone,
      serviceArea: seed.serviceArea,
      category: seed.category,
      description: seed.description,
      preferredDate: seed.preferredDate,
      status: seed.status,
      providerId,
      scheduledDate: seed.scheduledDate ?? null,
      createdAt: seed.createdAt,
      updatedAt: ago(lastEvent.hoursAgo),
    });

    let previous: Status | null = null;

    for (const event of plan) {
      const isProviderStep = event.to === "IN_PROGRESS" || event.to === "COMPLETED";
      const actorId = event.to === "NEW" ? null : isProviderStep ? providerId : adminId;

      await db.insert(statusEvents).values({
        id: randomUUID(),
        requestId: id,
        fromStatus: previous,
        toStatus: event.to,
        publicText: PUBLIC_STATUS_TEXT[event.to],
        actorId,
        createdAt: ago(event.hoursAgo),
      });

      if (event.to !== "NEW") {
        await db.insert(auditEvents).values({
          id: randomUUID(),
          requestId: id,
          action:
            event.to === "CANCELLED"
              ? AUDIT_ACTIONS.REQUEST_CANCELLED
              : AUDIT_ACTIONS.STATUS_CHANGED,
          actorId,
          detail: `Status changed from ${previous} to ${event.to}`,
          createdAt: ago(event.hoursAgo),
        });
      }

      previous = event.to;
    }

    await db.insert(auditEvents).values({
      id: randomUUID(),
      requestId: id,
      action: AUDIT_ACTIONS.REQUEST_CREATED,
      actorId: null,
      detail: `Request received from ${seed.customerName}`,
      createdAt: seed.createdAt,
    });

    if (seed.providerEmail) {
      await db.insert(auditEvents).values({
        id: randomUUID(),
        requestId: id,
        action: AUDIT_ACTIONS.PROVIDER_ASSIGNED,
        actorId: adminId,
        detail: `${providerNameByEmail[seed.providerEmail]} assigned for ${seed.scheduledDate}`,
        createdAt: ago(26),
      });
    }

    for (const note of seed.notes ?? []) {
      await db.insert(internalNotes).values({
        id: randomUUID(),
        requestId: id,
        authorId: providerIdByEmail[note.authorEmail],
        body: note.body,
        createdAt: note.createdAt,
      });

      await db.insert(auditEvents).values({
        id: randomUUID(),
        requestId: id,
        action: AUDIT_ACTIONS.NOTE_ADDED,
        actorId: providerIdByEmail[note.authorEmail],
        detail: "Internal note added",
        createdAt: note.createdAt,
      });
    }
  }

  await db.execute(sql`select 1`);
}
