// Codes that already carry "check your connection and try again" messaging
// in getAuthErrorMessage (authService.ts) -- i.e. the app already treats
// these as transient, recoverable network conditions rather than real
// failures. This is the same set, just acted on automatically once before
// the user has to.
const TRANSIENT_ERROR_CODES = new Set([
  "auth/network-request-failed",
  "unavailable",
  "firestore/unavailable",
  "deadline-exceeded",
  "firestore/deadline-exceeded",
]);

function getErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }

  return null;
}

export function isTransientNetworkError(error: unknown) {
  const code = getErrorCode(error);
  return code !== null && TRANSIENT_ERROR_CODES.has(code);
}

function wait(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

// Only safe to wrap operations where a lost-response retry can't double up
// real-world effects -- Firebase Auth calls (sign-in, sign-up, password
// reset) are safe because a retried request either succeeds identically or
// fails with a specific, sensible error (e.g. email-already-in-use) instead
// of silently duplicating data. Not intended for arbitrary Firestore writes.
export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  options: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  const { retries = 2, delayMs = 800 } = options;

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= retries || !isTransientNetworkError(error)) {
        throw error;
      }

      await wait(delayMs);
    }
  }
}
