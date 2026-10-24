import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { AppError } from "@/lib/errors";
import { errorResponse, newRequestId, readJson } from "@/lib/http";
import { createRequest, listRequests } from "@/lib/requests";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { parseInput, queueFilterSchema, requestInputSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** FR-05: administrator queue with filters. */
export async function GET(request: Request) {
  const requestId = newRequestId();

  try {
    await requireApiUser("ADMIN");

    const url = new URL(request.url);
    const parsed = queueFilterSchema.safeParse({
      category: url.searchParams.get("category") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      view: url.searchParams.get("view") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
    });

    const filters = parsed.success ? parsed.data : {};
    const rows = await listRequests(filters);

    return NextResponse.json(
      { requests: rows, requestId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

/** FR-01 + FR-02: public request submission. */
export async function POST(request: Request) {
  const requestId = newRequestId();

  try {
    const limit = rateLimit(clientKey(request, "create-request"), 10, 10 * 60 * 1000);
    if (!limit.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        429,
        "Too many requests from this connection. Please wait a few minutes and try again.",
      );
    }

    const body = await readJson(request);
    const parsed = parseInput(requestInputSchema, body);
    if (!parsed.ok) {
      throw new AppError("VALIDATION", 400, parsed.message, parsed.fieldErrors);
    }

    const result = await createRequest(parsed.data);

    return NextResponse.json(
      {
        request: {
          reference: result.reference,
          status: "NEW",
          category: parsed.data.category,
          preferredDate: parsed.data.preferredDate,
          email: parsed.data.email,
        },
        requestId,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
