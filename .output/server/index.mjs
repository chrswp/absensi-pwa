globalThis.__nitro_main__ = import.meta.url;
import { HTTPError, NodeResponse, serve } from "./_libs/h3+rou3+srvx.mjs";
import { H3Core, composeMiddleware, createError, defineHandler, defineLazyEventHandler, getRequestHeader, getRequestURL, toEventHandler } from "./_libs/h3.mjs";
import { createMatcherFromFind, headers, memoizeRouteRulesMatcher } from "./_libs/h32.mjs";
import { ps } from "./_libs/neondatabase__serverless.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/polyfills/fast-response.mjs
if (globalThis.Response !== NodeResponse) globalThis.Response = NodeResponse;
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/_libs/hookable.mjs
function e$1(t, n, r, i) {
	for (let a = r; a < t.length; a += 1) try {
		let r = i ? i.run(() => t[a](...n)) : t[a](...n);
		if (r && typeof r.then == `function`) return Promise.resolve(r).then(() => e$1(t, n, a + 1, i));
	} catch (e) {
		return Promise.reject(e);
	}
}
var t$1 = class {
	_hooks;
	constructor() {
		this._hooks = {};
	}
	hook(e, t) {
		return !e || typeof t != `function` ? () => {} : (this._hooks[e] = this._hooks[e] || [], this._hooks[e].push(t), () => {
			t &&= (this.removeHook(e, t), void 0);
		});
	}
	removeHook(e, t) {
		let n = this._hooks[e];
		if (n) {
			let r = n.indexOf(t);
			r !== -1 && n.splice(r, 1), n.length === 0 && (this._hooks[e] = void 0);
		}
	}
	callHook(t, ...n) {
		let r = this._hooks[t];
		if (r && r.length !== 0) return e$1(r.slice(), n, 0);
	}
};
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/_libs/ufo.mjs
String.fromCharCode;
var e = /%2f/gi;
function t(e = ``) {
	try {
		return decodeURIComponent(`` + e);
	} catch {
		return `` + e;
	}
}
function n(n) {
	return t(n.replace(e, `%252F`));
}
var r = /\/$|\/\?|\/#/, i = /^\.?\//;
function a(e = ``, t) {
	return t ? r.test(e) : e.endsWith(`/`);
}
function o(e = ``, t) {
	if (!t) return (a(e) ? e.slice(0, -1) : e) || `/`;
	if (!a(e, !0)) return e || `/`;
	let n = e, r = ``, i = e.indexOf(`#`);
	i !== -1 && (n = e.slice(0, i), r = e.slice(i));
	let [o, ...s] = n.split(`?`);
	return ((o.endsWith(`/`) ? o.slice(0, -1) : o) || `/`) + (s.length > 0 ? `?${s.join(`?`)}` : ``) + r;
}
function s(e = ``, t) {
	if (!t) return e.endsWith(`/`) ? e : e + `/`;
	if (a(e, !0)) return e || `/`;
	let n = e, r = ``, i = e.indexOf(`#`);
	if (i !== -1 && (n = e.slice(0, i), r = e.slice(i), !n)) return r;
	let [o, ...s] = n.split(`?`);
	return o + `/` + (s.length > 0 ? `?${s.join(`?`)}` : ``) + r;
}
function c(e = ``) {
	return e.startsWith(`/`);
}
function l(e = ``) {
	return c(e) ? e : `/` + e;
}
function u(e) {
	return e && e !== `/`;
}
function d(e, ...t) {
	let n = e || ``;
	for (let e of t.filter((e) => u(e))) if (n) {
		let t = e.replace(i, ``);
		n = s(n) + t;
	} else n = e;
	return n;
}
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/HadirUpah-Rekap-Aplikasi.pdf": {
		"type": "application/pdf",
		"etag": "\"7cc8-8J0ManzAfp1mA07RGkM1s/lxfIU\"",
		"mtime": "2026-11-28T12:06:21.810Z",
		"size": 31944,
		"path": "../public/HadirUpah-Rekap-Aplikasi.pdf"
	},
	"/assets/index-5jtI3yBL.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"10ceb-S7m/wDVSvO4p1zuqzFciL+8X0Lg\"",
		"mtime": "2026-11-28T12:06:21.748Z",
		"size": 68843,
		"path": "../public/assets/index-5jtI3yBL.css"
	},
	"/assets/index-DK70d5IF.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"683f2-dvEb7oc6KHkGUP994fg8LufUEVY\"",
		"mtime": "2026-11-28T12:06:21.748Z",
		"size": 426994,
		"path": "../public/assets/index-DK70d5IF.js"
	},
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"15f09-4MFHRo4azA6knOGNmsefGO+QUAE\"",
		"mtime": "2026-11-28T12:06:21.811Z",
		"size": 89865,
		"path": "../public/favicon.ico"
	},
	"/icons/icon-192.svg": {
		"type": "image/svg+xml",
		"etag": "\"1d7-9hCQy4r9gFzlcrKffU8Tprf1+zk\"",
		"mtime": "2026-11-28T12:06:21.809Z",
		"size": 471,
		"path": "../public/icons/icon-192.svg"
	},
	"/icons/icon-512.svg": {
		"type": "image/svg+xml",
		"etag": "\"1d7-mVL2H7OY/UOnTqIIhwIoExgrols\"",
		"mtime": "2026-11-28T12:06:21.809Z",
		"size": 471,
		"path": "../public/icons/icon-512.svg"
	},
	"/manifest.webmanifest": {
		"type": "application/manifest+json",
		"etag": "\"227-VRKSroguuDYlW9bO0PJhk1iZoQY\"",
		"mtime": "2026-11-28T12:06:21.810Z",
		"size": 551,
		"path": "../public/manifest.webmanifest"
	},
	"/placeholder.svg": {
		"type": "image/svg+xml",
		"etag": "\"cb5-3cfZ/x0uNhX4kurZGAkOBE4K/G0\"",
		"mtime": "2026-11-28T12:06:21.810Z",
		"size": 3253,
		"path": "../public/placeholder.svg"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-11-28T12:06:21.811Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/sw.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"4e7-P+IKL2Eh8u6Yp4BnSAR8muL0YXw\"",
		"mtime": "2026-11-28T12:06:21.811Z",
		"size": 1255,
		"path": "../public/sw.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path)).catch((error) => {
		if (error?.code !== "ENOENT") throw error;
	});
}
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = { "/assets/": { "maxAge": 31536e3 } };
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
function hasAsset(id = "") {
	return !!(public_assets_data_default[id] || public_assets_data_default[id + ".gz"] || public_assets_data_default[id + ".br"] || public_assets_data_default[id + ".zst"]);
}
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/static.mjs
var METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var noCacheHeaders = { "cache-control": "no-store" };
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	const path = l(o(event.url.pathname));
	let id = path.includes("%") ? n(path) : path;
	if (!hasAsset(id) && !hasAsset(d(id, "index.html")) && !isPublicAssetURL(id)) return;
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((entry) => {
		const [name, ...parameters] = entry.split(";");
		const quality = parameters.map((parameter) => parameter.trim().split("=")).find(([key]) => key.toLowerCase() === "q")?.[1];
		const weight = quality === void 0 ? 1 : Number.parseFloat(quality);
		return {
			ext: EncodingMap[name.trim().toLowerCase()],
			weight: Number.isNaN(weight) ? 1 : weight
		};
	}).filter((entry) => entry.ext && entry.weight > 0).sort((a, b) => b.weight - a.weight || (a.ext < b.ext ? -1 : a.ext > b.ext ? 1 : 0)).map((entry) => entry.ext), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, d(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) throw new HTTPError({
			status: 404,
			headers: noCacheHeaders
		});
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	const data = readAsset(id);
	return typeof data?.then === "function" ? data.then((resolved) => assertAssetData(resolved)) : assertAssetData(data);
});
function assertAssetData(data) {
	if (data === null || data === void 0) throw new HTTPError({
		status: 404,
		headers: noCacheHeaders
	});
	return data;
}
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/error/utils.mjs
function createErrorHeaders(error, event, unhandled) {
	const headers = new Headers(unhandled ? {} : error.headers);
	const errHeaders = event.res?.errHeaders;
	if (errHeaders) for (const [name, value] of errHeaders) if (name === "set-cookie") headers.append(name, value);
	else headers.set(name, value);
	return headers;
}
//#endregion
//#region server/utils/db.ts
var sql = ps(process.env.DATABASE_URL);
//#endregion
//#region server/utils/local-auth.ts
var scrypt$1 = promisify(scrypt);
var SESSION_COOKIE = "__Host-gsi_session";
var SESSION_MAX_AGE_SECONDS = 3600 * 24 * 14;
var normalizeUsername = (value) => value.trim().toLowerCase();
async function hashPassword(password) {
	const salt = randomBytes(16);
	const derived = await scrypt$1(password, salt, 64);
	return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}
