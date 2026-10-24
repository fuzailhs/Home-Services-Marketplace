import { seedDatabase } from "@/scripts/seed";

/** Resets the board to the documented demo data. */
async function main() {
  await seedDatabase();
  console.log("Demo data reset: 4 staff accounts and 6 requests.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
