import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { AppError } from "@/lib/errors";
import { errorResponse, newRequestId, readJson } from "@/lib/http";
import { updateStatus } from "@/lib/requests";
import { parseInput, statusUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** FR-09: move a job through its permitted statuses (assigned staff only). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const requestId = newRequestId();

  try {
    const user = await requireApiUser();
    const { reference } = await params;

    const body = await readJson(request);
    const parsed = parseInput(statusUpdateSchema, body);
    if (!parsed.ok) {
      throw new AppError("VALIDATION", 400, parsed.message, parsed.fieldErrors);
    }

    await updateStatus({
      reference,
      status: parsed.data.status,
      expectedStatus: parsed.data.expectedStatus,
      note: parsed.data.note || undefined,
      actor: user,
    });

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
