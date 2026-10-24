import { describe, expect, it } from "vitest";
import { canTransition, nextStatusesFor } from "@/lib/transitions";

describe("status transitions", () => {
  it("lets a provider move assigned to in progress only", () => {
    expect(canTransition("ASSIGNED", "IN_PROGRESS", "PROVIDER")).toBe(true);
    expect(canTransition("ASSIGNED", "COMPLETED", "PROVIDER")).toBe(false);
    expect(canTransition("ASSIGNED", "CANCELLED", "PROVIDER")).toBe(false);
  });

  it("lets a provider complete an in-progress job", () => {
    expect(canTransition("IN_PROGRESS", "COMPLETED", "PROVIDER")).toBe(true);
  });

  it("refuses skipped and reversed statuses", () => {
    expect(canTransition("NEW", "IN_PROGRESS", "PROVIDER")).toBe(false);
    expect(canTransition("COMPLETED", "IN_PROGRESS", "PROVIDER")).toBe(false);
    expect(canTransition("COMPLETED", "ASSIGNED", "ADMIN")).toBe(false);
  });

  it("lets an administrator cancel only new or assigned work", () => {
    expect(canTransition("NEW", "CANCELLED", "ADMIN")).toBe(true);
    expect(canTransition("ASSIGNED", "CANCELLED", "ADMIN")).toBe(true);
    expect(canTransition("IN_PROGRESS", "CANCELLED", "ADMIN")).toBe(false);
  });

  it("offers no next steps for closed requests", () => {
    expect(nextStatusesFor("COMPLETED", "ADMIN")).toEqual([]);
    expect(nextStatusesFor("CANCELLED", "ADMIN")).toEqual([]);
  });
});
