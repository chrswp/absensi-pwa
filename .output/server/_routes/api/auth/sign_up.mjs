import { createError, defineHandler, readBody } from "../../../_libs/h3.mjs";
import { createSession, hashPassword, newUserId, normalizeUsername, safeSecretEquals, sessionCookie, sql } from "../../../index.mjs";
//#region server/routes/api/auth/sign-up.post.ts
var sign_up_post_default = defineHandler(async (event) => {
	const body = await readBody(event);
	const username = normalizeUsername(String(body?.username ?? ""));
	const password = String(body?.password ?? "");
	if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw createError({
		statusCode: 400,
		statusMessage: "Username harus 3–32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung."
	});
	if (password.length < 10) throw createError({
		statusCode: 400,
		statusMessage: "Password minimal 10 karakter."
	});
	const adminUsername = normalizeUsername(process.env.NITRO_ADMIN_USERNAME ?? "");
	const setupToken = process.env.NITRO_ADMIN_SETUP_TOKEN ?? "";
	const providedToken = String(body?.adminSetupToken ?? "");
	const isAdminBootstrap = Boolean(adminUsername && setupToken && username === adminUsername && safeSecretEquals(providedToken, setupToken));
	const admins = await sql`SELECT id FROM local_auth_users WHERE role = 'Admin' LIMIT 1`;
	if (isAdminBootstrap && admins.length) throw createError({
		statusCode: 409,
		statusMessage: "Admin awal sudah dibuat. Hapus token setup dari konfigurasi server."
	});
	if (username === adminUsername && !isAdminBootstrap) throw createError({
		statusCode: 403,
		statusMessage: "Token setup Admin tidak valid."
	});
	let name = username;
	if (!isAdminBootstrap) {
		const employee = (await sql`SELECT id, name, status FROM employees WHERE lower(username) = ${username} LIMIT 1`)[0];
		if (!employee || String(employee.status).toLowerCase() !== "aktif") throw createError({
			statusCode: 403,
			statusMessage: "Username belum terdaftar sebagai karyawan aktif. Hubungi Admin."
		});
		name = String(employee.name);
	}
	if ((await sql`SELECT id FROM local_auth_users WHERE username = ${username} LIMIT 1`).length) throw createError({
		statusCode: 409,
		statusMessage: "Username sudah digunakan."
	});
	const id = newUserId();
	const passwordHash = await hashPassword(password);
	const role = isAdminBootstrap ? "Admin" : "Karyawan";
	try {
		await sql`INSERT INTO local_auth_users (id, username, name, password_hash, role) VALUES (${id}, ${username}, ${name}, ${passwordHash}, ${role})`;
	} catch {
		throw createError({
			statusCode: 409,
			statusMessage: "Username sudah digunakan atau pendaftaran tidak dapat disimpan."
		});
	}
	const token = await createSession(id);
	event.res.headers.set("set-cookie", sessionCookie(token));
	event.res.headers.set("cache-control", "no-store");
	return { session: { user: {
		id,
		username,
		name,
		role
	} } };
});
//#endregion
export { sign_up_post_default as default };
