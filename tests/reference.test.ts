import { describe, expect, it } from "vitest";
import { generateReference } from "@/lib/reference";
import { REFERENCE_PATTERN, normaliseReference } from "@/lib/reference-format";

describe("reference numbers", () => {
  it("matches the public format", () => {
    const reference = generateReference();
    expect(reference).toMatch(REFERENCE_PATTERN);
  });

  it("never uses ambiguous characters", () => {
    for (let index = 0; index < 200; index += 1) {
      expect(generateReference()).not.toMatch(/[01IO]/);
    }
  });

  it("is not sequential", () => {
    const first = generateReference();
    const second = generateReference();
    expect(first).not.toBe(second);
  });

  it("normalises spaces and case before lookup", () => {
    expect(normaliseReference("  hsm-k4tq-9wdm ")).toBe("HSM-K4TQ-9WDM");
    expect(normaliseReference("HSM K4TQ 9WDM")).toBe("HSMK4TQ9WDM");
  });
});
