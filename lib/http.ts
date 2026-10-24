import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";

/** Correlation id returned to the client and written to the server log. */
export function newRequestId(): string {
  return randomUUID().slice(0, 8);
}

export function errorResponse(error: unknown, requestId: string): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
        },
        requestId,
      },
      { status: error.status },
    );
  }

  // Never log request bodies, passwords or stack traces for the client.
  console.error(`[${requestId}] Unhandled route error:`, (error as Error)?.message);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL",
        message: "Something went wrong on our side. Please try again.",
        fieldErrors: {},
      },
      requestId,
    },
    { status: 500 },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("INVALID_JSON", 400, "Send a valid JSON body.");
  }
}
