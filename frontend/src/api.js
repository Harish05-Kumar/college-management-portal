const API_BASE_URL = "";

const AUTH_TOKEN_KEY = "authToken";
const USER_ID_KEY = "userId";
const ROLE_KEY = "role";
const LEGACY_STORAGE_KEYS = [
  "placement_token",
  "placement_email",
  "placement_role",
  "currentUser",
  "user",
  "login",
  "admin.authToken",
  "admin.userId",
  "admin.role",
  "student.authToken",
  "student.userId",
  "student.role"
];

export function normalizeRole(role) {
  if (role === "ROLE_ADMIN" || role === "ADMIN") return "ADMIN";
  if (role === "ROLE_STUDENT" || role === "STUDENT") return "STUDENT";
  return "";
}

export function getRoleFromPath(path = window.location.pathname) {
  if (path.startsWith("/admin")) return "ADMIN";
  if (path.startsWith("/student")) return "STUDENT";
  return "";
}

function emptySession() {
  return { token: null, userId: null, role: null };
}

function removeLegacyStorage() {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
}

export function getStoredSession() {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  const userId = sessionStorage.getItem(USER_ID_KEY);
  const role = normalizeRole(sessionStorage.getItem(ROLE_KEY));

  if (!token || !role) {
    return emptySession();
  }

  return { token, userId, role };
}

export function getToken(expectedRole) {
  const session = getStoredSession();
  const role = normalizeRole(expectedRole);

  if (role && session.role !== role) {
    return null;
  }

  return session.token;
}

export function setSession(session) {
  const normalizedRole = normalizeRole(session.role);
  const userId = String(session.userId ?? session.id ?? session.email ?? "");

  if (!session.token || !normalizedRole) {
    clearSession();
    return emptySession();
  }

  sessionStorage.setItem(AUTH_TOKEN_KEY, session.token);
  sessionStorage.setItem(USER_ID_KEY, userId);
  sessionStorage.setItem(ROLE_KEY, normalizedRole);
  removeLegacyStorage();

  return { token: session.token, userId, role: normalizedRole };
}

export function clearSession(expectedRole) {
  const normalizedExpectedRole = normalizeRole(expectedRole);
  const currentRole = normalizeRole(sessionStorage.getItem(ROLE_KEY));

  if (!normalizedExpectedRole || currentRole === normalizedExpectedRole) {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
    sessionStorage.removeItem(ROLE_KEY);
  }

  removeLegacyStorage();
}

export async function apiRequest(path, options = {}) {
  const { role, ...fetchOptions } = options;
  const headers = new Headers(options.headers || {});
  const token = getToken(role);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
    body: options.body instanceof FormData ? options.body : JSON.stringify(options.body)
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || "Request failed");
    error.status = response.status;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response.text();
}
