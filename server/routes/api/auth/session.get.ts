import { defineHandler } from "nitro";
import { getRequestHeader } from "nitro/h3";
import { getSessionFromCookie } from "../../../utils/local-auth";

export default defineHandler(async (event) => {
  event.res.headers.set("cache-control", "no-store");
  return { session: await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null) };
});
