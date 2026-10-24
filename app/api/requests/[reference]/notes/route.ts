import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { AppError } from "@/lib/errors";
import { errorResponse, newRequestId, readJson } from "@/lib/http";
import { addInternalNote } from "@/lib/requests";
import { noteSchema, parseInput } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** FR-10: internal note. Never exposed through the customer lookup. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const requestId = newRequestId();

  try {
    const user = await requireApiUser();
    const { reference } = await params;

    const body = await readJson(request);
    const parsed = parseInput(noteSchema, body);
    if (!parsed.ok) {
      throw new AppError("VALIDATION", 400, parsed.message, parsed.fieldErrors);
    }

    await addInternalNote({
      reference,
      body: parsed.data.body,
      actor: user,
    });

    return NextResponse.json({ ok: true, requestId }, { status: 201 });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
