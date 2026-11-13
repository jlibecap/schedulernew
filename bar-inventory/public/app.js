// Bar Inventory front-end — vanilla JS, no build step.
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => (n || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2 });
const fmt = (n) => (Math.round(n * 100) / 100).toString();
const ICON = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>', box: '<path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/>',
  count: '<path d="M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9"/>', cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 002 1.6h7.6a2 2 0 002-1.5L21 7H6"/>',
  log: '<path d="M12 8v4l3 2M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5"/>', users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0114 0M16 4a4 4 0 010 8M22 21a7 7 0 00-4-6.3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', plus: '<path d="M12 5v14M5 12h14"/>', down: '<path d="M12 3v14M6 11l6 6 6-6M4 21h16"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>', drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>', up: '<path d="M12 21V7M6 13l6-6 6 6M4 3h16"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>', dollar: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>', alert: '<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
  glass: '<path d="M5 3h14l-7 9zM12 12v9M8 21h8"/>', heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/>', more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  scan: '<path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8v8M11 8v8M15 8v8M18 8v8"/>',
  file: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M8 13h8M8 17h6"/>', copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24">${ICON[n]}</svg>`;

async function api(path, method = "GET", body) {
  const r = await fetch("/api" + path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401 && path !== "/auth") { state.authed = false; render(); throw new Error("PIN required"); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
}
function toast(msg, err) {
  const t = document.createElement("div"); t.className = "toast" + (err ? " err" : ""); t.textContent = msg;
  $("#toasts").append(t); setTimeout(() => t.remove(), 2600);
}
const guard = (fn) => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

const state = { rcat: "All", rbase: "All", authed: false, pinRequired: false, products: [], recipes: [], rq: "", rtab: "ready", suppliers: [], summary: null, moves: [], q: "", cat: "All", status: "all",
  counts: {}, orderQty: {} };
const statusOf = (p) => (p.stock <= 0 ? "out" : p.par > 0 && p.stock < p.par ? "low" : "ok");
const ask = (m) => (window.__DEMO__ ? true : confirm(m)); // confirm() is blocked in sandboxed frames
const route = () => (location.hash.slice(1) || "dashboard");

async function load() {
  const [products, suppliers, summary, moves, recipes] = await Promise.all([api("/products"), api("/suppliers"), api("/summary"), api("/movements?limit=80"), api("/recipes")]);
  Object.assign(state, { products, suppliers, summary, moves, recipes });
}
async function boot() {
  const s = await api("/session");
  state.pinRequired = s.pinRequired; state.authed = s.authed;
  if (state.authed) await load();
  render();
}

// ---------- shell ----------
const NAV = [["dashboard", "Dashboard", "home"], ["inventory", "Inventory", "box"], ["cocktails", "Cocktails", "glass"], ["count", "Count", "count"], ["reorder", "Reorder", "cart"], ["activity", "Activity", "log"], ["suppliers", "Suppliers", "users"]];
function render() {
  const app = $("#app");
  if (!state.authed) {
    app.innerHTML = `<div class="login"><form class="card" id="pinf"><div class="logo">🍸</div><h1>Last Call</h1><p class="sub" style="margin:6px 0 20px">Enter the bar PIN to continue</p>
      <input type="password" inputmode="numeric" id="pin" placeholder="PIN" autofocus style="text-align:center;font-size:20px;letter-spacing:.3em;margin-bottom:14px"><button class="btn primary" style="width:100%;justify-content:center">Unlock</button></form></div>`;
    $("#pinf").onsubmit = guard(async (e) => { e.preventDefault(); await api("/auth", "POST", { pin: $("#pin").value }); state.authed = true; await load(); render(); });
    return;
  }
  const r = route(), low = state.products.filter((p) => statusOf(p) !== "ok").length;
  const links = (cls) => NAV.map(([k, label, i]) => `<a href="#${k}" class="${r === k ? "active" : ""}">${ic(i)}<span>${label}</span>${k === "reorder" && low ? `<span class="badge">${low}</span>` : ""}</a>`).join("");
  app.innerHTML = `<div class="shell"><aside class="side"><div class="brand"><div class="logo">🍸</div><div>Last Call<small>Bar inventory</small></div></div>
    <nav class="nav">${links()}</nav><div class="spacer"></div><a class="btn ghost sm" href="/api/export.csv">${ic("file")} Export CSV</a></aside>
    <main id="view"></main></div>
    <nav class="tabbar">${["dashboard", "inventory", "cocktails", "reorder"].map((k) => { const [, label, i] = NAV.find((n) => n[0] === k); return `<a href="#${k}" class="${r === k ? "active" : ""}">${ic(i)}${label}${k === "reorder" && low ? `<span class="badge">${low}</span>` : ""}</a>`; }).join("")}<a href="#" id="more" class="${["count", "activity", "suppliers"].includes(r) ? "active" : ""}">${ic("more")}More</a></nav>`;
  app.insertAdjacentHTML("beforeend", `<button class="fab" id="fab" aria-label="Scan barcode">${ic("scan")}</button>`); $("#fab").onclick = () => scanFlow();
  const more = $("#more"); if (more) more.onclick = (e) => { e.preventDefault(); const o = overlay(`<h1 style="font-size:22px;margin-bottom:14px">More</h1><div class="list">${[["count", "Stock count"], ["activity", "Activity"], ["suppliers", "Suppliers"]].map(([k, l]) => `<a class="item" style="grid-template-columns:1fr;text-decoration:none;color:inherit" href="#${k}"><b>${l}</b></a>`).join("")}<a class="item" style="grid-template-columns:1fr;text-decoration:none;color:inherit" href="/api/export.csv"><b>Export CSV</b></a></div>`); o.querySelectorAll("a").forEach((a) => (a.onclick = () => o.remove())); };
  (views[r] || views.dashboard)($("#view"));
}
window.addEventListener("hashchange", () => state.authed && render());

// ---------- dashboard ----------
const views = {};
views.dashboard = (el) => {
  const s = state.summary, low = state.products.filter((p) => statusOf(p) !== "ok").sort((a, b) => a.stock / (a.par || 1) - b.stock / (b.par || 1));
  const cats = Object.entries(s.byCategory).sort((a, b) => b[1] - a[1]), max = Math.max(1, ...cats.map((c) => c[1]));
  const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); days.push([d, s.daily.find((x) => x.day === d)?.value || 0]); }
  const dmax = Math.max(1, ...days.map((d) => d[1]));
  const hr = new Date().getHours();
  el.innerHTML = `<div class="head"><div><h1>${hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening"} 👋</h1><p class="sub">Here's how the bar is stocked right now.</p></div>
    <div class="row"><button class="btn" id="d-scan">${ic("scan")} Scan</button><button class="btn" id="d-count">${ic("count")} Start count</button><button class="btn primary" id="d-recv">${ic("down")} Receive delivery</button></div></div>
    <div class="grid stats">
      <div class="card stat"><div class="label">${ic("dollar")} Stock value (cost)</div><div class="value">${money(s.stockValue)}</div><div class="hint">${money(s.retailValue)} at retail</div></div>
      <div class="card stat"><div class="label">${ic("alert")} Need reordering</div><div class="value" style="color:${s.lowCount ? "var(--warn)" : "var(--ok)"}">${s.lowCount}</div><div class="hint">${s.outCount} completely out</div></div>
      <div class="card stat"><div class="label">${ic("drop")} Used · 7 days</div><div class="value">${money(s.week.used)}</div><div class="hint">${money(s.week.wasted)} wasted</div></div>
      <div class="card stat"><div class="label">${ic("down")} Received · 7 days</div><div class="value">${money(s.week.received)}</div><div class="hint">${s.products} products tracked</div></div></div>
    ${suggestHtml()}
    <div class="grid cols"><div class="card"><h2>Needs attention</h2>${low.length ? `<div class="list" style="margin-top:14px">${low.slice(0, 6).map(itemRow).join("")}</div>${low.length > 6 ? `<a href="#reorder" class="btn sm" style="margin-top:14px">See all ${low.length} →</a>` : ""}` : `<div class="empty"><div class="big">🎉</div>Everything is above par.</div>`}</div>
    <div class="grid" style="align-content:start"><div class="card"><h2>Stock value by category</h2><div class="bars">${cats.map(([c, v]) => `<div class="bar"><div class="top"><span>${esc(c)}</span><span>${money(v)}</span></div><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div></div>`).join("") || '<p class="sub">No products yet.</p>'}</div></div>
    <div class="card"><h2>Usage & waste · last 7 days</h2><div class="spark">${days.map(([d, v]) => `<div title="${money(v)}"><i style="height:${(v / dmax) * 85 + 4}%"></i>${new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "narrow" })}</div>`).join("")}</div></div></div></div>`;
  bindItems(el); bindDrinks(el);
  $("#d-scan").onclick = () => scanFlow();
  $("#d-count").onclick = () => (location.hash = "#count");
  $("#d-recv").onclick = () => pickProduct("receive");
};

function suggestHtml() {
  const ready = state.recipes.map((r) => ({ r, a: analyze(r) })).filter((x) => x.a.ready).sort((a, b) => b.r.favorite - a.r.favorite).slice(0, 4);
  return `<div class="card" style="margin-bottom:16px"><div class="row" style="justify-content:space-between"><h2>🍹 What you can make right now</h2><a href="#cocktails" class="btn sm">All cocktails →</a></div>
    ${ready.length ? `<div class="grid drinks" style="margin-top:14px">${ready.map((x) => drinkCard(x.r)).join("")}</div>` : '<p class="sub" style="margin-top:8px">Stock a few more ingredients to unlock suggestions.</p>'}</div>`;
}
// ---------- inventory ----------
function itemRow(p) {
  const st = statusOf(p), pct = p.par ? Math.min(100, (p.stock / p.par) * 100) : 100, col = st === "ok" ? "var(--ok)" : st === "low" ? "var(--warn)" : "var(--bad)";
  return `<div class="item" data-id="${p.id}"><div><div class="name">${esc(p.name)} ${st !== "ok" ? `<span class="pill ${st}">${st === "out" ? "Out" : "Low"}</span>` : ""}</div>
    <div class="meta">${esc([p.category, p.size, p.location].filter(Boolean).join(" · "))}</div></div>
    <div class="level"><div class="qty">${fmt(p.stock)} <small>/ ${fmt(p.par)} par</small></div><div class="track"><div class="fill" style="width:${pct}%;background:${col}"></div></div></div>
    <div class="stepper"><button data-act="use" data-id="${p.id}" aria-label="Use one">−</button><button data-act="receive" data-id="${p.id}" aria-label="Add one">+</button></div></div>`;
}
function bindItems(el) {
  el.querySelectorAll(".item").forEach((it) => (it.onclick = (e) => { if (!e.target.closest(".stepper")) openProduct(+it.dataset.id); }));
  el.querySelectorAll(".stepper button").forEach((b) => (b.onclick = guard(async (e) => {
    e.stopPropagation(); const type = b.dataset.act;
    await api(`/products/${b.dataset.id}/move`, "POST", { type, qty: 1, note: "Quick adjust" }); await load(); render();
  })));
}
views.inventory = (el) => {
  const cats = ["All", ...new Set(state.products.map((p) => p.category))];
  el.innerHTML = `<div class="head"><div><h1>Inventory</h1><p class="sub">${state.products.length} products · tap a row for details, ± for quick adjust</p></div>
    <div class="row"><button class="btn" id="scan">${ic("scan")} Scan</button><button class="btn primary" id="add">${ic("plus")} Add product</button></div></div>
    <div class="toolbar"><div class="search">${ic("search")}<input id="q" placeholder="Search products, suppliers, locations…" value="${esc(state.q)}"></div>
    <select id="st" style="width:auto"><option value="all">All stock</option><option value="low">Low or out</option><option value="out">Out of stock</option></select></div>
    <div class="chips">${cats.map((c) => `<button class="chip ${state.cat === c ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="list" id="list"></div>`;
  $("#st").value = state.status;
  const paint = () => {
    const q = state.q.toLowerCase();
    const rows = state.products.filter((p) => (state.cat === "All" || p.category === state.cat) && (state.status === "all" || (state.status === "out" ? statusOf(p) === "out" : statusOf(p) !== "ok"))
      && (!q || [p.name, p.category, p.supplier_name, p.location, p.size, p.barcode, p.tags].join(" ").toLowerCase().includes(q)));
    $("#list").innerHTML = rows.map(itemRow).join("") || `<div class="empty"><div class="big">🔍</div>No products match.</div>`; bindItems($("#list"));
  };
  paint();
  $("#q").oninput = (e) => { state.q = e.target.value; paint(); };
  $("#st").onchange = (e) => { state.status = e.target.value; paint(); };
  el.querySelectorAll(".chip").forEach((c) => (c.onclick = () => { state.cat = c.dataset.c; render(); }));
  $("#add").onclick = () => productForm();
  $("#scan").onclick = () => scanFlow();
};

// ---------- overlays ----------
function overlay(html, center) {
  const o = document.createElement("div"); o.className = "overlay" + (center ? " modal-c" : ""); o.innerHTML = `<div class="drawer">${html}</div>`;
  o.addEventListener("mousedown", (e) => { if (e.target === o) o.remove(); });
  const esc_ = (e) => { if (e.key === "Escape") { o.remove(); document.removeEventListener("keydown", esc_); } }; document.addEventListener("keydown", esc_);
  document.body.append(o); return o;
}
async function openProduct(id, mode = "use") {
  const p = state.products.find((x) => x.id === id); if (!p) return;
  const hist = await api(`/movements?product_id=${id}&limit=8`);
  const o = overlay(`<div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:18px"><div><h1 style="font-size:22px">${esc(p.name)}</h1><p class="sub">${esc([p.category, p.size, p.location].filter(Boolean).join(" · "))}</p></div><button class="btn sm" id="edit">${ic("edit")} Edit</button></div>
    <div class="grid" style="grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px"><div class="card stat" style="padding:14px"><div class="label">On hand</div><div class="value" style="font-size:24px">${fmt(p.stock)}</div><div class="hint">${esc(p.unit)}s</div></div>
    <div class="card stat" style="padding:14px"><div class="label">Par</div><div class="value" style="font-size:24px">${fmt(p.par)}</div><div class="hint"><span class="pill ${statusOf(p)}">${statusOf(p)}</span></div></div>
    <div class="card stat" style="padding:14px"><div class="label">Value</div><div class="value" style="font-size:24px">${money(p.stock * p.cost)}</div><div class="hint">${money(p.cost)} ea</div></div></div>
    <div class="seg" id="seg"><button data-m="use">Use</button><button data-m="receive">Receive</button><button data-m="waste">Waste</button></div>
    <div class="two"><div class="field"><label>Quantity</label><input id="qty" type="number" step="any" min="0" value="1" inputmode="decimal"></div><div class="field"><label>Note (optional)</label><input id="note" placeholder="e.g. Broken bottle"></div></div>
    <button class="btn primary" id="go" style="width:100%;justify-content:center">Save</button>
    <h2 style="margin:26px 0 4px">Recent activity</h2><div class="hist">${hist.map((m) => `<div><span>${esc(m.type)}${m.note ? `<small>${esc(m.note)}</small>` : ""}<small>${new Date(m.created_at + "Z").toLocaleString()}</small></span><b class="${m.delta >= 0 ? "pos" : "neg"}">${m.delta > 0 ? "+" : ""}${fmt(m.delta)} → ${fmt(m.balance)}</b></div>`).join("") || '<p class="sub">Nothing yet.</p>'}</div>
    ${p.supplier_name ? `<p class="sub" style="margin-top:18px">Supplier: ${esc(p.supplier_name)}</p>` : ""}`);
  let m = mode; const setM = (x) => { m = x; o.querySelectorAll("#seg button").forEach((b) => b.classList.toggle("on", b.dataset.m === m)); }; setM(m);
  o.querySelectorAll("#seg button").forEach((b) => (b.onclick = () => setM(b.dataset.m)));
  $("#qty", o).select();
  $("#go", o).onclick = guard(async () => {
    await api(`/products/${id}/move`, "POST", { type: m, qty: +$("#qty", o).value, note: $("#note", o).value });
    o.remove(); await load(); render(); toast(`${p.name}: ${m} saved`);
  });
  $("#edit", o).onclick = () => { o.remove(); productForm(p); };
}
function pickProduct(mode, cb) {
  const o = overlay(`<h1 style="font-size:22px;margin-bottom:14px">Pick a product</h1><input id="pq" placeholder="Search…" autofocus style="margin-bottom:12px"><div class="list" id="pl"></div>`, true);
  const paint = () => { const q = $("#pq", o).value.toLowerCase(); $("#pl", o).innerHTML = state.products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 30).map((p) => `<div class="item" style="grid-template-columns:1fr auto" data-id="${p.id}"><div><div class="name">${esc(p.name)}</div><div class="meta">${fmt(p.stock)} on hand</div></div></div>`).join(""); $("#pl", o).querySelectorAll(".item").forEach((it) => (it.onclick = () => { o.remove(); const pr = state.products.find((x) => x.id === +it.dataset.id); cb ? cb(pr) : openProduct(pr.id, mode); })); };
  paint(); $("#pq", o).oninput = paint;
}
function productForm(p = {}) {
  const cats = [...new Set(["Spirits", "Liqueurs", "Beer", "Wine", "Mixers", "Produce", "Other", ...state.products.map((x) => x.category)])];
  const v = (k, d = "") => esc(p[k] ?? d);
  const o = overlay(`<h1 style="font-size:22px;margin-bottom:18px">${p.id ? "Edit product" : "New product"}</h1><form id="pf">
    <div class="field"><label>Name</label><input name="name" required value="${v("name")}" autofocus></div>
    <div class="two"><div class="field"><label>Category</label><input name="category" list="cats" value="${v("category", "Spirits")}"><datalist id="cats">${cats.map((c) => `<option>${esc(c)}</option>`).join("")}</datalist></div>
    <div class="field"><label>Size</label><input name="size" placeholder="750ml" value="${v("size")}"></div></div>
    <div class="two"><div class="field"><label>Counted in</label><input name="unit" list="units" value="${v("unit", "bottle")}"><datalist id="units"><option>bottle<option>case<option>keg<option>lb<option>bunch<option>each</datalist></div>
    <div class="field"><label>Location</label><input name="location" placeholder="Back bar" value="${v("location")}"></div></div>
    <div class="two"><div class="field"><label>Cost per unit ($)</label><input name="cost" type="number" step="0.01" min="0" value="${v("cost", 0)}"></div><div class="field"><label>Price per unit ($)</label><input name="price" type="number" step="0.01" min="0" value="${v("price", 0)}"></div></div>
    <div class="two"><div class="field"><label>Par level</label><input name="par" type="number" step="any" min="0" value="${v("par", 0)}"></div>
    ${p.id ? "" : `<div class="field"><label>Opening stock</label><input name="stock" type="number" step="any" min="0" value="0"></div>`}</div>
    <div class="field"><label>Supplier</label><select name="supplier_id"><option value="">— none —</option>${state.suppliers.map((s) => `<option value="${s.id}" ${s.id === p.supplier_id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select></div>
    <div class="field"><label>Barcode</label><div class="row" style="flex-wrap:nowrap"><input name="barcode" inputmode="numeric" placeholder="Scan or type" value="${v("barcode")}"><button type="button" class="btn" id="bcscan" aria-label="Scan barcode">${ic("scan")}</button></div></div>
    <div class="field"><label>Cocktail keywords <span style="font-weight:400">(helps match recipes, e.g. "tequila, blanco")</span></label><input name="tags" value="${v("tags")}"></div>
    <div class="field"><label>Notes</label><textarea name="notes" rows="2">${v("notes")}</textarea></div>
    <div class="row"><button class="btn primary" style="flex:1;justify-content:center">Save</button>${p.id ? `<button type="button" class="btn danger" id="del">${ic("trash")}</button>` : ""}</div></form>`);
  $("#bcscan", o).onclick = () => openScanner({ title: "Scan product barcode", onCode: (code, ui) => { $("#pf", o).elements.barcode.value = code; ui.close(); toast("Barcode captured"); } });
  $("#pf", o).onsubmit = guard(async (e) => {
    e.preventDefault(); const body = Object.fromEntries(new FormData(e.target));
    await api(p.id ? `/products/${p.id}` : "/products", p.id ? "PUT" : "POST", body); o.remove(); await load(); render(); toast("Saved");
  });
  if (p.id) $("#del", o).onclick = guard(async () => { if (!ask(`Remove ${p.name}? History is kept.`)) return; await api(`/products/${p.id}`, "DELETE"); o.remove(); await load(); render(); toast("Removed"); });
}

// ---------- count ----------
views.count = (el) => {
  const groups = {}; state.products.forEach((p) => (groups[p.location || "Unassigned"] ||= []).push(p));
  el.innerHTML = `<div class="head"><div><h1>Stock count</h1><p class="sub">Enter what's physically on the shelf. Only changed rows are saved, and variances are logged.</p></div>
    <div class="row"><button class="btn" id="cscan">${ic("scan")} Scan to count</button><button class="btn primary" id="save">${ic("count")} Save count</button></div></div>
    ${Object.entries(groups).sort().map(([loc, ps]) => `<div class="group"><h2>${esc(loc)} <span class="sub">${ps.length} items</span></h2><div class="card" style="padding:6px 14px"><table>${ps.map((p) => `<tr><td><b>${esc(p.name)}</b><div class="sub">${esc(p.size)}</div></td><td class="sub">System: ${fmt(p.stock)}</td><td style="text-align:right"><input type="number" step="any" min="0" inputmode="decimal" data-id="${p.id}" placeholder="${fmt(p.stock)}" value="${state.counts[p.id] ?? ""}"></td></tr>`).join("")}</table></div></div>`).join("")}`;
  el.querySelectorAll("input[data-id]").forEach((i) => (i.oninput = () => (state.counts[i.dataset.id] = i.value)));
  $("#cscan").onclick = () => openScanner({ title: "Scan to count — each scan adds 1", onCode: (code, ui) => {
    const p = findByBarcode(code); if (!p) return ui.result(`<b>Unknown barcode</b><div class="sub">${esc(code)} isn't linked to a product yet.</div>`, "bad");
    const n = (+state.counts[p.id] || 0) + 1; state.counts[p.id] = String(n);
    const inp = el.querySelector(`input[data-id="${p.id}"]`); if (inp) inp.value = n;
    ui.result(`<b>${esc(p.name)}</b><div class="sub">Counted ${n} · system says ${fmt(p.stock)}</div>`, "ok");
  } });
  $("#save").onclick = guard(async () => {
    const changed = state.products.filter((p) => state.counts[p.id] !== undefined && state.counts[p.id] !== "" && +state.counts[p.id] !== p.stock);
    const entered = Object.values(state.counts).filter((v) => v !== "").length;
    if (!entered) return toast("Enter at least one count", true);
    for (const p of changed) await api(`/products/${p.id}/move`, "POST", { type: "count", counted: +state.counts[p.id], note: "Stock count" });
    state.counts = {}; await load(); render(); toast(`Count saved · ${changed.length} variance${changed.length === 1 ? "" : "s"} logged`);
  });
};

