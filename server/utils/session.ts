const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL!;

export type Session = { user: { id: string; name: string; email: string; emailVerified: boolean } } | null;

function restoreUpstreamCookieName(name: string): string {
  if (name.startsWith("__Secure_")) return `__Secure-${name.slice("__Secure_".length)}`;
  if (name.startsWith("__Host_")) return `__Host-${name.slice("__Host_".length)}`;
  return name;
}

export function normalizeAuthCookieHeader(cookieHeader: string, isHttp: boolean): string {
  const parts = cookieHeader.split(";").map((part) => part.trim()).filter(Boolean);
  const normalized: string[] = [];
  const seenPreviewCookieNames = new Set<string>();

  for (const part of parts) {
    const separator = part.indexOf("=");
    const name = (separator === -1 ? part : part.slice(0, separator)).trim();
    const value = separator === -1 ? "" : part.slice(separator + 1);
    const isPreviewCookie = name.startsWith("__Secure_") || name.startsWith("__Host_");
    const isSecureCookie = name.startsWith("__Secure-") || name.startsWith("__Host-");
    if (isHttp) {
      if (isSecureCookie) continue;
      if (isPreviewCookie) {
        const restoredName = restoreUpstreamCookieName(name);
        if (seenPreviewCookieNames.has(restoredName)) continue;
        seenPreviewCookieNames.add(restoredName);
        normalized.push(`${restoredName}=${value}`);
        continue;
      }
    } else if (isPreviewCookie) continue;
    normalized.push(`${name}=${value}`);
  }
  return normalized.join("; ");
}

export async function getSessionFromCookie(cookieHeader: string | null, isHttp: boolean): Promise<Session> {
  if (!cookieHeader) return null;
  const cookie = normalizeAuthCookieHeader(cookieHeader, isHttp);
  if (!cookie) return null;
  const res = await fetch(`${NEON_AUTH_BASE_URL}/get-session`, { headers: { cookie } });
  if (!res.ok) return null;
  const session = await res.json() as Session;
  return session?.user ? session : null;
}
