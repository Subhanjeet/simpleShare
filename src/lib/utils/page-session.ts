let pageInstanceSessionId: string | null = null;

/**
 * Returns the unique in-memory page instance session ID.
 * Generates a fresh UUID per page load/refresh.
 */
export function getPageInstanceSessionId(): string {
  if (!pageInstanceSessionId) {
    pageInstanceSessionId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
  return pageInstanceSessionId;
}