// ---------- reorder ----------
views.reorder = (el) => {
  const need = state.products.filter((p) => statusOf(p) !== "ok" && p.par > 0), by = {};
  need.forEach((p) => (by[p.supplier_name || "No supplier"] ||= []).push(p));
  const qtyOf = (p) => state.orderQty[p.id] ?? Math.ceil(p.par - p.stock);
  el.innerHTML = `<div class="head"><div><h1>Reorder</h1><p class="sub">Everything below par, grouped by supplier. Quantities bring you back up to par.</p></div></div>
    ${Object.entries(by).map(([s, ps]) => { const sup = state.suppliers.find((x) => x.name === s);
      return `<div class="group card"><h2><span>${esc(s)} <span class="sub">· ${money(ps.reduce((t, p) => t + qtyOf(p) * p.cost, 0))}</span></span>
      <span class="row">${sup?.phone ? `<a class="btn sm" href="tel:${esc(sup.phone)}">Call</a>` : ""}${sup?.email ? `<a class="btn sm" data-mail="${esc(s)}" href="#">Email</a>` : ""}<button class="btn sm" data-copy="${esc(s)}">${ic("copy")} Copy order</button></span></h2>
      <table><tr><th>Product</th><th>On hand</th><th>Par</th><th style="text-align:right">Order qty</th></tr>${ps.map((p) => `<tr><td><b>${esc(p.name)}</b> <span class="pill ${statusOf(p)}">${statusOf(p)}</span></td><td>${fmt(p.stock)}</td><td>${fmt(p.par)}</td>
      <td style="text-align:right"><input type="number" min="0" step="any" data-oq="${p.id}" value="${qtyOf(p)}"></td></tr>`).join("")}</table></div>`; }).join("") || `<div class="empty card"><div class="big">✅</div>Nothing to order — every product is at or above par.</div>`}`;
  el.querySelectorAll("[data-oq]").forEach((i) => (i.onchange = () => { state.orderQty[i.dataset.oq] = +i.value; render(); }));
  const text = (name) => `Order for ${name}\n` + by[name].filter((p) => qtyOf(p) > 0).map((p) => `• ${qtyOf(p)} × ${p.name}${p.size ? " (" + p.size + ")" : ""}`).join("\n");
  el.querySelectorAll("[data-copy]").forEach((b) => (b.onclick = () => { navigator.clipboard?.writeText(text(b.dataset.copy)).then(() => toast("Order copied"), () => toast("Copy failed", true)); }));
  el.querySelectorAll("[data-mail]").forEach((b) => (b.onclick = (e) => { e.preventDefault(); const s = state.suppliers.find((x) => x.name === b.dataset.mail); location.href = `mailto:${s.email}?subject=${encodeURIComponent("Order request")}&body=${encodeURIComponent(text(s.name))}`; }));
};

