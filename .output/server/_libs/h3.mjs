import { H3Event, HTTPError, NullProtoObj, hasProp, kMalformedURL, kNotFound, toError, toResponse } from "./h3+rou3+srvx.mjs";
//#region node_modules/.pnpm/h3@2.0.8_crossws@0.4.17_srvx@1.0.8__ocache@0.3.2/node_modules/h3/dist/middleware.mjs
function composeMiddleware(middleware) {
	let chain = (event, handler) => handler(event);
	for (let i = middleware.length - 1; i >= 0; i--) {
		const fn = middleware[i];
		const inner = chain;
		chain = (event, handler) => callLayer(fn, event, handler, inner);
	}
	return chain;
}
function composeHandler(middleware, handler) {
	const chain = composeMiddleware(middleware);
	return function _composedHandler(event) {
		return chain(event, handler);
	};
}
function callMiddleware(event, middleware, handler, index = 0) {
	return index === middleware.length ? handler(event) : callLayer(middleware[index], event, handler, (_event, _handler) => callMiddleware(_event, middleware, _handler, index + 1));
}
function callLayer(fn, event, handler, inner) {
	let nextCalled;
	let nextResult;
	const next = () => {
		if (nextCalled) return nextResult;
		nextCalled = true;
		nextResult = inner(event, handler);
		return nextResult;
	};
	const ret = fn(event, next);
	return isUnhandledResponse(ret) ? next() : typeof ret?.then === "function" ? ret.then((resolved) => isUnhandledResponse(resolved) ? next() : resolved) : ret;
}
function isUnhandledResponse(val) {
	return val === void 0 || val === kNotFound;
}
//#endregion
//#region node_modules/.pnpm/h3@2.0.8_crossws@0.4.17_srvx@1.0.8__ocache@0.3.2/node_modules/h3/dist/cache.mjs
function getRequestHost(event, opts = {}) {
	if (opts.xForwardedHost) {
		const xForwardedHost = (event.req.headers.get("x-forwarded-host") || "").split(",").shift()?.trim();
		if (xForwardedHost) return xForwardedHost;
	}
	return event.req.headers.get("host") || "";
}
function getRequestProtocol(event, opts = {}) {
	if (opts.xForwardedProto) {
		const forwardedProto = (event.req.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
		if (forwardedProto === "https") return "https";
		if (forwardedProto === "http") return "http";
	}
	return (event.url || new URL(event.req.url)).protocol.slice(0, -1);
}
function getRequestURL(event, opts = {}) {
	const url = new URL(event.url || event.req.url);
	url.protocol = getRequestProtocol(event, opts);
	if (opts.xForwardedHost) {
		const host = getRequestHost(event, opts);
		if (host) applyForwardedHost(url, host);
	}
	return url;
}
function applyForwardedHost(url, host) {
	const sep = host.lastIndexOf(":");
	const hasPort = sep > host.lastIndexOf("]");
	const hostname = hasPort ? host.slice(0, sep) : host;
	const prevHostname = url.hostname;
	url.hostname = hostname;
	if (url.hostname === prevHostname && hostname.toLowerCase() !== prevHostname) return;
	const port = hasPort ? host.slice(sep + 1) : "";
	url.port = /^\d{1,5}$/.test(port) && +port < 65536 ? port : "";
}
function defineHandler(input) {
	if (typeof input === "function") return handlerWithFetch(input);
	const handler = input.handler || (input.fetch ? function _fetchHandler(event) {
		return input.fetch(event.req);
	} : NoHandler);
	const composed = input.middleware?.length && composeHandler(input.middleware, handler);
	const eventHandler = handlerWithFetch(composed || handler);
	return Object.assign(eventHandler, input, composed && { fetch: eventHandler.fetch });
}
function handlerWithFetch(handler) {
	if ("fetch" in handler) return handler;
	return Object.assign(handler, { fetch: (req) => {
		if (typeof req === "string") req = new URL(req, "http://_");
		if (req instanceof URL) req = new Request(req);
		const event = new H3Event(req);
		try {
			return Promise.resolve(toResponse(handler(event), event));
		} catch (error) {
			return Promise.resolve(toResponse(toError(error), event));
		}
	} });
}
function defineLazyEventHandler(loader) {
	let handler;
	let promise;
	return defineHandler(function lazyHandler(event) {
		return handler ? handler(event) : (promise ??= Promise.resolve(loader()).then(function resolveLazyHandler(r) {
			handler = toEventHandler(r) || toEventHandler(r.default);
			if (typeof handler !== "function") throw new TypeError("Invalid lazy handler", { cause: { resolved: r } });
			return handler;
		})).then((r) => r(event));
	});
}
function toEventHandler(handler) {
	if (typeof handler === "function") return handler;
	if (typeof handler?.handler === "function" && handler.constructor?.["~h3"]) return handler.handler;
	if (typeof handler?.fetch === "function") return function _fetchHandler(event) {
		return handler.fetch(event.req);
	};
}
var NoHandler = () => kNotFound;
var H3Core = class {
	static "~h3" = true;
	config;
	"~middleware";
	"~routes" = [];
	"~dispatch";
	"~composed";
	constructor(config = {}) {
		this["~middleware"] = [];
		this.config = config;
		this.fetch = this.fetch.bind(this);
		this.handler = this.handler.bind(this);
	}
	fetch(request) {
		return this["~request"](request);
	}
	handler(event) {
		const route = this["~findRoute"](event);
		if (route) {
			event.context.params = route.params;
			event.context.matchedRoute = route.data;
		}
		return (this["~dispatch"] ??= createDispatcher(this))(event, route);
	}
	"~request"(request, context) {
		const event = new H3Event(request, context, this);
		let handlerRes;
		try {
			if (event[kMalformedURL] && !this.config.allowMalformedURL) throw new HTTPError({
				status: 400,
				message: "Bad Request"
			});
			if (this.config.onRequest) {
				const hookRes = this.config.onRequest(event);
				handlerRes = typeof hookRes?.then === "function" ? hookRes.then(() => this.handler(event)) : this.handler(event);
			} else handlerRes = this.handler(event);
		} catch (error) {
			handlerRes = Promise.reject(error);
		}
		return toResponse(handlerRes, event, this.config);
	}
	"~findRoute"(_event) {}
	"~addRoute"(_route) {
		this["~routes"].push(_route);
	}
	"~getMiddleware"(_event, _route) {
		return this["~middleware"];
	}
};
function createDispatcher(app) {
	if (app["~getMiddleware"] !== H3Core.prototype["~getMiddleware"]) return (event, route) => callMiddleware(event, app["~getMiddleware"](event, route || void 0), routeHandler(route));
	const middleware = app["~middleware"];
	if (middleware.length === 0) return (event, route) => routeHandler(route)(event);
	const composed = app["~composed"] ??= composeMiddleware(middleware);
	return (event, route) => composed(event, routeHandler(route));
}
function routeHandler(route) {
	const data = route?.data;
	if (!data) return NoHandler;
	return data.middleware?.length ? data["~composed"] ??= composeHandler(data.middleware, data.handler) : data.handler;
}
//#endregion
//#region node_modules/.pnpm/h3@2.0.8_crossws@0.4.17_srvx@1.0.8__ocache@0.3.2/node_modules/h3/dist/path.mjs
var DOT_SEGMENT_SRC = String.raw`(?:^|/)(?:\.|%(?:25)*2e){1,2}(?:/|$)`;
var ENCODED_SEP_SRC = String.raw`%(?:25)*(?:2f|5c)`;
var ENCODED_SEP_RE_G = /* @__PURE__ */ new RegExp(ENCODED_SEP_SRC, "gi");
var TRIGGER_RES = /* @__PURE__ */ (() => {
	const base = String.raw`\\|` + DOT_SEGMENT_SRC;
	return [
		new RegExp(base, "i"),
		new RegExp(`${base}|${ENCODED_SEP_SRC}`, "i"),
		new RegExp(`${base}|//`, "i"),
		new RegExp(`${base}|${ENCODED_SEP_SRC}|//`, "i")
	];
})();
var ENCODED_DOT_RE_G = /%(?:25)*2e/gi;
function resolveDotSegments(path, opts) {
	if (path[0] !== "/" || path[1] === "/" || path[1] === "\\") path = "/" + path.replace(/^[/\\]+/, "");
	if (isCanonicalPath(path, opts)) return path;
	const decodeSlashes = opts?.decodeSlashes;
	const mergeSlashes = opts?.mergeSlashes;
	let normalized = path.includes("\\") ? path.replaceAll("\\", "/") : path;
	if (decodeSlashes) normalized = normalized.replace(ENCODED_SEP_RE_G, "/");
	const segments = normalized.split("/");
	const lastIndex = segments.length - 1;
	const resolved = [];
	for (let i = 0; i <= lastIndex; i++) {
		const segment = segments[i];
		const normalizedSegment = segment.includes("%") ? segment.replace(ENCODED_DOT_RE_G, ".") : segment;
		const isDotSegment = normalizedSegment === "." || normalizedSegment === "..";
		if (normalizedSegment === "..") {
			if (resolved.length > 1) resolved.pop();
		} else if (mergeSlashes && normalizedSegment === "" && i > 0 && i < lastIndex) {} else if (!isDotSegment) resolved.push(segment);
		if (isDotSegment && i === lastIndex) resolved.push("");
	}
	return (resolved.join("/") || "/").replace(/^\/+/, "/");
}
function isCanonicalPath(path, opts) {
	return path[0] === "/" && path[1] !== "/" && path[1] !== "\\" && !TRIGGER_RES[(opts?.decodeSlashes ? 1 : 0) | (opts?.mergeSlashes ? 2 : 0)].test(path);
}
//#endregion
//#region node_modules/.pnpm/h3@2.0.8_crossws@0.4.17_srvx@1.0.8__ocache@0.3.2/node_modules/h3/dist/h3.mjs
function parseURLEncodedBody(body) {
	return collectEntries(new URLSearchParams(body).entries());
}
function parseFormData(form) {
	return collectEntries(form.entries());
}
function collectEntries(entries) {
	const parsed = new NullProtoObj();
	for (const [key, value] of entries) if (hasProp(parsed, key)) {
		if (!Array.isArray(parsed[key])) parsed[key] = [parsed[key]];
		parsed[key].push(value);
	} else parsed[key] = value;
	return parsed;
}
async function readBody(event, options) {
	const contentType = (event.req.headers.get("content-type") || "").toLowerCase();
	const type = options?.type;
	if (type === "formData") {
		let form;
		try {
			form = await event.req.formData();
		} catch (error) {
			if (HTTPError.isError(error)) throw error;
			throw new HTTPError({
				status: 400,
				statusText: "Bad Request",
				message: "Invalid form data body"
			});
		}
		return parseFormData(form);
	}
	const text = await event.req.text();
	if (type === "text") return text;
	if (!text) return;
	if (type === "urlencoded" || !type && contentType.startsWith("application/x-www-form-urlencoded")) return parseURLEncodedBody(text);
	try {
		return JSON.parse(text);
	} catch {
		throw new HTTPError({
			status: 400,
			statusText: "Bad Request",
			message: "Invalid JSON body"
		});
	}
}
function createError(arg1, arg2) {
	return new HTTPError(arg1, arg2);
}
function getRequestHeader(event, name) {
	return event.req.headers.get(name) || void 0;
}
//#endregion
export { H3Core, composeMiddleware, createError, defineHandler, defineLazyEventHandler, getRequestHeader, getRequestURL, isCanonicalPath, readBody, resolveDotSegments, toEventHandler };
