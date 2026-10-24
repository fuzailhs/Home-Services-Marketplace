import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, newRequestId } from "@/lib/http";
import { listActiveProviders } from "@/lib/requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Active providers only — inactive accounts are never assignable. */
export async function GET() {
  const requestId = newRequestId();

  try {
    await requireApiUser("ADMIN");
    const providers = await listActiveProviders();

    return NextResponse.json(
      { providers, requestId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
