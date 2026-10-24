import { describe, expect, it } from "vitest";
import { todayIso } from "@/lib/today";
import { parseInput, requestInputSchema } from "@/lib/validation";

function validInput(overrides: Record<string, unknown> = {}) {
  const today = new Date(`${todayIso()}T12:00:00Z`);
  const tomorrow = new Date(today.getTime() + 86_400_000).toISOString().slice(0, 10);

  return {
    customerName: "Helen Marsh",
    email: "helen.marsh@example.com",
    phone: "07700 900112",
    serviceArea: "Riverside",
    category: "PLUMBING",
    preferredDate: tomorrow,
    description: "The kitchen tap is dripping under the sink and the floor is wet.",
    ...overrides,
  };
}

describe("request validation (FR-01)", () => {
  it("accepts a complete request and normalises the email", () => {
    const result = parseInput(requestInputSchema, validInput({ email: "  Helen.Marsh@Example.COM " }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("helen.marsh@example.com");
    }
  });

  it("rejects a description shorter than 20 characters", () => {
    const result = parseInput(requestInputSchema, validInput({ description: "Leaking tap" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.description).toContain("20 characters");
  });

  it("rejects a description longer than 500 characters", () => {
    const result = parseInput(requestInputSchema, validInput({ description: "x".repeat(501) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.description).toBeDefined();
  });

  it("rejects a past preferred date", () => {
    const result = parseInput(requestInputSchema, validInput({ preferredDate: "2020-01-01" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.preferredDate).toBeDefined();
  });

  it("rejects an unknown service category", () => {
    const result = parseInput(requestInputSchema, validInput({ category: "ROOFING" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors.category).toBeDefined();
  });

  it("rejects an invalid email and phone", () => {
    const result = parseInput(
      requestInputSchema,
      validInput({ email: "not-an-email", phone: "call me" }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.fieldErrors.phone).toBeDefined();
    }
  });

  it("returns one message per field, not a stack of duplicates", () => {
    const result = parseInput(requestInputSchema, validInput({ description: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.fieldErrors)).toEqual(["description"]);
  });
});
