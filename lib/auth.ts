import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { cache } from "react";
import { config, SESSION_COOKIE } from "@/lib/config";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import type { Category, Role } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  category: Category | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(`${token}:${config.authSecret}`).digest("hex");
}

export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.sessionMaxAgeSeconds * 1000);

  await db.insert(sessions).values({
    id: randomUUID(),
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    path: "/",
    maxAge: config.sessionMaxAgeSeconds,
  });

  return { token, expiresAt };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  store.delete(SESSION_COOKIE);

  if (!token) return;
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

/** Reads the session cookie and resolves the active staff member, if any. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      category: users.category,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row || !row.isActive) return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    category: row.category,
  };
});

export async function requireUser(role?: Role): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  if (role && user.role !== role) {
    redirect(user.role === "ADMIN" ? "/admin" : "/provider");
  }

  return user;
}
