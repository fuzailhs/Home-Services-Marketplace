/** Error type used by the service layer so routes can return a safe, stable shape. */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(
    code: string,
    status: number,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const notFoundError = () =>
  new AppError(
    "NOT_FOUND",
    404,
    "We could not find a request with that reference number and email address.",
  );

export const staleStateError = () =>
  new AppError(
    "STALE_STATE",
    409,
    "This request changed while you were working on it. Reload and try again.",
  );
