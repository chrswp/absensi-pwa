import { createError, defineHandler, readBody } from "../../../_libs/h3.mjs";
import { createSession, normalizeUsername, sessionCookie, sql, verifyPassword } from "../../../index.mjs";
//#region server/routes/api/auth/sign-in.post.ts
var sign_in_post_default = defineHandler(async (event) => {
	const body = await readBody(event);
	const username = normalizeUsername(String(body?.username ?? ""));
	const password = String(body?.password ?? "");
	if (!username || !password) throw createError({
		statusCode: 400,
		statusMessage: "Masukkan username dan password."
	});
	const account = (await sql`SELECT id, username, name, role, password_hash FROM local_auth_users WHERE username = ${username} LIMIT 1`)[0];
	if (!account || !await verifyPassword(password, String(account.password_hash))) throw createError({
		statusCode: 401,
		statusMessage: "Username atau password salah."
	});
	const token = await createSession(String(account.id));
	event.res.headers.set("set-cookie", sessionCookie(token));
	event.res.headers.set("cache-control", "no-store");
	return { session: { user: {
		id: account.id,
		username: account.username,
		name: account.name,
		role: account.role
	} } };
});
//#endregion
export { sign_in_post_default as default };
