import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";
import { errorResponse, newRequestId } from "@/lib/http";
import { getRequestForStaff } from "@/lib/requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** FR-06: staff request detail. Providers only reach their own jobs. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const requestId = newRequestId();

  try {
    const user = await requireApiUser();
    const { reference } = await params;
    const detail = await getRequestForStaff(reference, user);

    return NextResponse.json(
      { request: detail, requestId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
