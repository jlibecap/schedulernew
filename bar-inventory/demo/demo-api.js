// Browser-only stand-in for server.js, used by the hosted demo build. Same /api surface, data in localStorage (or memory).
window.__DEMO__ = true;
(() => {
  const KEY = "lastCallDemo.v1";
  const store = { get() { try { return localStorage.getItem(KEY); } catch { return null; } }, set(v) { try { localStorage.setItem(KEY, v); } catch { /* storage unavailable: stay in memory */ } } };
  const pad = (n) => String(n).padStart(2, "0");
  const ts = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const str = (v, m = 200) => String(v ?? "").trim().slice(0, m);
  let db = null;
  const save = () => store.set(JSON.stringify(db));
  const err = (status, msg) => Object.assign(new Error(msg), { status });

  const cleanIngs = (list) => (list || []).map((i) => ({ label: str(i.label, 80), match: str(i.match, 120).toLowerCase() || str(i.label, 80).toLowerCase(), amount: Math.max(0, num(i.amount)), unit: str(i.unit, 20) || "oz", optional: i.optional ? 1 : 0 })).filter((i) => i.label);
  function addRecipes(list, source) {
    let added = 0, skipped = 0; const have = new Set(db.recipes.map((r) => r.name.toLowerCase()));
    for (const r of list) {
      const name = str(r.name, 120); if (!name || have.has(name.toLowerCase())) { skipped++; continue; }
      have.add(name.toLowerCase());
      db.recipes.push({ id: db.seq.recipe++, name, glass: str(r.glass, 60), method: str(r.method, 1500), garnish: str(r.garnish, 120), notes: "", category: str(r.category, 40), base: str(r.base, 40), source, favorite: false,
        ingredients: cleanIngs(r.ingredients) });
      added++;
    }
    return { added, skipped };
  }
  function seed() {
    db = { seq: { product: 1, supplier: 1, movement: 1, recipe: 1 }, products: [], suppliers: [], movements: [], recipes: [] };
    const sup = (name, contact, phone) => { const s = { id: db.seq.supplier++, name, contact, phone, email: name.toLowerCase().replace(/\W+/g, "") + "@example.com", notes: "" }; db.suppliers.push(s); return s.id; };
    const a = sup("Harbor Spirits Co.", "Dana", "555-0141"), b = sup("Valley Beer & Wine", "Marcus", "555-0172"), c = sup("FreshPress Produce", "Lena", "555-0193");
    const items = [
      ["Tito's Vodka", "Spirits", "1L", "bottle", 21, 6, 9, a, "Well rail", "850000001017"], ["Hendrick's Gin", "Spirits", "750ml", "bottle", 29, 3, 5, a, "Back bar", "850000001024"],
      ["Bacardí Superior Rum", "Spirits", "1L", "bottle", 17, 4, 2, a, "Well rail", "850000001031"], ["Espolòn Blanco", "Spirits", "750ml", "bottle", 24, 4, 6, a, "Back bar", "850000001048"],
      ["Buffalo Trace Bourbon", "Spirits", "750ml", "bottle", 26, 4, 1, a, "Back bar", "850000001055"], ["Campari", "Liqueurs", "1L", "bottle", 28, 2, 3, a, "Back bar", "850000001062"],
      ["Cointreau", "Liqueurs", "750ml", "bottle", 31, 2, 2, a, "Back bar", ""], ["Dolin Dry Vermouth", "Liqueurs", "750ml", "bottle", 12, 2, 0, a, "Fridge", ""],
      ["Carpano Antica Sweet Vermouth", "Liqueurs", "750ml", "bottle", 27, 2, 3, a, "Fridge", ""], ["Aperol", "Liqueurs", "750ml", "bottle", 22, 2, 4, a, "Back bar", ""],
      ["Guinness", "Beer", "16oz can", "case", 52, 3, 4, b, "Cooler", ""], ["Local IPA Keg", "Beer", "1/6 bbl", "keg", 78, 2, 1, b, "Walk-in", ""],
      ["Corona", "Beer", "12oz btl", "case", 31, 3, 5, b, "Cooler", ""], ["Prosecco", "Wine", "750ml", "bottle", 11, 8, 12, b, "Fridge", ""],
      ["Pinot Noir", "Wine", "750ml", "bottle", 14, 6, 7, b, "Cellar", ""], ["Sauvignon Blanc", "Wine", "750ml", "bottle", 10, 6, 3, b, "Fridge", ""],
      ["Fresh Limes", "Produce", "", "lb", 2.4, 10, 14, c, "Walk-in", ""], ["Lemons", "Produce", "", "lb", 2.9, 8, 3, c, "Walk-in", ""],
      ["Mint", "Produce", "bunch", "bunch", 1.5, 6, 8, c, "Walk-in", ""], ["Simple Syrup", "Mixers", "1L", "bottle", 4, 3, 4, c, "Speed rack", ""],
      ["Fever-Tree Tonic", "Mixers", "200ml", "case", 24, 3, 2, b, "Dry store", ""], ["Angostura Bitters", "Mixers", "4oz", "bottle", 9, 2, 3, a, "Back bar", ""],
      ["Soda Water", "Mixers", "1L", "bottle", 2, 4, 9, c, "Dry store", ""], ["Fever-Tree Ginger Beer", "Mixers", "200ml", "case", 26, 3, 5, b, "Dry store", ""],
    ];
    items.forEach(([name, category, size, unit, cost, par, stock, sid, location, barcode], n) => {
      const p = { id: db.seq.product++, name, category, size, unit, cost, price: Math.round(cost * 1.6 * 100) / 100, par, stock: 0, supplier_id: sid, location, notes: "", tags: "", barcode, archived: 0 };
      db.products.push(p);
      // a week of believable history so the dashboard looks lived-in
      const t0 = Date.now() - 6.5 * 864e5; let bal = 0;
      const mv = (type, delta, note, when) => { bal = Math.round((bal + delta) * 1000) / 1000; db.movements.push({ id: db.seq.movement++, product_id: p.id, type, delta, balance: bal, note, created_at: ts(new Date(when)) }); };
      const used = []; for (let d = 0; d < 6; d++) if ((n * 7 + d * 3) % 4 !== 0) used.push((n + d) % 3 === 0 ? 2 : 1);
      const total = stock + used.reduce((x, y) => x + y, 0);
      mv("receive", total, "Opening stock", t0);
      used.forEach((q, d) => mv("use", -q, "Service", t0 + (d + 1) * 864e5 * 0.95));
      if (n % 6 === 2) mv("waste", -1, "Dropped bottle", t0 + 3 * 864e5); // a little waste so the chart has both
      p.stock = bal;
    });
    addRecipes(window.__LIB__.LIBRARY, "library");
    save();
  }
  try { db = JSON.parse(store.get() || "null"); } catch { db = null; }
  if (!db?.products) seed();
  // pick up library recipes added in newer builds
  addRecipes(window.__LIB__.LIBRARY, "library");

  const live = () => db.products.filter((p) => !p.archived).map((p) => ({ ...p, supplier_name: db.suppliers.find((s) => s.id === p.supplier_id)?.name ?? null })).sort((x, y) => x.category.localeCompare(y.category) || x.name.localeCompare(y.name));
  const cleanProduct = (b) => ({ name: str(b.name, 120), category: str(b.category, 60) || "Other", size: str(b.size, 40), unit: str(b.unit, 30) || "bottle", cost: Math.max(0, num(b.cost)), price: Math.max(0, num(b.price)), par: Math.max(0, num(b.par)),
    supplier_id: b.supplier_id ? Number(b.supplier_id) : null, location: str(b.location, 60), notes: str(b.notes, 500), tags: str(b.tags, 200), barcode: str(b.barcode, 64).replace(/\s+/g, "") });
  const checkBarcode = (code, self = 0) => { const d = code && db.products.find((p) => !p.archived && p.barcode === code && p.id !== self); if (d) throw err(409, `Barcode already used by ${d.name}`); };
  function move(pid, type, delta, note) {
    const p = db.products.find((x) => x.id === pid); if (!p) throw err(404, "Product not found");
    p.stock = Math.round((p.stock + delta) * 1000) / 1000;
    db.movements.push({ id: db.seq.movement++, product_id: pid, type, delta, balance: p.stock, note, created_at: ts(new Date()) });
    return p.stock;
  }
  function summary() {
    const ps = live(), cutoff = Date.now() - 7 * 864e5; let used = 0, wasted = 0, received = 0; const byCategory = {}, dailyMap = {};
    for (const m of db.movements) {
      const when = Date.parse(m.created_at.replace(" ", "T") + "Z"), p = db.products.find((x) => x.id === m.product_id); if (!p) continue;
      if (when >= cutoff) { if (m.type === "use") used += -m.delta * p.cost; else if (m.type === "waste") wasted += -m.delta * p.cost; else if (m.type === "receive") received += m.delta * p.cost; }
      if ((m.type === "use" || m.type === "waste") && when >= Date.now() - 6 * 864e5) { const day = m.created_at.slice(0, 10); dailyMap[day] = (dailyMap[day] || 0) + -m.delta * p.cost; }
    }
    ps.forEach((p) => (byCategory[p.category] = (byCategory[p.category] || 0) + p.stock * p.cost));
    return { products: ps.length, stockValue: ps.reduce((s, p) => s + p.stock * p.cost, 0), retailValue: ps.reduce((s, p) => s + p.stock * p.price, 0), lowCount: ps.filter((p) => p.par > 0 && p.stock < p.par).length,
      outCount: ps.filter((p) => p.stock <= 0).length, week: { used, wasted, received }, byCategory, daily: Object.entries(dailyMap).sort().map(([day, value]) => ({ day, value })) };
  }
  const routes = [];
  const on = (method, pattern, fn) => routes.push({ method, re: new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), fn });
  on("GET", "/api/session", () => ({ pinRequired: false, authed: true }));
  on("GET", "/api/products", () => live());
  on("POST", "/api/products", ({ body }) => { const p = cleanProduct(body); if (!p.name) throw err(400, "Name is required"); checkBarcode(p.barcode);
    const row = { id: db.seq.product++, ...p, stock: 0, archived: 0 }; db.products.push(row); const s = Math.max(0, num(body.stock)); if (s) move(row.id, "receive", s, "Opening stock"); return { id: row.id }; });
  on("PUT", "/api/products/:id", ({ params, body }) => { const p = cleanProduct(body); if (!p.name) throw err(400, "Name is required"); checkBarcode(p.barcode, +params.id); Object.assign(db.products.find((x) => x.id === +params.id), p); return { ok: true }; });
  on("DELETE", "/api/products/:id", ({ params }) => { db.products.find((x) => x.id === +params.id).archived = 1; return { ok: true }; });
  on("POST", "/api/products/:id/move", ({ params, body }) => {
    const type = str(body.type, 20), p = db.products.find((x) => x.id === +params.id); if (!["receive", "use", "waste", "count", "adjust"].includes(type)) throw err(400, "Bad movement type"); if (!p) throw err(404, "Product not found");
    let delta; if (type === "count") { const c = num(body.counted, NaN); if (!(c >= 0)) throw err(400, "Counted quantity must be 0 or more"); delta = c - p.stock; }
    else { const q = Math.abs(num(body.qty)); if (!q) throw err(400, "Quantity required"); delta = type === "receive" ? q : type === "adjust" ? num(body.qty) : -q; }
    return { balance: move(p.id, type, delta, str(body.note, 200)), delta };
  });
  on("GET", "/api/suppliers", () => [...db.suppliers].sort((x, y) => x.name.localeCompare(y.name)));
  on("POST", "/api/suppliers", ({ body }) => { if (!str(body.name)) throw err(400, "Name is required"); const s = { id: db.seq.supplier++, name: str(body.name, 120), contact: str(body.contact, 120), phone: str(body.phone, 40), email: str(body.email, 120), notes: str(body.notes, 500) }; db.suppliers.push(s); return { id: s.id }; });
  on("PUT", "/api/suppliers/:id", ({ params, body }) => { if (!str(body.name)) throw err(400, "Name is required"); Object.assign(db.suppliers.find((x) => x.id === +params.id), { name: str(body.name, 120), contact: str(body.contact, 120), phone: str(body.phone, 40), email: str(body.email, 120), notes: str(body.notes, 500) }); return { ok: true }; });
  on("DELETE", "/api/suppliers/:id", ({ params }) => { db.suppliers = db.suppliers.filter((s) => s.id !== +params.id); db.products.forEach((p) => p.supplier_id === +params.id && (p.supplier_id = null)); return { ok: true }; });
  on("GET", "/api/movements", ({ query }) => { const lim = Math.min(500, Math.max(1, num(query.get("limit"), 100))), pid = query.get("product_id");
    return db.movements.filter((m) => !pid || m.product_id === +pid).slice().reverse().slice(0, lim).map((m) => { const p = db.products.find((x) => x.id === m.product_id); return { ...m, product_name: p.name, unit: p.unit }; }); });
  on("GET", "/api/summary", () => summary());
  on("GET", "/api/recipes", () => [...db.recipes].sort((x, y) => x.name.localeCompare(y.name)));
  on("POST", "/api/recipes", ({ body }) => { if (!str(body.name)) throw err(400, "Name is required"); const r = addRecipes([body], "custom"); return { id: db.recipes[db.recipes.length - 1].id, ...r }; });
  on("POST", "/api/recipes/import", ({ body }) => { const list = Array.isArray(body.recipes) ? body.recipes : window.__LIB__.parseRecipes(String(body.text || "")); if (!list.length) throw err(400, "No recipes found — check the format"); return addRecipes(list, "imported"); });
  on("PUT", "/api/recipes/:id", ({ params, body }) => { if (!str(body.name)) throw err(400, "Name is required");
    Object.assign(db.recipes.find((x) => x.id === +params.id), { name: str(body.name, 120), glass: str(body.glass, 60), method: str(body.method, 1500), garnish: str(body.garnish, 120), category: str(body.category, 40), base: str(body.base, 40), ingredients: cleanIngs(body.ingredients) }); return { ok: true }; });
  on("DELETE", "/api/recipes/:id", ({ params }) => { db.recipes = db.recipes.filter((r) => r.id !== +params.id); return { ok: true }; });
  on("POST", "/api/recipes/:id/favorite", ({ params, body }) => { db.recipes.find((r) => r.id === +params.id).favorite = !!body.favorite; return { ok: true }; });
  on("POST", "/api/make", ({ body }) => { const label = str(body.label, 80) || "Drink"; for (const d of body.deductions || []) { const q = Math.abs(num(d.qty)); if (q > 0) move(Number(d.product_id), "use", -q, `Made ${label}`); } return { ok: true }; });

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    if (!url.pathname.startsWith("/api/")) return realFetch(input, init);
    const method = (init.method || "GET").toUpperCase(), r = routes.find((x) => x.method === method && x.re.test(url.pathname));
    const reply = (status, data) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    if (!r) return reply(404, { error: "Not found" });
    try { const out = r.fn({ params: url.pathname.match(r.re).groups || {}, query: url.searchParams, body: init.body ? JSON.parse(init.body) : {} }); if (method !== "GET") save(); return reply(200, out); }
    catch (e) { return reply(e.status || 500, { error: e.status ? e.message : "Demo error" }); }
  };
  // ribbon + disable downloads (blocked in sandboxed pages)
  const ribbon = document.createElement("div"); ribbon.id = "demo-ribbon";
  ribbon.innerHTML = `<b>Live demo</b> · changes stay in your browser · <a href="#" id="demo-reset">reset</a>`; document.body.append(ribbon);
  document.addEventListener("click", (e) => {
    if (e.target.closest("#demo-reset")) { e.preventDefault(); db = null; try { localStorage.removeItem(KEY); } catch {} seed(); location.reload(); }
    const a = e.target.closest('a[href$="export.csv"]'); if (a) { e.preventDefault(); const t = document.createElement("div"); t.className = "toast"; t.textContent = "CSV download is disabled in the hosted demo"; document.getElementById("toasts").append(t); setTimeout(() => t.remove(), 2400); }
  }, true);
})();
