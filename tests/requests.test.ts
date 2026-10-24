import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

// The demo database is embedded PostgreSQL, so these tests exercise the real
// SQL, transactions and constraints — not a mock.
process.env.PGLITE_DATA_DIR = "memory://";
process.env.AUTH_SECRET = "test-secret";

type RequestsModule = typeof import("@/lib/requests");
type SessionUser = import("@/lib/auth").SessionUser;

let api: RequestsModule;
let admin: SessionUser;
let maria: SessionUser;
let daniel: SessionUser;

function validRequest(overrides: Record<string, unknown> = {}) {
  const date = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  return {
    customerName: "Test Customer",
    email: "test.customer@example.com",
    phone: "07700 900999",
    serviceArea: "Riverside",
    category: "PLUMBING" as const,
    preferredDate: date,
    description: "The kitchen tap is dripping under the sink and the floor is wet.",
    ...overrides,
  } as Parameters<RequestsModule["createRequest"]>[0];
}

beforeAll(async () => {
  const { getDb } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { hashPassword } = await import("@/lib/password");
  api = await import("@/lib/requests");

  const db = await getDb();
  const passwordHash = await hashPassword("Test123!");

  const adminId = randomUUID();
  const mariaId = randomUUID();
  const danielId = randomUUID();

  await db.insert(users).values([
    {
      id: adminId,
      email: "admin@test.local",
      fullName: "Test Admin",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    {
      id: mariaId,
      email: "maria@test.local",
      fullName: "Maria Test",
      passwordHash,
      role: "PROVIDER",
      category: "PLUMBING",
      isActive: true,
    },
    {
      id: danielId,
      email: "daniel@test.local",
      fullName: "Daniel Test",
      passwordHash,
      role: "PROVIDER",
      category: "ELECTRICAL",
      isActive: true,
    },
  ]);

  admin = {
    id: adminId,
    email: "admin@test.local",
    fullName: "Test Admin",
    role: "ADMIN",
    category: null,
  };
  maria = {
    id: mariaId,
    email: "maria@test.local",
    fullName: "Maria Test",
    role: "PROVIDER",
    category: "PLUMBING",
  };
  daniel = {
    id: danielId,
    email: "daniel@test.local",
    fullName: "Daniel Test",
    role: "PROVIDER",
    category: "ELECTRICAL",
  };
});

describe("request lifecycle", () => {
  it("stores a request with a public reference and a New event", async () => {
    const { reference } = await api.createRequest(validRequest());
    expect(reference).toMatch(/^HSM-[A-Z2-9]{4}-[A-Z2-9]{4}$/);

    const { request, events } = await api.lookupRequest(
      reference,
      "test.customer@example.com",
    );
    expect(request.status).toBe("NEW");
    expect(events).toHaveLength(1);
    expect(events[0].toStatus).toBe("NEW");
  });

  it("returns the same neutral error for a wrong email or reference", async () => {
    const { reference } = await api.createRequest(validRequest());

    await expect(
      api.lookupRequest(reference, "someone.else@example.com"),
    ).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });

    await expect(
      api.lookupRequest("HSM-XXXX-XXXX", "test.customer@example.com"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("assigns a provider, then lets that provider complete the job", async () => {
    const { reference } = await api.createRequest(validRequest());
    const scheduledDate = new Date(Date.now() + 3 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    await api.assignProvider({
      reference,
      providerId: maria.id,
      scheduledDate,
      expectedStatus: "NEW",
      actor: admin,
    });

    let detail = await api.getRequestForStaff(reference, admin);
    expect(detail.status).toBe("ASSIGNED");
    expect(detail.providerId).toBe(maria.id);
    expect(detail.events.map((event) => event.toStatus)).toEqual(["NEW", "ASSIGNED"]);

    await api.updateStatus({
      reference,
      status: "IN_PROGRESS",
      expectedStatus: "ASSIGNED",
      note: "On my way, 20 minutes out.",
      actor: maria,
    });

    await api.updateStatus({
      reference,
      status: "COMPLETED",
      expectedStatus: "IN_PROGRESS",
      actor: maria,
    });

    detail = await api.getRequestForStaff(reference, admin);
    expect(detail.status).toBe("COMPLETED");
    expect(detail.notes).toHaveLength(1);
    expect(detail.audit.some((event) => event.action === "request.note_added")).toBe(true);
    expect(detail.audit.some((event) => event.action === "request.status_changed")).toBe(true);
  });

  it("refuses a skipped status change", async () => {
    const { reference } = await api.createRequest(validRequest());
    await api.assignProvider({
      reference,
      providerId: maria.id,
      scheduledDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      expectedStatus: "NEW",
      actor: admin,
    });

    await expect(
      api.updateStatus({
        reference,
        status: "COMPLETED",
        expectedStatus: "ASSIGNED",
        actor: maria,
      }),
    ).rejects.toMatchObject({ status: 409, code: "INVALID_TRANSITION" });
  });

  it("refuses a stale update", async () => {
    const { reference } = await api.createRequest(validRequest());
    await expect(
      api.updateStatus({
        reference,
        status: "CANCELLED",
        expectedStatus: "ASSIGNED",
        actor: admin,
      }),
    ).rejects.toMatchObject({ status: 409, code: "STALE_STATE" });
  });

  it("hides another provider's job", async () => {
    const { reference } = await api.createRequest(validRequest());
    await api.assignProvider({
      reference,
      providerId: maria.id,
      scheduledDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      expectedStatus: "NEW",
      actor: admin,
    });

    await expect(api.getRequestForStaff(reference, daniel)).rejects.toMatchObject({
      status: 404,
    });

    await expect(api.getRequestForStaff(reference, maria)).resolves.toMatchObject({
      reference,
    });
  });

  it("never exposes internal notes through the customer lookup", async () => {
    const { reference } = await api.createRequest(validRequest());
    await api.addInternalNote({
      reference,
      body: "Gate code is 4411 — do not share with the customer.",
      actor: admin,
    });

    const { request, events } = await api.lookupRequest(
      reference,
      "test.customer@example.com",
    );

    const customerView = JSON.stringify({ request, events });
    expect(customerView).not.toContain("4411");
    expect(customerView).not.toContain("Test Admin");
    expect(customerView).not.toContain("internal");
  });

  it("refuses to assign an inactive provider", async () => {
    const { reference } = await api.createRequest(validRequest());
    const { getDb } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { hashPassword } = await import("@/lib/password");
    const db = await getDb();

    const inactiveId = randomUUID();
    await db.insert(users).values({
      id: inactiveId,
      email: "inactive@test.local",
      fullName: "Inactive Provider",
      passwordHash: await hashPassword("Test123!"),
      role: "PROVIDER",
      category: "CLEANING",
      isActive: false,
    });

    await expect(
      api.assignProvider({
        reference,
        providerId: inactiveId,
        scheduledDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
        expectedStatus: "NEW",
        actor: admin,
      }),
    ).rejects.toMatchObject({ status: 422, code: "PROVIDER_UNAVAILABLE" });
  });
});
