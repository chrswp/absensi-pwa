import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { sql } from "./db";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "__Host-gsi_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export type AuthUser = { id: string; username: string; name: string; role: "Admin" | "Karyawan" };
export type Session = { user: AuthUser } | null;

export const normalizeUsername = (value: string) => value.trim().toLowerCase();

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  await sql`INSERT INTO local_auth_sessions (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, NOW() + INTERVAL '14 days')`;
  return token;
}

export async function getSessionFromCookie(cookieHeader: string | null): Promise<Session> {
  if (!cookieHeader) return null;
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return null;
  const tokenHash = hashSessionToken(decodeURIComponent(token));
  const rows = await sql`SELECT u.id, u.username, u.name, u.role FROM local_auth_sessions s JOIN local_auth_users u ON u.id = s.user_id WHERE s.token_hash = ${tokenHash} AND s.expires_at > NOW() LIMIT 1`;
  const user = rows[0] as AuthUser | undefined;
  return user ? { user } : null;
}

export async function removeSession(cookieHeader: string | null) {
  if (!cookieHeader) return;
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (token) await sql`DELETE FROM local_auth_sessions WHERE token_hash = ${hashSessionToken(decodeURIComponent(token))}`;
}

export function newUserId() {
  return randomUUID();
}

export function sessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function safeSecretEquals(provided: string, expected: string) {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
