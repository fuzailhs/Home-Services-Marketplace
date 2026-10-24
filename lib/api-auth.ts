import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function requireApiUser(role?: Role): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    throw new AppError("UNAUTHENTICATED", 401, "Sign in to continue.");
  }

  if (role && user.role !== role) {
    throw new AppError("FORBIDDEN", 403, "Your account cannot perform this action.");
  }

  return user;
}

export function noStore<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set("Cache-Control", "no-store");
  return response;
}
