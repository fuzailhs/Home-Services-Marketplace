import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { AppError } from "@/lib/errors";
import { errorResponse, newRequestId, readJson } from "@/lib/http";
import { assignProvider } from "@/lib/requests";
import { assignSchema, parseInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** FR-07: assign or change the provider (administrator only). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const requestId = newRequestId();

  try {
    const user = await requireApiUser("ADMIN");
    const { reference } = await params;

    const body = await readJson(request);
    const parsed = parseInput(assignSchema, body);
    if (!parsed.ok) {
      throw new AppError("VALIDATION", 400, parsed.message, parsed.fieldErrors);
    }

    await assignProvider({
      reference,
      providerId: parsed.data.providerId,
      scheduledDate: parsed.data.scheduledDate,
      expectedStatus: parsed.data.expectedStatus,
      actor: user,
    });

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
