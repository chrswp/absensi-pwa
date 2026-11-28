import { useEffect, useState } from "react";

export type AuthUser = { id: string; username: string; name: string; role: "Admin" | "Karyawan" };
type AuthSession = { user: AuthUser } | null;
type SessionState = { data: AuthSession; isPending: boolean };

async function authRequest<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.statusMessage || result.message || "Permintaan autentikasi gagal.");
  return result as T;
}

export const authClient = {
  signIn: (data: { username: string; password: string }) => authRequest<{ session: AuthSession }>("sign-in", data),
  signUp: (data: { username: string; password: string; adminSetupToken?: string }) => authRequest<{ session: AuthSession }>("sign-up", data),
  signOut: async (_options?: Record<string, never>) => {
    const result = await authRequest<{ ok: boolean }>("sign-out", {});
    window.location.assign("/auth/sign-in");
    return result;
  },
};

export function useAuthSession(): SessionState {
  const [state, setState] = useState<SessionState>({ data: null, isPending: true });
  useEffect(() => {
    let active = true;
    authRequest<{ session: AuthSession }>("session")
      .then(({ session }) => { if (active) setState({ data: session, isPending: false }); })
      .catch(() => { if (active) setState({ data: null, isPending: false }); });
    return () => { active = false; };
  }, []);
  return state;
}
