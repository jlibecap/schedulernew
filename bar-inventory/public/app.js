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

const state = { authed: false, pinRequired: false, products: [], suppliers: [], summary: null, moves: [], q: "", cat: "All", status: "all",
  counts: {}, orderQty: {} };
const statusOf = (p) => (p.stock <= 0 ? "out" : p.par > 0 && p.stock < p.par ? "low" : "ok");
const route = () => (location.hash.slice(2) || "dashboard");

async function load() {
  const [products, suppliers, summary, moves] = await Promise.all([api("/products"), api("/suppliers"), api("/summary"), api("/movements?limit=80")]);
  Object.assign(state, { products, suppliers, summary, moves });
}
async function boot() {
  const s = await api("/session");
  state.pinRequired = s.pinRequired; state.authed = s.authed;
  if (state.authed) await load();
  render();
}

// ---------- shell ----------
const NAV = [["dashboard", "Dashboard", "home"], ["inventory", "Inventory", "box"], ["count", "Count", "count"], ["reorder", "Reorder", "cart"], ["activity", "Activity", "log"], ["suppliers", "Suppliers", "users"]];
function render() {
  const app = $("#app");
  if (!state.authed) {
    app.innerHTML = `<div class="login"><form class="card" id="pinf"><div class="logo">🍸</div><h1>Last Call</h1><p class="sub" style="margin:6px 0 20px">Enter the bar PIN to continue</p>
      <input type="password" inputmode="numeric" id="pin" placeholder="PIN" autofocus style="text-align:center;font-size:20px;letter-spacing:.3em;margin-bottom:14px"><button class="btn primary" style="width:100%;justify-content:center">Unlock</button></form></div>`;
    $("#pinf").onsubmit = guard(async (e) => { e.preventDefault(); await api("/auth", "POST", { pin: $("#pin").value }); state.authed = true; await load(); render(); });
    return;
  }
  const r = route(), low = state.products.filter((p) => statusOf(p) !== "ok").length;
  const links = (cls) => NAV.map(([k, label, i]) => `<a href="#/${k}" class="${r === k ? "active" : ""}">${ic(i)}<span>${label}</span>${k === "reorder" && low ? `<span class="badge">${low}</span>` : ""}</a>`).join("");
  app.innerHTML = `<div class="shell"><aside class="side"><div class="brand"><div class="logo">🍸</div><div>Last Call<small>Bar inventory</small></div></div>
    <nav class="nav">${links()}</nav><div class="spacer"></div><a class="btn ghost sm" href="/api/export.csv">${ic("file")} Export CSV</a></aside>
    <main id="view"></main></div>
    <nav class="tabbar">${NAV.slice(0, 5).map(([k, label, i]) => `<a href="#/${k}" class="${r === k ? "active" : ""}">${ic(i)}${label}${k === "reorder" && low ? `<span class="badge">${low}</span>` : ""}</a>`).join("")}<a href="#/suppliers" class="${r === "suppliers" ? "active" : ""}">${ic("users")}Vendors</a></nav>`;
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
    <div class="row"><button class="btn" id="d-count">${ic("count")} Start count</button><button class="btn primary" id="d-recv">${ic("down")} Receive delivery</button></div></div>
    <div class="grid stats">
      <div class="card stat"><div class="label">${ic("dollar")} Stock value (cost)</div><div class="value">${money(s.stockValue)}</div><div class="hint">${money(s.retailValue)} at retail</div></div>
      <div class="card stat"><div class="label">${ic("alert")} Need reordering</div><div class="value" style="color:${s.lowCount ? "var(--warn)" : "var(--ok)"}">${s.lowCount}</div><div class="hint">${s.outCount} completely out</div></div>
      <div class="card stat"><div class="label">${ic("drop")} Used · 7 days</div><div class="value">${money(s.week.used)}</div><div class="hint">${money(s.week.wasted)} wasted</div></div>
      <div class="card stat"><div class="label">${ic("down")} Received · 7 days</div><div class="value">${money(s.week.received)}</div><div class="hint">${s.products} products tracked</div></div></div>
    <div class="grid cols"><div class="card"><h2>Needs attention</h2>${low.length ? `<div class="list" style="margin-top:14px">${low.slice(0, 6).map(itemRow).join("")}</div>${low.length > 6 ? `<a href="#/reorder" class="btn sm" style="margin-top:14px">See all ${low.length} →</a>` : ""}` : `<div class="empty"><div class="big">🎉</div>Everything is above par.</div>`}</div>
    <div class="grid" style="align-content:start"><div class="card"><h2>Stock value by category</h2><div class="bars">${cats.map(([c, v]) => `<div class="bar"><div class="top"><span>${esc(c)}</span><span>${money(v)}</span></div><div class="track"><div class="fill" style="width:${(v / max) * 100}%"></div></div></div>`).join("") || '<p class="sub">No products yet.</p>'}</div></div>
    <div class="card"><h2>Usage & waste · last 7 days</h2><div class="spark">${days.map(([d, v]) => `<div title="${money(v)}"><i style="height:${(v / dmax) * 85 + 4}%"></i>${new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "narrow" })}</div>`).join("")}</div></div></div></div>`;
  bindItems(el);
  $("#d-count").onclick = () => (location.hash = "#/count");
  $("#d-recv").onclick = () => pickProduct("receive");
};

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
    <button class="btn primary" id="add">${ic("plus")} Add product</button></div>
    <div class="toolbar"><div class="search">${ic("search")}<input id="q" placeholder="Search products, suppliers, locations…" value="${esc(state.q)}"></div>
    <select id="st" style="width:auto"><option value="all">All stock</option><option value="low">Low or out</option><option value="out">Out of stock</option></select></div>
    <div class="chips">${cats.map((c) => `<button class="chip ${state.cat === c ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="list" id="list"></div>`;
  $("#st").value = state.status;
  const paint = () => {
    const q = state.q.toLowerCase();
    const rows = state.products.filter((p) => (state.cat === "All" || p.category === state.cat) && (state.status === "all" || (state.status === "out" ? statusOf(p) === "out" : statusOf(p) !== "ok"))
      && (!q || [p.name, p.category, p.supplier_name, p.location, p.size].join(" ").toLowerCase().includes(q)));
    $("#list").innerHTML = rows.map(itemRow).join("") || `<div class="empty"><div class="big">🔍</div>No products match.</div>`; bindItems($("#list"));
  };
  paint();
  $("#q").oninput = (e) => { state.q = e.target.value; paint(); };
  $("#st").onchange = (e) => { state.status = e.target.value; paint(); };
  el.querySelectorAll(".chip").forEach((c) => (c.onclick = () => { state.cat = c.dataset.c; render(); }));
  $("#add").onclick = () => productForm();
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
function pickProduct(mode) {
  const o = overlay(`<h1 style="font-size:22px;margin-bottom:14px">Pick a product</h1><input id="pq" placeholder="Search…" autofocus style="margin-bottom:12px"><div class="list" id="pl"></div>`, true);
  const paint = () => { const q = $("#pq", o).value.toLowerCase(); $("#pl", o).innerHTML = state.products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 30).map((p) => `<div class="item" style="grid-template-columns:1fr auto" data-id="${p.id}"><div><div class="name">${esc(p.name)}</div><div class="meta">${fmt(p.stock)} on hand</div></div></div>`).join(""); $("#pl", o).querySelectorAll(".item").forEach((it) => (it.onclick = () => { o.remove(); openProduct(+it.dataset.id, mode); })); };
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
    <div class="field"><label>Notes</label><textarea name="notes" rows="2">${v("notes")}</textarea></div>
    <div class="row"><button class="btn primary" style="flex:1;justify-content:center">Save</button>${p.id ? `<button type="button" class="btn danger" id="del">${ic("trash")}</button>` : ""}</div></form>`);
  $("#pf", o).onsubmit = guard(async (e) => {
    e.preventDefault(); const body = Object.fromEntries(new FormData(e.target));
    await api(p.id ? `/products/${p.id}` : "/products", p.id ? "PUT" : "POST", body); o.remove(); await load(); render(); toast("Saved");
  });
  if (p.id) $("#del", o).onclick = guard(async () => { if (!confirm(`Remove ${p.name}? History is kept.`)) return; await api(`/products/${p.id}`, "DELETE"); o.remove(); await load(); render(); toast("Removed"); });
}

// ---------- count ----------
views.count = (el) => {
  const groups = {}; state.products.forEach((p) => (groups[p.location || "Unassigned"] ||= []).push(p));
  el.innerHTML = `<div class="head"><div><h1>Stock count</h1><p class="sub">Enter what's physically on the shelf. Only changed rows are saved, and variances are logged.</p></div>
    <button class="btn primary" id="save">${ic("count")} Save count</button></div>
    ${Object.entries(groups).sort().map(([loc, ps]) => `<div class="group"><h2>${esc(loc)} <span class="sub">${ps.length} items</span></h2><div class="card" style="padding:6px 14px"><table>${ps.map((p) => `<tr><td><b>${esc(p.name)}</b><div class="sub">${esc(p.size)}</div></td><td class="sub">System: ${fmt(p.stock)}</td><td style="text-align:right"><input type="number" step="any" min="0" inputmode="decimal" data-id="${p.id}" placeholder="${fmt(p.stock)}" value="${state.counts[p.id] ?? ""}"></td></tr>`).join("")}</table></div></div>`).join("")}`;
  el.querySelectorAll("input[data-id]").forEach((i) => (i.oninput = () => (state.counts[i.dataset.id] = i.value)));
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
  if (s.id) $("#del", o).onclick = guard(async () => { if (!confirm(`Delete ${s.name}?`)) return; await api(`/suppliers/${s.id}`, "DELETE"); o.remove(); await load(); render(); });
}

boot();
