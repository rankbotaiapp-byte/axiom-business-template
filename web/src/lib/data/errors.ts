export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function fail<T>(error: string): ActionResult<T> {
  return { ok: false, error };
}

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fromUnknown(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The record could not be written.";
}
