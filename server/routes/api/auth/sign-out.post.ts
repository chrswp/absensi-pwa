import { defineHandler } from "nitro";
import { getRequestHeader } from "nitro/h3";
import { removeSession, sessionCookie } from "../../../utils/local-auth";

export default defineHandler(async (event) => {
  await removeSession(getRequestHeader(event, "cookie") ?? null);
  event.res.headers.set("set-cookie", sessionCookie("", 0));
  event.res.headers.set("cache-control", "no-store");
  return { ok: true };
});
