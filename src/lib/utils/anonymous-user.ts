const STORAGE_KEY = "simpleshare_anon_user_id";

/**
 * Returns an anonymous persistent UUID stored in localStorage.
 * Generates and saves a new random UUID if one does not exist yet.
 */
export function getOrCreateAnonymousUserId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    let anonId = localStorage.getItem(STORAGE_KEY);
    if (!anonId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(anonId)) {
      anonId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, anonId);
    }
    return anonId;
  } catch {
    // Fallback if localStorage is disabled or restricted
    return "";
  }
}
