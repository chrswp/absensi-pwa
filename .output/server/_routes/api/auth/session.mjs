import { defineHandler, getRequestHeader } from "../../../_libs/h3.mjs";
import { getSessionFromCookie } from "../../../index.mjs";
//#region server/routes/api/auth/session.get.ts
var session_get_default = defineHandler(async (event) => {
	event.res.headers.set("cache-control", "no-store");
	return { session: await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null) };
});
//#endregion
export { session_get_default as default };
