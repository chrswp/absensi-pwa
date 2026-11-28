import { defineHandler, getRequestHeader } from "../../../_libs/h3.mjs";
import { removeSession, sessionCookie } from "../../../index.mjs";
//#region server/routes/api/auth/sign-out.post.ts
var sign_out_post_default = defineHandler(async (event) => {
	await removeSession(getRequestHeader(event, "cookie") ?? null);
	event.res.headers.set("set-cookie", sessionCookie("", 0));
	event.res.headers.set("cache-control", "no-store");
	return { ok: true };
});
//#endregion
export { sign_out_post_default as default };
