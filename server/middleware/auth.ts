import { defineHandler } from "nitro";
import { createError, getRequestHeader, getRequestURL } from "nitro/h3";
import { getSessionFromCookie } from "../utils/session";

const PUBLIC_PREFIXES = ["/api/auth/", "/auth/"];

export default defineHandler(async (event) => {
  // Nginx overwrites this header after Cloudflare terminates public HTTPS.
  const url = getRequestURL(event, { xForwardedProto: true });
  if (PUBLIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;
  if (!url.pathname.startsWith("/api/")) return;
  const session = await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null, url.protocol === "http:");
  if (!session?.user) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  event.context.user = session.user;
});
