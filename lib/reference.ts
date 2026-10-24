import { randomInt } from "node:crypto";
import { buildReference } from "@/lib/reference-format";

/**
 * Reference numbers are public and non-sequential (FR-02): they must not reveal
 * how many requests exist. Ambiguous characters (0/O, 1/I) are excluded so a
 * reference can be read over the phone without mistakes.
 */
export function generateReference(random: (max: number) => number = randomInt): string {
  return buildReference(random);
}

export { REFERENCE_PATTERN, normaliseReference } from "@/lib/reference-format";
