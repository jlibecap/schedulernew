# 🍸 Last Call — Bar Inventory

Modern, mobile-first bar inventory & management. **Zero npm dependencies** — just Node 22.13+ (uses built-in SQLite).

**Features:** dashboard (stock value, usage/waste, low-stock alerts) · inventory with search/filters and one-tap ± adjust ·
receive / use / waste logging · guided stock counts with variance tracking · auto reorder sheets grouped by supplier
(copy / email) · full activity log · suppliers · CSV export · optional PIN.

## Run

```bash
cd bar-inventory
npm start            # or: npm run demo   (loads sample data)
# → http://localhost:3100
```

Data lives in `data/bar.db` (SQLite). Back it up by copying that file.

## Access over Tailscale

Run this on the machine that hosts the app (it must be on your tailnet).

**Option A — HTTPS via Tailscale Serve (recommended):**
```bash
HOST=127.0.0.1 npm start &
tailscale serve --bg --https=443 http://127.0.0.1:3100
# open https://<machine>.<tailnet>.ts.net  (works on phones too; "Add to Home Screen")
```
Only devices on your tailnet can reach it. (Never use `tailscale funnel` unless you want it public.)

**Option B — plain HTTP to the Tailscale IP:**
```bash
npm start                        # binds 0.0.0.0:3100
# open http://100.x.y.z:3100  or  http://<machine-name>:3100 (MagicDNS)
```

## Config (env vars)

| Var | Default | |
|---|---|---|
| `PORT` | `3100` | listen port |
| `HOST` | `0.0.0.0` | use `127.0.0.1` with Tailscale Serve |
| `BAR_PIN` | *(none)* | optional shared PIN on top of Tailscale |
| `DB_PATH` | `data/bar.db` | database location |
