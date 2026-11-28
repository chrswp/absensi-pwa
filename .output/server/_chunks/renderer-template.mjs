import { HTTPResponse } from "../_libs/h3+rou3+srvx.mjs";
//#region #nitro/virtual/renderer-template
var rendererTemplate = () => new HTTPResponse("<!doctype html>\n<html lang=\"id\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <meta name=\"theme-color\" content=\"#0f766e\" />\n    <meta name=\"description\" content=\"Hadir-GSI — absensi, pengajuan, dan payroll dalam satu aplikasi.\" />\n    <link rel=\"manifest\" href=\"./manifest.webmanifest\" />\n    <link rel=\"icon\" href=\"./icons/icon-192.svg\" type=\"image/svg+xml\" />\n    <title>Hadir-GSI — Absensi & Payroll</title>\n    <script type=\"module\" crossorigin src=\"/assets/index-DK70d5IF.js\"><\/script>\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/index-5jtI3yBL.css\">\n  </head>\n\n  <body>\n    <div id=\"root\"></div>\n  </body>\n</html>\n", { headers: { "content-type": "text/html; charset=utf-8" } });
//#endregion
//#region node_modules/.pnpm/nitro@3.0.261103-rc/node_modules/nitro/dist/runtime/internal/routes/renderer-template.mjs
function renderIndexHTML(event) {
	return rendererTemplate(event.req);
}
//#endregion
export { renderIndexHTML as default };
