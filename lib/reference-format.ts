/**
 * Reference helpers that are safe to import on the client as well as the server.
 * The generator itself lives in `lib/reference.ts` because it needs crypto.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const REFERENCE_PATTERN = /^HSM-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

export function normaliseReference(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function buildReference(random: (max: number) => number): string {
  const groups: string[] = [];
  for (let group = 0; group < 2; group += 1) {
    let chunk = "";
    for (let index = 0; index < 4; index += 1) {
      chunk += ALPHABET[random(ALPHABET.length)];
    }
    groups.push(chunk);
  }
  return `HSM-${groups.join("-")}`;
}