// ---------- activity ----------
views.activity = (el) => {
  const verb = { receive: "Received", use: "Used", waste: "Wasted", count: "Counted", adjust: "Adjusted" }, I = { receive: "down", use: "drop", waste: "trash", count: "count", adjust: "edit" };
  el.innerHTML = `<div class="head"><div><h1>Activity</h1><p class="sub">Every stock movement, newest first.</p></div></div><div class="card feed">${state.moves.map((m) => `<div class="ev"><div class="dot ${m.type}">${ic(I[m.type])}</div>
    <div class="t"><b>${verb[m.type]}</b> ${esc(m.product_name)}<small>${esc(m.note || "")} ${new Date(m.created_at + "Z").toLocaleString()}</small></div><b class="${m.delta >= 0 ? "pos" : "neg"}">${m.delta > 0 ? "+" : ""}${fmt(m.delta)}</b></div>`).join("") || '<div class="empty">No activity yet.</div>'}</div>`;
};

// ---------- suppliers ----------
views.suppliers = (el) => {
  el.innerHTML = `<div class="head"><div><h1>Suppliers</h1><p class="sub">Who you buy from.</p></div><button class="btn primary" id="add">${ic("plus")} Add supplier</button></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${state.suppliers.map((s) => `<div class="card"><h2>${esc(s.name)}</h2><p class="sub">${esc(s.contact)}</p>
    <p style="margin-top:10px">${s.phone ? `<a style="color:var(--accent)" href="tel:${esc(s.phone)}">${esc(s.phone)}</a><br>` : ""}${esc(s.email)}</p><p class="sub" style="margin:8px 0 14px">${state.products.filter((p) => p.supplier_id === s.id).length} products</p>
    <button class="btn sm" data-id="${s.id}">${ic("edit")} Edit</button></div>`).join("") || '<div class="empty card" style="grid-column:1/-1">No suppliers yet.</div>'}</div>`;
  $("#add").onclick = () => supplierForm();
  el.querySelectorAll("[data-id]").forEach((b) => (b.onclick = () => supplierForm(state.suppliers.find((s) => s.id === +b.dataset.id))));
};
function supplierForm(s = {}) {
  const f = (k, l, t = "text") => `<div class="field"><label>${l}</label><input name="${k}" type="${t}" value="${esc(s[k] ?? "")}"></div>`;
  const o = overlay(`<h1 style="font-size:22px;margin-bottom:18px">${s.id ? "Edit" : "New"} supplier</h1><form id="sf">${f("name", "Name")}${f("contact", "Contact person")}${f("phone", "Phone", "tel")}${f("email", "Email", "email")}
    <div class="field"><label>Notes</label><textarea name="notes" rows="2">${esc(s.notes ?? "")}</textarea></div><div class="row"><button class="btn primary" style="flex:1;justify-content:center">Save</button>${s.id ? `<button type="button" class="btn danger" id="del">${ic("trash")}</button>` : ""}</div></form>`, true);
  $("#sf", o).onsubmit = guard(async (e) => { e.preventDefault(); await api(s.id ? `/suppliers/${s.id}` : "/suppliers", s.id ? "PUT" : "POST", Object.fromEntries(new FormData(e.target))); o.remove(); await load(); render(); });
  if (s.id) $("#del", o).onclick = guard(async () => { if (!ask(`Delete ${s.name}?`)) return; await api(`/suppliers/${s.id}`, "DELETE"); o.remove(); await load(); render(); });
}

