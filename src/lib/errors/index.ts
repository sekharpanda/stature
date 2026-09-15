export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    message: string,
    options?: { code?: string; status?: number; details?: unknown },
  ) {
    super(message);
    this.name = "AppError";
    this.code = options?.code ?? "APP_ERROR";
    this.status = options?.status ?? 400;
    this.details = options?.details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, { code: "UNAUTHORIZED", status: 401 });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, { code: "FORBIDDEN", status: 403 });
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, { code: "NOT_FOUND", status: 404 });
    this.name = "NotFoundError";
  }
}

const DATABASE_UNAVAILABLE_CODES = new Set([
  "P1001",
  "P1002",
  "P1017",
  "P2024",
]);

export function isDatabaseUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  if (DATABASE_UNAVAILABLE_CODES.has(code)) return true;
  const message = error instanceof Error ? error.message : String(error);
  const cause =
    "cause" in error && error.cause != null ? String(error.cause) : "";
  const haystack = `${message} ${cause}`;
  return (
    haystack.includes("Can't reach database") ||
    haystack.includes("Timed out fetching a new connection") ||
    haystack.includes("connection pool") ||
    haystack.includes("kind: Closed") ||
    haystack.includes("Server has closed the connection") ||
    haystack.includes("Connection terminated") ||
    haystack.includes("Connection closed")
  );
}

export function publicDatabaseUnavailableMessage() {
  return "We're reconnecting to the database. Please refresh in a moment.";
}

export function publicPageLoadError(error: unknown, fallback: string) {
  return isDatabaseUnavailable(error)
    ? publicDatabaseUnavailableMessage()
    : fallback;
}
