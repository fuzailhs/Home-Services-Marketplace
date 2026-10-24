import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";
import { errorResponse, newRequestId, readJson } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { parseInput, signInSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let dummyHash: string | null = null;

/** FR-04: staff sign in. The error never says which field was wrong. */
export async function POST(request: Request) {
  const requestId = newRequestId();

  try {
    const limit = rateLimit(clientKey(request, "sign-in"), 8, 5 * 60 * 1000);
    if (!limit.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        429,
        "Too many sign-in attempts. Please wait a few minutes and try again.",
      );
    }

    const body = await readJson(request);
    const parsed = parseInput(signInSchema, body);
    if (!parsed.ok) {
      throw new AppError("VALIDATION", 400, parsed.message, parsed.fieldErrors);
    }

    const db = await getDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.email})`, parsed.data.email))
      .limit(1);

    const user = rows[0];

    if (!user) {
      // Spend the same work as a real check so timing does not reveal accounts.
      dummyHash ??= await hashPassword("not-a-real-password");
      await verifyPassword(parsed.data.password, dummyHash);
      throw new AppError("INVALID_CREDENTIALS", 401, "Email or password is incorrect.");
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid || !user.isActive) {
      throw new AppError("INVALID_CREDENTIALS", 401, "Email or password is incorrect.");
    }

    await createSession(user.id);

    return NextResponse.json(
      {
        ok: true,
        user: { fullName: user.fullName, role: user.role },
        redirectTo: user.role === "ADMIN" ? "/admin" : "/provider",
        requestId,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