// ---------- cocktails ----------
const BRANDS = {
  tequila: "espol|patr[oó]n|casamigos|don julio|cazadores|olmeca|cuervo|jimador|mezcal|blanco|reposado",
  vodka: "tito|smirnoff|absolut|grey goose|ketel|stoli|belvedere|svedka|ciroc",
  gin: "hendrick|tanqueray|bombay|beefeater|aviation|plymouth|gordon|empress|botanist|bluecoat",
  rum: "bacard|captain morgan|havana|mount gay|appleton|kraken|diplomatico|malibu|goslings|myers|plantation",
  "bourbon|whiskey|whisky|rye": "buffalo trace|maker|jim beam|jack daniel|jameson|bulleit|woodford|four roses|wild turkey|rittenhouse|knob creek|scotch",
};
const rxCache = new Map();
const kwRegex = (kw) => rxCache.get(kw) || (rxCache.set(kw, new RegExp(`(^|[^a-z])${kw.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?([^a-z]|$)`, "i")), rxCache.get(kw));
function productMatches(p, match) {
  const hay = [p.name, p.tags, p.category === "Spirits" || p.category === "Liqueurs" ? "" : p.category].join(" ").toLowerCase();
  return match.split("|").some((kw) => {
    kw = kw.trim(); if (!kw) return false;
    if (kwRegex(kw).test(hay)) return true;
    const brand = Object.entries(BRANDS).find(([k]) => k.split("|").includes(kw));
    return brand ? new RegExp(brand[1], "i").test(hay) : false;
  });
}
function bottleOz(p) {
  const m = String(p.size).toLowerCase().replace(/\s/g, "").match(/^([\d.]+)(ml|cl|l|oz)/); if (!m) return 0;
  const v = +m[1]; return m[2] === "ml" ? v / 29.5735 : m[2] === "cl" ? v / 2.95735 : m[2] === "l" ? v * 33.814 : v;
}
const UNIT_OZ = { oz: 1, barspoon: 0.17, tsp: 0.167, dash: 0.03, ml: 1 / 29.5735, cl: 1 / 2.95735 };
// how many "stock units" of product p one serving of ingredient i uses (0 = not tracked, e.g. leaves, top-ups, produce)
function perServing(i, p) {
  const oz = UNIT_OZ[i.unit], size = bottleOz(p);
  return oz && size && p.unit === "bottle" ? (i.amount * oz) / size : 0;
}
function analyze(r, servings = 1) {
  const lines = r.ingredients.map((i) => {
    const cands = state.products.filter((p) => productMatches(p, i.match) && p.stock > 0).sort((a, b) => b.stock - a.stock);
    const best = cands.find((p) => p.stock + 1e-9 >= perServing(i, p) * servings) || null;
    const any = state.products.find((p) => productMatches(p, i.match));
    return { i, product: best, anyProduct: any, use: best ? perServing(i, best) * servings : 0, ok: !!best };
  });
  const missing = lines.filter((l) => !l.ok && !l.i.optional);
  return { lines, missing, ready: !missing.length };
}
const fav = (r) => `<button class="heart ${r.favorite ? "on" : ""}" data-fav="${r.id}" aria-label="Favorite">${ic("heart")}</button>`;
function drinkCard(r) {
  const a = analyze(r);
  return `<div class="drink ${a.ready ? "ready" : ""}" data-id="${r.id}"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="name">${esc(r.name)}</div><div class="meta">${esc([r.category, r.glass].filter(Boolean).join(" · "))}</div></div>${fav(r)}</div>
    <div class="ings">${a.lines.map((l) => `<span class="ing ${l.ok ? "have" : l.i.optional ? "opt" : "miss"}">${esc(l.i.label)}</span>`).join("")}</div>
    <div class="foot">${a.ready ? '<span class="pill ok">Ready to make</span>' : `<span class="pill ${a.missing.length === 1 ? "low" : "out"}">Missing ${a.missing.length}</span>`}</div></div>`;
}
function bindDrinks(el) {
  el.querySelectorAll(".drink").forEach((d) => (d.onclick = (e) => { if (!e.target.closest(".heart")) openRecipe(+d.dataset.id); }));
  el.querySelectorAll(".heart").forEach((h) => (h.onclick = guard(async (e) => {
    e.stopPropagation(); const r = state.recipes.find((x) => x.id === +h.dataset.fav);
    await api(`/recipes/${r.id}/favorite`, "POST", { favorite: !r.favorite }); r.favorite = !r.favorite; render();
  })));
}
views.cocktails = (el) => {
  const all = state.recipes.map((r) => ({ r, a: analyze(r) }));
  const uniq = (k) => [...new Set(state.recipes.map((r) => r[k]).filter(Boolean))].sort();
  const cats = uniq("category"), bases = uniq("base");
  const tabs = { ready: all.filter((x) => x.a.ready), almost: all.filter((x) => !x.a.ready && x.a.missing.length <= 2 && x.a.missing.length >= 1), fav: all.filter((x) => x.r.favorite), all };
  const names = { ready: "Can make now", almost: "Almost there", fav: "Favorites", all: "All recipes" };
  const q = state.rq.toLowerCase();
  let rows = tabs[state.rtab].filter((x) => (state.rcat === "All" || x.r.category === state.rcat) && (state.rbase === "All" || x.r.base === state.rbase)).filter((x) => !q || (x.r.name + " " + x.r.ingredients.map((i) => i.label).join(" ")).toLowerCase().includes(q));
  if (state.rtab === "ready") rows.sort((a, b) => b.r.favorite - a.r.favorite);
  if (state.rtab === "almost") rows.sort((a, b) => a.a.missing.length - b.a.missing.length);
  el.innerHTML = `<div class="head"><div><h1>Cocktails</h1><p class="sub">Recipes matched against what's on your shelves right now.</p></div><div class="row"><button class="btn" id="imp">${ic("file")} Import</button><button class="btn primary" id="new">${ic("plus")} New recipe</button></div></div>
    <div class="toolbar"><div class="search">${ic("search")}<input id="rq" placeholder="Search drinks or ingredients…" value="${esc(state.rq)}"></div>
    <select id="rcat" style="width:auto">${["All", ...cats].map((c) => `<option ${c === state.rcat ? "selected" : ""} value="${esc(c)}">${c === "All" ? "All styles" : esc(c)}</option>`).join("")}</select>
    <select id="rbase" style="width:auto">${["All", ...bases].map((c) => `<option ${c === state.rbase ? "selected" : ""} value="${esc(c)}">${c === "All" ? "Any base" : esc(c)}</option>`).join("")}</select></div>
    <div class="chips">${Object.keys(names).map((k) => `<button class="chip ${state.rtab === k ? "on" : ""}" data-t="${k}">${names[k]} · ${tabs[k].length}</button>`).join("")}</div>
    <div class="grid drinks">${rows.map((x) => drinkCard(x.r)).join("") || `<div class="empty card" style="grid-column:1/-1"><div class="big">🍹</div>${state.rtab === "fav" ? "Tap the heart on a drink to save it here." : "Nothing here yet — try restocking or check “Almost there”."}</div>`}</div>`;
  $("#rq").oninput = (e) => { state.rq = e.target.value; const pos = e.target.selectionStart; render(); const n = $("#rq"); n.focus(); n.setSelectionRange(pos, pos); };
  el.querySelectorAll(".chip").forEach((c) => (c.onclick = () => { state.rtab = c.dataset.t; render(); }));
  $("#new").onclick = () => recipeForm();
  $("#imp").onclick = () => importForm();
  $("#rcat").onchange = (e) => { state.rcat = e.target.value; render(); };
  $("#rbase").onchange = (e) => { state.rbase = e.target.value; render(); };
  bindDrinks(el);
};
function openRecipe(id) {
  const r = state.recipes.find((x) => x.id === id); if (!r) return;
  let n = 1;
  const o = overlay("");
  const paint = () => {
    const a = analyze(r, n);
    $(".drawer", o).innerHTML = `<div class="row" style="justify-content:space-between;align-items:flex-start;margin-bottom:6px"><div><h1 style="font-size:24px">${esc(r.name)}</h1><p class="sub">${esc([r.category, r.base && r.base !== "None" ? r.base + " base" : r.base, r.glass, r.garnish && "Garnish: " + r.garnish].filter(Boolean).join(" · "))}</p></div><div class="row">${fav(r)}<button class="btn sm" id="edit">${ic("edit")}</button></div></div>
      <div class="row" style="margin:14px 0"><span class="pill ${a.ready ? "ok" : "out"}">${a.ready ? "Ready to make" : "Missing " + a.missing.map((l) => l.i.label).join(", ")}</span></div>
      <h2>Ingredients <span class="sub" style="font-weight:400">· for ${n} drink${n > 1 ? "s" : ""}</span></h2>
      <div class="hist">${a.lines.map((l) => `<div><span>${l.i.amount ? fmt(l.i.amount * n) + " " + esc(l.i.unit) : esc(l.i.unit === "top" ? "Top with" : "")} <b>${esc(l.i.label)}</b>${l.i.optional ? ' <small style="display:inline">(optional)</small>' : ""}</span>
        <span class="${l.ok ? "pos" : "neg"}" style="text-align:right">${l.product ? esc(l.product.name) + `<small>${fmt(l.product.stock)} ${esc(l.product.unit)} in stock</small>` : l.anyProduct ? `${esc(l.anyProduct.name)}<small>out of stock</small>` : "Not in inventory"}</span></div>`).join("")}</div>
      ${r.method ? `<h2 style="margin:22px 0 6px">Method</h2><p>${esc(r.method)}</p>` : ""}${r.notes ? `<p class="sub" style="margin-top:10px">${esc(r.notes)}</p>` : ""}
      <div class="row" style="margin-top:24px"><div class="stepper"><button id="m">−</button><b style="min-width:26px;text-align:center">${n}</b><button id="p">+</button></div>
      <button class="btn primary" id="make" style="flex:1;justify-content:center" ${a.ready ? "" : "disabled"}>${ic("glass")} Make it · deduct stock</button></div>
      <p class="sub" style="margin-top:8px;font-size:12.5px">Spirits are deducted as fractions of a bottle from pour volume; fresh items and top-ups aren't tracked.</p>`;
    $("#m", o).onclick = () => { n = Math.max(1, n - 1); paint(); }; $("#p", o).onclick = () => { n = Math.min(20, n + 1); paint(); };
    $("#edit", o).onclick = () => { o.remove(); recipeForm(r); };
    $(".heart", o).onclick = guard(async () => { await api(`/recipes/${r.id}/favorite`, "POST", { favorite: !r.favorite }); r.favorite = !r.favorite; paint(); render(); });
    $("#make", o).onclick = guard(async () => {
      const deductions = a.lines.filter((l) => l.product && l.use > 0).map((l) => ({ product_id: l.product.id, qty: l.use }));
      await api("/make", "POST", { label: r.name + (n > 1 ? ` ×${n}` : ""), deductions }); o.remove(); await load(); render(); toast(`${r.name} made · stock updated`);
    });
  };
  paint();
}
function recipeForm(r = { ingredients: [{ label: "", match: "", amount: 1, unit: "oz" }] }) {
  const rows = r.ingredients.map((i) => ({ ...i }));
  const o = overlay("");
  const paint = () => {
    $(".drawer", o).innerHTML = `<h1 style="font-size:22px;margin-bottom:18px">${r.id ? "Edit recipe" : "New recipe"}</h1><form id="rf">
      <div class="field"><label>Name</label><input name="name" required value="${esc(r.name || "")}"></div>
      <div class="two"><div class="field"><label>Glass</label><input name="glass" value="${esc(r.glass || "")}"></div><div class="field"><label>Garnish</label><input name="garnish" value="${esc(r.garnish || "")}"></div></div>
      <div class="two"><div class="field"><label>Style</label><input name="category" list="rc" value="${esc(r.category || "")}"><datalist id="rc">${[...new Set(state.recipes.map((x) => x.category).filter(Boolean))].map((c) => `<option>${esc(c)}</option>`).join("")}</datalist></div><div class="field"><label>Base spirit</label><input name="base" value="${esc(r.base || "")}" placeholder="Gin, Rum, None…"></div></div>
      <label class="lbl">Ingredients <span style="font-weight:400">— “matches” are the words used to find it in your inventory (separate alternates with |)</span></label>
      ${rows.map((i, n) => `<div class="irow"><input data-k="label" data-n="${n}" placeholder="Name (Gin)" value="${esc(i.label)}"><input data-k="match" data-n="${n}" placeholder="matches (gin|plymouth)" value="${esc(i.match)}">
        <input data-k="amount" data-n="${n}" type="number" step="any" min="0" value="${i.amount}"><select data-k="unit" data-n="${n}">${["oz", "dash", "barspoon", "tsp", "ml", "leaves", "top", "each"].map((u) => `<option ${u === i.unit ? "selected" : ""}>${u}</option>`).join("")}</select>
        <label class="opt"><input type="checkbox" data-k="optional" data-n="${n}" ${i.optional ? "checked" : ""}>opt</label><button type="button" class="btn sm danger" data-rm="${n}">✕</button></div>`).join("")}
      <button type="button" class="btn sm" id="addi" style="margin:6px 0 16px">${ic("plus")} Ingredient</button>
      <div class="field"><label>Method</label><textarea name="method" rows="3">${esc(r.method || "")}</textarea></div>
      <div class="row"><button class="btn primary" style="flex:1;justify-content:center">Save</button>${r.id ? `<button type="button" class="btn danger" id="del">${ic("trash")}</button>` : ""}</div></form>`;
    const f = $("#rf", o);
    f.querySelectorAll("[data-k]").forEach((el) => (el.oninput = el.onchange = () => { rows[+el.dataset.n][el.dataset.k] = el.type === "checkbox" ? el.checked : el.value; }));
    f.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => { rows.splice(+b.dataset.rm, 1); paint(); }));
    $("#addi", o).onclick = () => { rows.push({ label: "", match: "", amount: 1, unit: "oz" }); paint(); };
    f.onsubmit = guard(async (e) => {
      e.preventDefault(); const body = { ...Object.fromEntries(new FormData(f)), ingredients: rows };
      await api(r.id ? `/recipes/${r.id}` : "/recipes", r.id ? "PUT" : "POST", body); o.remove(); await load(); render(); toast("Recipe saved");
    });
    if (r.id) $("#del", o).onclick = guard(async () => { if (!ask(`Delete ${r.name}?`)) return; await api(`/recipes/${r.id}`, "DELETE"); o.remove(); await load(); render(); });
  };
  paint();
}

