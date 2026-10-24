import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(root) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Embedded PostgreSQL takes a few seconds to boot on a cold run.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
