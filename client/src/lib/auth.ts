export const SESSION_STORAGE_KEY = "serialgrapher:user";

export interface StoredUser {
  id: string;
  username: string;
  fullName: string;
  role: "user" | "admin";
}

const isBrowser = typeof window !== "undefined";

export function loadUser(): StoredUser | null {
  if (!isBrowser) {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser;
    if (parsed && parsed.id && parsed.username && parsed.role) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to parse stored user", error);
  }

  return null;
}

export function saveUser(user: StoredUser) {
  if (!isBrowser) {
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function clearUser() {
  if (!isBrowser) {
    return;
  }
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