// ---------- barcode scanning ----------
const normBc = (c) => String(c).trim().replace(/^0+(?=\d{8,}$)/, ""); // UPC-A (12) vs EAN-13 (leading 0) compare equal
const findByBarcode = (c) => state.products.find((p) => p.barcode && normBc(p.barcode) === normBc(c));
let zxPromise;
const loadZX = () => (zxPromise ||= new Promise((res, rej) => { const s = document.createElement("script"); s.src = "/vendor/zxing.min.js"; s.onload = () => res(window.ZXing); s.onerror = () => rej(new Error("Scanner library failed to load")); document.head.append(s); }));
async function makeDetector() {
  if ("BarcodeDetector" in window) {
    try {
      const have = await BarcodeDetector.getSupportedFormats();
      const want = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"].filter((f) => have.includes(f));
      if (want.length) { const d = new BarcodeDetector({ formats: want }); return async (v) => (await d.detect(v))[0]?.rawValue; }
    } catch { /* fall through to ZXing */ }
  }
  const ZX = await loadZX(), F = ZX.BarcodeFormat, reader = new ZX.MultiFormatReader();
  reader.setHints(new Map([[ZX.DecodeHintType.POSSIBLE_FORMATS, [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.ITF, F.QR_CODE]], [ZX.DecodeHintType.TRY_HARDER, true]]));
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (v) => {
    if (!v.videoWidth) return;
    canvas.width = v.videoWidth; canvas.height = v.videoHeight; ctx.drawImage(v, 0, 0);
    try { return reader.decode(new ZX.BinaryBitmap(new ZX.HybridBinarizer(new ZX.HTMLCanvasElementLuminanceSource(canvas)))).getText(); } catch { return undefined; }
  };
}
// openScanner({title, modes:[[key,label]], onMode, onCode(code, ui)}) — camera + manual/USB-scanner entry. Stays open for repeat scans.
function openScanner({ title = "Scan barcode", modes, onMode, onCode }) {
  const o = document.createElement("div"); o.className = "scan";
  o.innerHTML = `<div class="scan-top"><b>${esc(title)}</b><button class="btn sm" id="sx">Done</button></div>
    <div class="scan-view"><video playsinline muted></video><div class="reticle"></div><div class="scan-msg" id="smsg"></div><button class="btn sm torch" id="torch" hidden>🔦</button></div>
    ${modes ? `<div class="seg" id="smodes" style="margin:12px 16px 0">${modes.map(([k, l], i) => `<button data-m="${k}" class="${i ? "" : "on"}">${esc(l)}</button>`).join("")}</div>` : ""}
    <div class="scan-result" id="sres"><span class="sub">Point the camera at a barcode</span></div>
    <form class="scan-manual" id="sman"><input id="sin" inputmode="numeric" placeholder="Or type / scan with a USB scanner…" autocomplete="off"><button class="btn">Go</button></form>`;
  document.body.append(o);
  let stream, timer, busy = false, last = "", lastAt = 0, closed = false;
  const video = $("video", o);
  const close = () => { closed = true; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); o.remove(); };
  const ui = { close, result(html, kind = "") { $("#sres", o).className = "scan-result " + kind; $("#sres", o).innerHTML = html; $("#sres", o).querySelectorAll("[data-run]").forEach((b) => (b.onclick = () => ui.actions[b.dataset.run]?.())); }, actions: {} };
  const fire = async (code) => {
    const now = Date.now(); if (code === last && now - lastAt < 2000) return; last = code; lastAt = now;
    navigator.vibrate?.(60);
    try { await onCode(code, ui); } catch (e) { ui.result(`<b>${esc(e.message)}</b>`, "bad"); }
  };
  $("#sx", o).onclick = close;
  $("#sman", o).onsubmit = (e) => { e.preventDefault(); const v = $("#sin", o).value.trim(); $("#sin", o).value = ""; if (v) { last = ""; fire(v); } };
  o.querySelectorAll("#smodes button").forEach((b) => (b.onclick = () => { o.querySelectorAll("#smodes button").forEach((x) => x.classList.toggle("on", x === b)); onMode?.(b.dataset.m); }));
  (async () => {
    if (window.__DEMO__) { $("#smsg", o).innerHTML = "Camera is disabled in this hosted demo.<br>Tap a sample barcode below, or type one."; $("#sres", o).insertAdjacentHTML("beforebegin", `<div class="row" style="margin:12px 16px 0;gap:6px">${state.products.filter((p) => p.barcode).slice(0, 5).map((p) => `<button class="btn sm" data-bc="${esc(p.barcode)}">${esc(p.name)}</button>`).join("")}</div>`); o.querySelectorAll("[data-bc]").forEach((b) => (b.onclick = () => { last = ""; fire(b.dataset.bc); })); return; }
    if (!navigator.mediaDevices?.getUserMedia) { $("#smsg", o).innerHTML = `Camera needs a secure connection.<br>Open the <b>https://…ts.net</b> address (see README: <code>tailscale serve</code>) — or type the code below.`; return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
      if (closed) return stream.getTracks().forEach((t) => t.stop());
      video.srcObject = stream; await video.play();
      const track = stream.getVideoTracks()[0];
      if (track.getCapabilities?.().torch) { const t = $("#torch", o); t.hidden = false; let on = false; t.onclick = () => track.applyConstraints({ advanced: [{ torch: (on = !on) }] }); }
      const detect = await makeDetector();
      timer = setInterval(async () => { if (busy || closed || video.readyState < 2) return; busy = true; try { const c = await detect(video); if (c) await fire(c); } catch { /* frame failed */ } busy = false; }, 200);
    } catch (e) { $("#smsg", o).textContent = e.name === "NotAllowedError" ? "Camera permission denied — allow it in your browser settings, or type the code below." : "Couldn't start the camera: " + e.message; }
  })();
  return ui;
}
function scanFlow() {
  let mode = "lookup";
  openScanner({ title: "Scan barcode", modes: [["lookup", "Look up"], ["receive", "Receive +1"], ["use", "Use −1"]], onMode: (m) => (mode = m), onCode: async (code, ui) => {
    const p = findByBarcode(code);
    if (!p) {
      ui.actions.create = () => { ui.close(); productForm({ barcode: code }); };
      ui.actions.link = () => { ui.close(); pickProduct("use", guard(async (pr) => { await api(`/products/${pr.id}`, "PUT", { ...pr, barcode: code }); await load(); render(); toast(`Linked to ${pr.name}`); })); };
      return ui.result(`<b>New barcode</b><div class="sub">${esc(code)} isn't in your inventory yet.</div><div class="row" style="margin-top:12px"><button class="btn primary" data-run="create">New product</button><button class="btn" data-run="link">Link to existing</button></div>`, "bad");
    }
    if (mode === "lookup") {
      const act = (type) => async () => { await api(`/products/${p.id}/move`, "POST", { type, qty: 1, note: "Scanned" }); await load(); const n = state.products.find((x) => x.id === p.id); ui.result(`<b>${esc(n.name)}</b><div class="sub">${type === "receive" ? "+1" : "−1"} saved · now ${fmt(n.stock)} ${esc(n.unit)}</div>`, "ok"); render(); };
      Object.assign(ui.actions, { use: act("use"), receive: act("receive"), open: () => { ui.close(); openProduct(p.id); } });
      return ui.result(`<b>${esc(p.name)}</b><div class="sub">${esc([p.category, p.size].filter(Boolean).join(" · "))} · <b>${fmt(p.stock)}</b> ${esc(p.unit)} on hand (par ${fmt(p.par)})</div><div class="row" style="margin-top:12px"><button class="btn" data-run="use">− Use 1</button><button class="btn" data-run="receive">+ Receive 1</button><button class="btn ghost" data-run="open">Details</button></div>`, "ok");
    }
    await api(`/products/${p.id}/move`, "POST", { type: mode, qty: 1, note: "Scanned" }); await load();
    const n = state.products.find((x) => x.id === p.id);
    ui.result(`<b>${mode === "receive" ? "+1" : "−1"} ${esc(n.name)}</b><div class="sub">Now ${fmt(n.stock)} ${esc(n.unit)}</div>`, "ok"); render();
  } });
}

