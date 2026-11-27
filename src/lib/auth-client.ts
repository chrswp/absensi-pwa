import { createAuthClient } from "@neondatabase/auth";
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters";

type SessionState = {
  data: { user: { id: string; name: string; email: string; emailVerified: boolean } } | null;
  isPending: boolean;
};

const baseURL = typeof window === "undefined" ? "http://localhost/api/auth" : `${window.location.origin}/api/auth`;
export const authClient = createAuthClient(baseURL, { adapter: BetterAuthReactAdapter() });
export const useAuthSession = (): SessionState => (authClient.useSession as unknown as () => SessionState)();
