import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { seedDatabase } from "@/scripts/seed";

/**
 * Applies the schema (on connect) and seeds the demo board when it is empty.
 * Safe to run on every `npm run dev`: existing demo data is left alone.
 */
async function main() {
  const db = await getDb();
  const existing = await db.select({ id: users.id }).from(users).limit(1);

  if (existing.length > 0) {
    console.log("Database ready — demo data already present.");
    return;
  }

  await seedDatabase();
  console.log("Database ready — seeded 4 staff accounts and 6 requests.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Database setup failed:", error);
    process.exit(1);
  });
