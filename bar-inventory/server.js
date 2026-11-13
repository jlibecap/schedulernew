// Bar Inventory — zero-dependency Node server (Node >= 22.13, uses built-in node:sqlite).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3100);
// Bind to all interfaces so the Tailscale IP works. Set HOST=127.0.0.1 when using `tailscale serve`.
const HOST = process.env.HOST || "0.0.0.0";
const PIN = process.env.BAR_PIN || ""; // optional shared PIN on top of Tailscale
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "bar.db");
const PUBLIC = path.join(__dirname, "public");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, contact TEXT DEFAULT '', phone TEXT DEFAULT '',
  email TEXT DEFAULT '', notes TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Other',
  size TEXT DEFAULT '', unit TEXT DEFAULT 'bottle', cost REAL DEFAULT 0, price REAL DEFAULT 0,
  par REAL DEFAULT 0, stock REAL DEFAULT 0, supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  location TEXT DEFAULT '', notes TEXT DEFAULT '', archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS movements (
  id INTEGER PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL, delta REAL NOT NULL, balance REAL NOT NULL, note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mov_created ON movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mov_product ON movements(product_id);
`);

const MOVE_TYPES = new Set(["receive", "use", "waste", "count", "adjust"]);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const str = (v, max = 200) => String(v ?? "").trim().slice(0, max);

function tx(fn) {
  db.exec("BEGIN");
  try { const r = fn(); db.exec("COMMIT"); return r; } catch (e) { db.exec("ROLLBACK"); throw e; }
}
const cleanProduct = (b) => ({
  name: str(b.name, 120), category: str(b.category, 60) || "Other", size: str(b.size, 40),
  unit: str(b.unit, 30) || "bottle", cost: Math.max(0, num(b.cost)), price: Math.max(0, num(b.price)),
  par: Math.max(0, num(b.par)), supplier_id: b.supplier_id ? Number(b.supplier_id) : null,
  location: str(b.location, 60), notes: str(b.notes, 500),
});
function addMovement(productId, type, delta, note) {
  const p = db.prepare("SELECT stock FROM products WHERE id=?").get(productId);
  if (!p) throw new HttpError(404, "Product not found");
  const balance = Math.round((p.stock + delta) * 1000) / 1000;
  db.prepare("UPDATE products SET stock=? WHERE id=?").run(balance, productId);
  db.prepare("INSERT INTO movements(product_id,type,delta,balance,note) VALUES(?,?,?,?,?)")
    .run(productId, type, delta, balance, note);
  return balance;
}
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

const listProducts = () => db.prepare(`
  SELECT p.*, s.name AS supplier_name FROM products p LEFT JOIN suppliers s ON s.id=p.supplier_id
  WHERE p.archived=0 ORDER BY p.category, p.name`).all();

// ---- API routes --------------------------------------------------------------------------
const routes = [];
const route = (method, pattern, handler) =>
  routes.push({ method, re: new RegExp("^" + pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)") + "$"), handler });

route("GET", "/api/products", () => listProducts());
route("POST", "/api/products", ({ body }) => {
  const p = cleanProduct(body);
  if (!p.name) throw new HttpError(400, "Name is required");
  return tx(() => {
    const id = Number(db.prepare(`INSERT INTO products(name,category,size,unit,cost,price,par,supplier_id,location,notes)
      VALUES(@name,@category,@size,@unit,@cost,@price,@par,@supplier_id,@location,@notes)`).run(p).lastInsertRowid);
    const stock = Math.max(0, num(body.stock));
    if (stock) addMovement(id, "receive", stock, "Opening stock");
    return { id };
  });
});
route("PUT", "/api/products/:id", ({ params, body }) => {
  const p = cleanProduct(body);
  if (!p.name) throw new HttpError(400, "Name is required");
  db.prepare(`UPDATE products SET name=@name,category=@category,size=@size,unit=@unit,cost=@cost,price=@price,
    par=@par,supplier_id=@supplier_id,location=@location,notes=@notes WHERE id=@id`).run({ ...p, id: Number(params.id) });
  return { ok: true };
});
route("DELETE", "/api/products/:id", ({ params }) => {
  db.prepare("UPDATE products SET archived=1 WHERE id=?").run(Number(params.id)); // soft delete keeps history
  return { ok: true };
});
route("POST", "/api/products/:id/move", ({ params, body }) => {
  const type = str(body.type, 20);
  if (!MOVE_TYPES.has(type)) throw new HttpError(400, "Bad movement type");
  const id = Number(params.id);
  return tx(() => {
    let delta;
    if (type === "count") {
      const cur = db.prepare("SELECT stock FROM products WHERE id=?").get(id);
      if (!cur) throw new HttpError(404, "Product not found");
      const counted = num(body.counted, NaN);
      if (!(counted >= 0)) throw new HttpError(400, "Counted quantity must be 0 or more");
      delta = counted - cur.stock;
    } else {
      const q = Math.abs(num(body.qty));
      if (!q) throw new HttpError(400, "Quantity required");
      delta = type === "receive" ? q : type === "adjust" ? num(body.qty) : -q;
    }
    const balance = addMovement(id, type, delta, str(body.note, 200));
    return { balance, delta };
  });
});

route("GET", "/api/suppliers", () => db.prepare("SELECT * FROM suppliers ORDER BY name").all());
route("POST", "/api/suppliers", ({ body }) => {
  if (!str(body.name)) throw new HttpError(400, "Name is required");
  const id = Number(db.prepare("INSERT INTO suppliers(name,contact,phone,email,notes) VALUES(?,?,?,?,?)")
    .run(str(body.name, 120), str(body.contact, 120), str(body.phone, 40), str(body.email, 120), str(body.notes, 500)).lastInsertRowid);
  return { id };
});
route("PUT", "/api/suppliers/:id", ({ params, body }) => {
  if (!str(body.name)) throw new HttpError(400, "Name is required");
  db.prepare("UPDATE suppliers SET name=?,contact=?,phone=?,email=?,notes=? WHERE id=?")
    .run(str(body.name, 120), str(body.contact, 120), str(body.phone, 40), str(body.email, 120), str(body.notes, 500), Number(params.id));
  return { ok: true };
});
route("DELETE", "/api/suppliers/:id", ({ params }) => {
  db.prepare("DELETE FROM suppliers WHERE id=?").run(Number(params.id));
  return { ok: true };
});

route("GET", "/api/movements", ({ query }) => {
  const limit = Math.min(500, Math.max(1, num(query.get("limit"), 100)));
  const pid = query.get("product_id");
  return db.prepare(`SELECT m.*, p.name AS product_name, p.unit FROM movements m JOIN products p ON p.id=m.product_id
    ${pid ? "WHERE m.product_id=?" : ""} ORDER BY m.id DESC LIMIT ${limit}`).all(...(pid ? [Number(pid)] : []));
});

route("GET", "/api/summary", () => {
  const products = listProducts();
  const low = products.filter((p) => p.par > 0 && p.stock < p.par);
  const week = db.prepare(`SELECT m.type, p.cost, m.delta FROM movements m JOIN products p ON p.id=m.product_id
    WHERE m.created_at >= datetime('now','-7 days')`).all();
  let used = 0, wasted = 0, received = 0;
  for (const m of week) {
    if (m.type === "use") used += -m.delta * m.cost;
    else if (m.type === "waste") wasted += -m.delta * m.cost;
    else if (m.type === "receive") received += m.delta * m.cost;
  }
  const byCat = {};
  for (const p of products) byCat[p.category] = (byCat[p.category] || 0) + p.stock * p.cost;
  const daily = db.prepare(`SELECT date(m.created_at) AS day, SUM(-m.delta*p.cost) AS value FROM movements m
    JOIN products p ON p.id=m.product_id WHERE m.type IN ('use','waste') AND m.created_at >= datetime('now','-6 days')
    GROUP BY day ORDER BY day`).all();
  return {
    products: products.length,
    stockValue: products.reduce((s, p) => s + p.stock * p.cost, 0),
    retailValue: products.reduce((s, p) => s + p.stock * p.price, 0),
    lowCount: low.length, outCount: products.filter((p) => p.stock <= 0).length,
    week: { used, wasted, received }, byCategory: byCat, daily,
  };
});

route("GET", "/api/export.csv", () => {
  const q = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const rows = [["Name", "Category", "Size", "Unit", "Stock", "Par", "Cost", "Price", "Supplier", "Location"]];
  for (const p of listProducts()) rows.push([p.name, p.category, p.size, p.unit, p.stock, p.par, p.cost, p.price, p.supplier_name, p.location]);
  return { csv: rows.map((r) => r.map(q).join(",")).join("\n") };
});

// ---- Demo data ---------------------------------------------------------------------------
function seedDemo() {
  if (db.prepare("SELECT COUNT(*) c FROM products").get().c) return;
  const sup = (n, c, ph) => Number(db.prepare("INSERT INTO suppliers(name,contact,phone,email) VALUES(?,?,?,?)")
    .run(n, c, ph, n.toLowerCase().replace(/\W+/g, "") + "@example.com").lastInsertRowid);
  const a = sup("Harbor Spirits Co.", "Dana", "555-0141"), b = sup("Valley Beer & Wine", "Marcus", "555-0172"), c = sup("FreshPress Produce", "Lena", "555-0193");
  const items = [
    ["Tito's Vodka", "Spirits", "1L", "bottle", 21, 0, 6, 9, a, "Well rail"], ["Hendrick's Gin", "Spirits", "750ml", "bottle", 29, 0, 3, 5, a, "Back bar"],
    ["Bacardí Superior Rum", "Spirits", "1L", "bottle", 17, 0, 4, 2, a, "Well rail"], ["Espolòn Blanco", "Spirits", "750ml", "bottle", 24, 0, 4, 6, a, "Back bar"],
    ["Buffalo Trace Bourbon", "Spirits", "750ml", "bottle", 26, 0, 4, 1, a, "Back bar"], ["Campari", "Liqueurs", "1L", "bottle", 28, 0, 2, 3, a, "Back bar"],
    ["Cointreau", "Liqueurs", "750ml", "bottle", 31, 0, 2, 2, a, "Back bar"], ["Dolin Dry Vermouth", "Liqueurs", "750ml", "bottle", 12, 0, 2, 0, a, "Fridge"],
    ["Guinness", "Beer", "16oz can", "case", 52, 0, 3, 4, b, "Cooler"], ["Local IPA Keg", "Beer", "1/6 bbl", "keg", 78, 0, 2, 1, b, "Walk-in"],
    ["Corona", "Beer", "12oz btl", "case", 31, 0, 3, 5, b, "Cooler"], ["Prosecco", "Wine", "750ml", "bottle", 11, 0, 8, 12, b, "Fridge"],
    ["Pinot Noir", "Wine", "750ml", "bottle", 14, 0, 6, 7, b, "Cellar"], ["Sauvignon Blanc", "Wine", "750ml", "bottle", 10, 0, 6, 3, b, "Fridge"],
    ["Fresh Limes", "Produce", "", "lb", 2.4, 0, 10, 14, c, "Walk-in"], ["Lemons", "Produce", "", "lb", 2.9, 0, 8, 3, c, "Walk-in"],
    ["Mint", "Produce", "bunch", "bunch", 1.5, 0, 6, 8, c, "Walk-in"], ["Simple Syrup", "Mixers", "1L", "bottle", 4, 0, 3, 4, c, "Speed rack"],
    ["Fever-Tree Tonic", "Mixers", "200ml", "case", 24, 0, 3, 2, b, "Dry store"], ["Angostura Bitters", "Mixers", "4oz", "bottle", 9, 0, 2, 3, a, "Back bar"],
  ];
  tx(() => items.forEach(([name, category, size, unit, cost, , par, stock, sid, location]) => {
    const id = Number(db.prepare("INSERT INTO products(name,category,size,unit,cost,par,supplier_id,location) VALUES(?,?,?,?,?,?,?,?)")
      .run(name, category, size, unit, cost, par, sid, location).lastInsertRowid);
    db.prepare("UPDATE products SET price=? WHERE id=?").run(Math.round(cost * 1.6 * 100) / 100, id);
    addMovement(id, "receive", stock + 2, "Opening stock");
    if (stock + 2 > 0) addMovement(id, "use", -2, "Weekend service");
  }));
}
if (process.argv.includes("--demo")) seedDemo();

// ---- HTTP --------------------------------------------------------------------------------
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };

const sessions = new Set();
const parseCookies = (h = "") => Object.fromEntries(h.split(";").map((c) => c.trim().split("=").map(decodeURIComponent)).filter((c) => c[0]));
const send = (res, status, data, headers = {}) => {
  const isStr = typeof data === "string";
  res.writeHead(status, { "Content-Type": isStr ? "text/plain; charset=utf-8" : "application/json", "Cache-Control": "no-store", ...headers });
  res.end(isStr ? data : JSON.stringify(data));
};
const readBody = (req) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on("data", (c) => { size += c.length; if (size > 1e6) { reject(new HttpError(413, "Too large")); req.destroy(); } else chunks.push(c); });
  req.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}); } catch { reject(new HttpError(400, "Invalid JSON")); } });
  req.on("error", reject);
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/auth" && req.method === "POST") {
        const { pin } = await readBody(req);
        const h = (v) => crypto.createHash("sha256").update(String(v ?? "")).digest();
        const ok = !!PIN && crypto.timingSafeEqual(h(pin), h(PIN));
        if (!PIN || ok) {
          const t = crypto.randomBytes(24).toString("hex"); sessions.add(t);
          return send(res, 200, { ok: true }, { "Set-Cookie": `bar_session=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000` });
        }
        return send(res, 401, { error: "Wrong PIN" });
      }
      if (url.pathname === "/api/session") return send(res, 200, { pinRequired: !!PIN, authed: !PIN || sessions.has(parseCookies(req.headers.cookie).bar_session) });
      if (PIN && !sessions.has(parseCookies(req.headers.cookie).bar_session)) return send(res, 401, { error: "PIN required" });

      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = url.pathname.match(r.re);
        if (!m) continue;
        const out = r.handler({ params: m.groups || {}, query: url.searchParams, body: ["POST", "PUT"].includes(req.method) ? await readBody(req) : {} });
        if (out?.csv !== undefined) return res.writeHead(200, { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().slice(0, 10)}.csv"` }), res.end(out.csv);
        return send(res, 200, out);
      }
      return send(res, 404, { error: "Not found" });
    }
    // static
    let file = path.normalize(path.join(PUBLIC, url.pathname === "/" ? "index.html" : url.pathname));
    if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, "index.html");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    send(res, e.status || 500, { error: e.status ? e.message : "Server error" });
    if (!e.status) console.error(e);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  🍸  Bar Inventory running on http://${HOST}:${PORT}`);
  console.log(`      Tailscale: http://<your-tailscale-ip-or-magicdns-name>:${PORT}  (see README)\n`);
});
