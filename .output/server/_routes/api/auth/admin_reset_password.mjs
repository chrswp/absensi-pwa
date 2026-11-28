import { createError, defineHandler, getRequestHeader, readBody } from "../../../_libs/h3.mjs";
import { getSessionFromCookie, hashPassword, normalizeUsername, sql } from "../../../index.mjs";
import { randomBytes } from "node:crypto";
//#region server/routes/api/auth/admin-reset-password.post.ts
var admin_reset_password_post_default = defineHandler(async (event) => {
	if ((await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null))?.user.role !== "Admin") throw createError({
		statusCode: 403,
		statusMessage: "Akses Admin diperlukan."
	});
	const body = await readBody(event);
	const username = normalizeUsername(String(body?.username ?? ""));
	const users = await sql`SELECT id FROM local_auth_users WHERE username = ${username} AND role = 'Karyawan' LIMIT 1`;
	if (!users[0]) throw createError({
		statusCode: 404,
		statusMessage: "Akun karyawan tidak ditemukan."
	});
	const temporaryPassword = randomBytes(18).toString("base64url");
	await sql`UPDATE local_auth_users SET password_hash = ${await hashPassword(temporaryPassword)} WHERE id = ${users[0].id}`;
	await sql`DELETE FROM local_auth_sessions WHERE user_id = ${users[0].id}`;
	return {
		username,
		temporaryPassword
	};
});
//#endregion
export { admin_reset_password_post_default as default };
