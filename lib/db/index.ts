import path from "node:path";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { assertServerConfig, config } from "@/lib/config";
import { DDL } from "./ddl";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __hsmDatabase?: Promise<Database>;
};

async function connect(): Promise<Database> {
  assertServerConfig();

  if (config.databaseUrl.startsWith("postgres")) {
    const pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      ssl: config.pgSsl ? { rejectUnauthorized: false } : false,
    });
    await pool.query(DDL);
    return drizzleNode(pool, { schema }) as unknown as Database;
  }

  // Embedded PostgreSQL for the local demo. Same SQL, same semantics.
  const dataDir =
    config.pgliteDataDir === "memory://"
      ? config.pgliteDataDir
      : path.resolve(process.cwd(), config.pgliteDataDir);

  if (dataDir !== "memory://") {
    await fs.mkdir(dataDir, { recursive: true });
  }

  const client = new PGlite(dataDir);
  await client.waitReady;
  await client.exec(DDL);
  return drizzlePglite(client, { schema }) as unknown as Database;
}

export function getDb(): Promise<Database> {
  if (!globalForDb.__hsmDatabase) {
    globalForDb.__hsmDatabase = connect().catch((error) => {
      globalForDb.__hsmDatabase = undefined;
      throw error;
    });
  }
  return globalForDb.__hsmDatabase;
}