async function verifyPassword(password, stored) {
	const [algorithm, saltHex, hashHex] = stored.split("$");
	if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
	const expected = Buffer.from(hashHex, "hex");
	const actual = await scrypt$1(password, Buffer.from(saltHex, "hex"), expected.length);
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function hashSessionToken(token) {
	return createHash("sha256").update(token).digest("hex");
}
async function createSession(userId) {
	const token = randomBytes(32).toString("base64url");
	await sql`INSERT INTO local_auth_sessions (token_hash, user_id, expires_at) VALUES (${hashSessionToken(token)}, ${userId}, NOW() + INTERVAL '14 days')`;
	return token;
}
async function getSessionFromCookie(cookieHeader) {
	if (!cookieHeader) return null;
	const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(19);
	if (!token) return null;
	const user = (await sql`SELECT u.id, u.username, u.name, u.role FROM local_auth_sessions s JOIN local_auth_users u ON u.id = s.user_id WHERE s.token_hash = ${hashSessionToken(decodeURIComponent(token))} AND s.expires_at > NOW() LIMIT 1`)[0];
	return user ? { user } : null;
}
async function removeSession(cookieHeader) {
	if (!cookieHeader) return;
	const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(19);
	if (token) await sql`DELETE FROM local_auth_sessions WHERE token_hash = ${hashSessionToken(decodeURIComponent(token))}`;
}
function newUserId() {
	return randomUUID();
}
function sessionCookie(token, maxAge = SESSION_MAX_AGE_SECONDS) {
	return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function safeSecretEquals(provided, expected) {
	const left = Buffer.from(provided);
	const right = Buffer.from(expected);
	return left.length === right.length && timingSafeEqual(left, right);
}
//#endregion
//#region server/middleware/auth.ts
var PUBLIC_PREFIXES = ["/api/auth/", "/auth/"];
var auth_default = defineHandler(async (event) => {
	const url = getRequestURL(event, { xForwardedProto: true });
	if (PUBLIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return;
	if (!url.pathname.startsWith("/api/")) return;
	const session = await getSessionFromCookie(getRequestHeader(event, "cookie") ?? null);
	if (!session?.user) throw createError({
		statusCode: 401,
		statusMessage: "Unauthorized"
	});
	event.context.user = session.user;
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/assets/**",
		rank: 0,
		rules: [{
			name: "headers",
			route: "/assets/**",
			handler: headers,
			options: { "cache-control": "public, max-age=31536000, immutable" }
		}]
	};
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1);
		let s = p.split("/");
		let l = s.length;
		let _w;
		if (l > 1) {
			if (s[1] === "assets") r.push(l > 2 ? {
				data: $0,
				params: {
					"0": _w = p.slice(8),
					_: _w
				}
			} : {
				data: $0,
				params: {}
			});
		}
		return r.reverse();
	};
})();
var _lazy_31a5e418d36a53a5 = defineLazyEventHandler(() => import("./_routes/api/auth/admin_reset_password.mjs"));
var _lazy_5bd64a8233da8cfc = defineLazyEventHandler(() => import("./_routes/api/auth/change_password.mjs"));
var _lazy_84734ae2b37e3689 = defineLazyEventHandler(() => import("./_routes/api/auth/session.mjs"));
var _lazy_18931a40fc19ccce = defineLazyEventHandler(() => import("./_routes/api/auth/sign_in.mjs"));
var _lazy_80dcd6c27a6db1b6 = defineLazyEventHandler(() => import("./_routes/api/auth/sign_out.mjs"));
var _lazy_35bc63da3e3ddf82 = defineLazyEventHandler(() => import("./_routes/api/auth/sign_up.mjs"));
var _lazy_a3789331aeabfa38 = defineLazyEventHandler(() => import("./_routes/api/bootstrap.mjs"));
var _lazy_d6c4525c30ee36d0 = defineLazyEventHandler(() => import("./_routes/api/data.mjs"));
var _lazy_63e631d879986eed = defineLazyEventHandler(() => import("./_chunks/renderer-template.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/api/auth/admin-reset-password",
		method: "post",
		handler: _lazy_31a5e418d36a53a5
	}, $1 = {
		route: "/api/auth/change-password",
		method: "post",
		handler: _lazy_5bd64a8233da8cfc
	}, $2 = {
		route: "/api/auth/session",
		method: "get",
		handler: _lazy_84734ae2b37e3689
	}, $3 = {
		route: "/api/auth/sign-in",
		method: "post",
		handler: _lazy_18931a40fc19ccce
	}, $4 = {
		route: "/api/auth/sign-out",
		method: "post",
		handler: _lazy_80dcd6c27a6db1b6
	}, $5 = {
		route: "/api/auth/sign-up",
		method: "post",
		handler: _lazy_35bc63da3e3ddf82
	}, $6 = {
		route: "/api/bootstrap",
		method: "get",
		handler: _lazy_a3789331aeabfa38
	}, $7 = {
		route: "/api/data",
		method: "post",
		handler: _lazy_d6c4525c30ee36d0
	}, $8 = {
		route: "/**",
		handler: _lazy_63e631d879986eed
	};
	return (m, p) => {
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1);
		if (p === "/api/auth/admin-reset-password") {
			if (m === "POST") return { data: $0 };
		} else if (p === "/api/auth/change-password") {
			if (m === "POST") return { data: $1 };
		} else if (p === "/api/auth/session") {
			if (m === "GET") return { data: $2 };
		} else if (p === "/api/auth/sign-in") {
			if (m === "POST") return { data: $3 };
		} else if (p === "/api/auth/sign-out") {
			if (m === "POST") return { data: $4 };
		} else if (p === "/api/auth/sign-up") {
			if (m === "POST") return { data: $5 };
		} else if (p === "/api/bootstrap") {
			if (m === "GET") return { data: $6 };
		} else if (p === "/api/data") {
			if (m === "POST") return { data: $7 };
		}
		let l = p.split("/").length;
		let _w;
		return l > 1 ? {
			data: $8,
			params: {
				"0": _w = p.slice(1),
				_: _w
			}
		} : {
			data: $8,
			params: {}
		};
	};
})();
var globalMiddleware = [toEventHandler(static_default), toEventHandler(auth_default)].filter(Boolean);
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = createErrorHeaders(error, event, unhandled);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function initNitroPlugins(app) {
	return app;
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => {
		event.context.routeRules = getRouteRules(event.req.method, event.url.pathname).routeRules;
		if (event.req.method === "HEAD") {
			const route = findRoute("HEAD", event.url.pathname);
			return route?.data.method ? route : findRoute("GET", event.url.pathname);
		}
		return findRoute(event.req.method, event.url.pathname) ?? findMethodNotAllowed(event.req.method, event.url.pathname);
	};
	const findMethodNotAllowed = createMethodNotAllowedMatcher(findRoute, ["GET", "POST"]);
	h3App["~middleware"].push(createRouteRulesMiddleware());
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~middleware"].push(createCacheRuleMiddleware());
	return h3App;
}
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	initNitroPlugins(instance);
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new t$1();
}
function getRouteRules(method, pathname) {
	return matchRouteRules(method, pathname);
}
function createRouteRulesMiddleware() {
	const middleware = (event, next) => {
		const { rules, cache } = resolveRouteRuleChains(event.req.method, event.url.pathname);
		if (cache) event[kCacheRule] = cache;
		return rules ? rules(event, next) : next();
	};
	return markUntraced(middleware);
}
function createCacheRuleMiddleware() {
	const middleware = (event, next) => {
		const cache = event[kCacheRule];
		return cache ? cache(event, next) : next();
	};
	return markUntraced(middleware);
}
function createMethodNotAllowedMatcher(findRoute, methods) {
	return (method, pathname) => {
		let allow;
		for (const m of methods) if (m !== method && findRoute(m, pathname)) allow = allow ? `${allow}, ${m}` : m;
		if (!allow) return;
		return { data: { handler: () => new HTTPError({
			status: 405,
			statusText: "Method Not Allowed",
			message: `Method ${method} is not allowed for ${pathname} (allowed: ${allow})`,
			headers: { allow }
		}) } };
	};
}
var _matchRouteRules;
function matchRouteRules(method, pathname) {
	return (_matchRouteRules ??= memoizeRouteRulesMatcher(createMatcherFromFind(findRouteRules)))(method, pathname);
}
var kCacheRule = /* @__PURE__ */ Symbol("nitro.cacheRule");
var _routeRuleChains = /* @__PURE__ */ new WeakMap();
function resolveRouteRuleChains(method, pathname) {
	const { matchedRules, routeRuleMiddleware } = matchRouteRules(method, pathname);
	if (routeRuleMiddleware.length === 0) return {};
	let chains = _routeRuleChains.get(routeRuleMiddleware);
	if (!chains) {
		const hasCache = !!matchedRules.cache?.handler;
		const rules = hasCache ? routeRuleMiddleware.slice(0, -1) : routeRuleMiddleware;
		chains = {
			rules: rules.length > 0 ? composeMiddleware(rules) : void 0,
			cache: hasCache ? routeRuleMiddleware.at(-1) : void 0
		};
		_routeRuleChains.set(routeRuleMiddleware, chains);
	}
	return chains;
}
function markUntraced(middleware) {
	middleware.__traced__ = true;
	return middleware;
}
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/server-entry
var serverEntryOptions = {};
//#endregion
//#region #nitro/virtual/tracing
var tracingSrvxPlugins = [];
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/serve.mjs
function resolveServeOptions(opts) {
	const { port, hostname, tls, ...entryOptions } = serverEntryOptions;
	const env = globalThis.process?.env || {};
	const _parsedPort = Number.parseInt(env.NITRO_PORT ?? env.PORT ?? "");
	const cert = env.NITRO_SSL_CERT;
	const key = env.NITRO_SSL_KEY;
	const socketPath = env.NITRO_UNIX_SOCKET;
	const resolved = {
		...entryOptions,
		port: Number.isNaN(_parsedPort) ? port ?? 3e3 : _parsedPort,
		hostname: env.NITRO_HOST || env.HOST || hostname,
		tls: cert && key ? {
			cert,
			key
		} : tls,
		...opts,
		plugins: [...tracingSrvxPlugins, ...opts.plugins || []]
	};
	for (const runtime of [
		"node",
		"bun",
		"deno"
	]) if (entryOptions[runtime] && opts[runtime]) resolved[runtime] = {
		...entryOptions[runtime],
		...opts[runtime]
	};
	if (socketPath) {
		resolved.node = {
			...resolved.node,
			path: socketPath
		};
		resolved.bun = {
			...resolved.bun,
			unix: socketPath
		};
		resolved.deno = {
			...resolved.deno,
			path: socketPath
		};
	}
	return resolved;
}
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/shutdown.mjs
function setupCloseHooks(server) {
	const closeServer = server.close.bind(server);
	let closeHooks;
	server.close = (closeActiveConnections) => closeServer(closeActiveConnections).finally(() => closeHooks ??= callCloseHooks());
}
async function callCloseHooks() {
	try {
		await useNitroHooks().callHook("close");
	} catch (error) {
		console.error("[nitro] Error while calling `close` hooks:", error);
	}
}
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/presets/node/runtime/node-server.mjs
var server = serve(resolveServeOptions({ fetch: useNitroApp().fetch }));
server.ready().catch((error) => {
	console.error("[nitro] Failed to start server:", error);
	process.exit(1);
});
setupCloseHooks(server);
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { createSession, node_server_default as default, getSessionFromCookie, hashPassword, newUserId, normalizeUsername, removeSession, safeSecretEquals, sessionCookie, sql, verifyPassword };
