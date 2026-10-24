/**
 * Runtime configuration.
 *
 * Every deployment-specific value comes from the environment (section 8 of the
 * brief). Nothing here is a secret: the defaults exist only so the local demo
 * starts with zero setup.
 */
import { APP_TIME_ZONE } from "@/lib/today";

const isProduction = process.env.NODE_ENV === "production";

const authSecret =
  process.env.AUTH_SECRET ?? "local-demo-only-secret-not-for-production";

export const config = {
  /** Hosted PostgreSQL connection string. When empty, embedded PGlite is used. */
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** Directory for the embedded PostgreSQL data files. */
  pgliteDataDir: process.env.PGLITE_DATA_DIR ?? ".data/pglite",
  pgSsl: process.env.PGSSL === "true",
  authSecret,
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  sessionMaxAgeSeconds: Number(process.env.SESSION_MAX_AGE ?? 60 * 60 * 8),
  appTimeZone: APP_TIME_ZONE,
  isProduction,
} as const;

/** Fails closed: production must never start with the demo signing secret. */
export function assertServerConfig(): void {
  if (config.isProduction && authSecret.startsWith("local-demo-only")) {
    throw new Error(
      "AUTH_SECRET must be set in production. Refusing to start with the demo secret.",
    );
  }
}

export const SESSION_COOKIE = "hsm_session";
