import { createError, defineHandler, getRequestHeader, readBody } from "../../../_libs/h3.mjs";
import { getSessionFromCookie, hashPassword, sql, verifyPassword } from "../../../index.mjs";
//#region server/routes/api/auth/change-password.post.ts
var change_password_post_default = defineHandler(async (event) => {
	const session = await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null);
	if (!session?.user) throw createError({
		statusCode: 401,
		statusMessage: "Silakan masuk kembali."
	});
	const body = await readBody(event);
	const currentPassword = String(body?.currentPassword ?? "");
	const newPassword = String(body?.newPassword ?? "");
	if (newPassword.length < 10) throw createError({
		statusCode: 400,
		statusMessage: "Password baru minimal 10 karakter."
	});
	const rows = await sql`SELECT password_hash FROM local_auth_users WHERE id = ${session.user.id} LIMIT 1`;
	if (!rows[0] || !await verifyPassword(currentPassword, String(rows[0].password_hash))) throw createError({
		statusCode: 401,
		statusMessage: "Password saat ini salah."
	});
	await sql`UPDATE local_auth_users SET password_hash = ${await hashPassword(newPassword)} WHERE id = ${session.user.id}`;
	return { ok: true };
});
//#endregion
export { change_password_post_default as default };
