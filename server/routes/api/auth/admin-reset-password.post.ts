import { randomBytes } from "node:crypto";
import { defineHandler } from "nitro";
import { createError, getRequestHeader, readBody } from "nitro/h3";
import { sql } from "../../../utils/db";
import { getSessionFromCookie, hashPassword, normalizeUsername } from "../../../utils/local-auth";

export default defineHandler(async (event) => {
  const session = await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null);
  if (session?.user.role !== "Admin") throw createError({ statusCode: 403, statusMessage: "Akses Admin diperlukan." });
  const body = await readBody<{ username?: string }>(event);
  const username = normalizeUsername(String(body?.username ?? ""));
  const users = await sql`SELECT id FROM local_auth_users WHERE username = ${username} AND role = 'Karyawan' LIMIT 1`;
  if (!users[0]) throw createError({ statusCode: 404, statusMessage: "Akun karyawan tidak ditemukan." });
  const temporaryPassword = randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);
  await sql`UPDATE local_auth_users SET password_hash = ${passwordHash} WHERE id = ${users[0].id}`;
  await sql`DELETE FROM local_auth_sessions WHERE user_id = ${users[0].id}`;
  return { username, temporaryPassword };
});
