// Builds demo/dist/index.html: the whole app + an in-browser fake backend, in one self-contained file.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const d = path.dirname(fileURLToPath(import.meta.url)), r = (p) => fs.readFileSync(path.join(d, p), "utf8");
const lib = r("../recipes-library.js").replace(/^export /gm, "");
const css = r("../public/style.css") + `
#demo-ribbon { position: fixed; top: 10px; right: 12px; z-index: 70; background: rgba(18,21,28,.88); border: 1px solid var(--line); backdrop-filter: blur(8px); padding: 5px 12px; border-radius: 99px; font-size: 12px; color: var(--muted); }
#demo-ribbon b { color: var(--accent); } #demo-ribbon a { color: var(--text); }
@media (max-width: 860px) { #demo-ribbon { top: 6px; right: 8px; font-size: 10.5px; padding: 3px 10px; } main { padding-top: 34px !important; } }`;
const js = `window.__LIB__ = (() => {\n${lib}\nreturn { LIBRARY, parseRecipes, MATCH };\n})();\n${r("demo-api.js")}\n${r("../public/app.js")}`;
if (js.includes("</script")) throw new Error("script terminator in bundle");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Last Call · Bar Inventory (demo)</title><style>${css}</style></head>
<body><div id="app"></div><div id="toasts"></div><script type="module">${js}</script></body></html>`;
fs.mkdirSync(path.join(d, "dist"), { recursive: true });
fs.writeFileSync(path.join(d, "dist/index.html"), html);
console.log("built", (html.length / 1024).toFixed(0) + " KB");
