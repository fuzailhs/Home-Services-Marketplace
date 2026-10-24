import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { errorResponse, newRequestId, readJson } from "@/lib/http";
import { lookupRequest } from "@/lib/requests";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { lookupSchema, parseInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** FR-03 + FR-11: reference plus email, customer-safe data only. */
export async function POST(request: Request) {
  const requestId = newRequestId();

  try {
    const limit = rateLimit(clientKey(request, "lookup"), 20, 10 * 60 * 1000);
    if (!limit.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        429,
        "Too many lookups from this connection. Please wait a few minutes and try again.",
      );
    }

    const body = await readJson(request);
    const parsed = parseInput(lookupSchema, body);
    if (!parsed.ok) {
      throw new AppError("VALIDATION", 400, parsed.message, parsed.fieldErrors);
    }

    const { request: record, events } = await lookupRequest(
      parsed.data.reference,
      parsed.data.email,
    );

    // Deliberately no provider identity, staff names, internal notes or audit trail.
    return NextResponse.json(
      {
        request: {
          reference: record.reference,
          category: record.category,
          status: record.status,
          serviceArea: record.serviceArea,
          description: record.description,
          preferredDate: record.preferredDate,
          scheduledDate: record.scheduledDate,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
        events: events.map((event) => ({
          id: event.id,
          toStatus: event.toStatus,
          publicText: event.publicText,
          createdAt: event.createdAt,
        })),
        requestId,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
