export interface ApiFieldErrors {
  [field: string]: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      fieldErrors: ApiFieldErrors;
    };

export async function sendJson<T>(
  url: string,
  method: "POST" | "PATCH" | "GET",
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: { code?: string; message?: string; fieldErrors?: ApiFieldErrors } }
      | null;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        code: payload?.error?.code ?? "ERROR",
        message:
          payload?.error?.message ?? "Something went wrong. Please try again.",
        fieldErrors: payload?.error?.fieldErrors ?? {},
      };
    }

    return { ok: true, data: payload as T };
  } catch {
    return {
      ok: false,
      status: 0,
      code: "NETWORK",
      message: "We could not reach the server. Check your connection and try again.",
      fieldErrors: {},
    };
  }
}