function importForm() {
  const o = overlay(`<h1 style="font-size:22px;margin-bottom:6px">Import recipes</h1><p class="sub" style="margin-bottom:14px">Paste JSON or text lines, or choose a file. Existing recipes with the same name are skipped.</p>
    <input type="file" id="ifile" accept=".json,.txt,.csv" style="margin-bottom:12px"><textarea id="itxt" rows="8" placeholder="One per line:&#10;Name | Glass | Category | Base | Garnish | Method | 2 oz Gin; 1 oz Lime juice; top Soda water"></textarea>
    <p class="sub" style="margin:8px 0 14px;font-size:12.5px">JSON: an array of {name, glass, category, base, garnish, method, ingredients:[{label, match, amount, unit}]}.</p>
    <button class="btn primary" id="igo" style="width:100%;justify-content:center">Import</button>`, true);
  $("#ifile", o).onchange = async (e) => { const f = e.target.files[0]; if (f) $("#itxt", o).value = await f.text(); };
  $("#igo", o).onclick = guard(async () => {
    const t = $("#itxt", o).value.trim(); let body;
    try { const j = JSON.parse(t); body = { recipes: Array.isArray(j) ? j : j.recipes }; } catch { body = { text: t }; }
    const r = await api("/recipes/import", "POST", body); o.remove(); await load(); render(); toast(`Added ${r.added} recipe${r.added === 1 ? "" : "s"}${r.skipped ? ` · ${r.skipped} already existed` : ""}`);
  });
}

boot();
