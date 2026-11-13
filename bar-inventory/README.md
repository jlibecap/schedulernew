# 🍸 Last Call — Bar Inventory

Modern, mobile-first bar inventory & management. **Zero npm dependencies** — just Node 22.13+ (uses built-in SQLite).

**Features:** dashboard (stock value, usage/waste, low-stock alerts) · inventory with search/filters and one-tap ± adjust ·
receive / use / waste logging · guided stock counts with variance tracking · auto reorder sheets grouped by supplier
(copy / email) · **23 classic cocktail recipes matched to your live stock, favorites, custom recipes, and one-tap "make it" that deducts stock** · full activity log · suppliers · CSV export · optional PIN.

## Barcode scanning

Tap the round **scan button** (phone) or **Scan** (desktop) — or the scan icon inside a product's Barcode field.
- **Look up** mode shows the product with one-tap *Use 1 / Receive 1*. **Receive +1** and **Use −1** modes apply instantly on every scan, so you can scan a whole delivery bottle by bottle.
- Unknown barcode? Create a new product with it prefilled, or link it to an existing product. Each barcode can belong to one product.
- On the **Count** page, *Scan to count* adds 1 to a product's count per scan.
- Works with the phone camera (native `BarcodeDetector` on Chrome/Android, bundled ZXing fallback for iPhone Safari), and with USB/Bluetooth keyboard-style scanners via the text box.
- **Phone cameras only work over HTTPS** — use the `https://<machine>.<tailnet>.ts.net` address from `tailscale serve` (Option A below). The plain `http://100.x.y.z` address will still let you type codes, but the browser blocks the camera.

## Cocktails

- **Can make now / Almost there / Favorites / All** — each recipe's ingredients are matched to your inventory by name, brand (e.g. Espolòn → tequila) or the product's *Cocktail keywords* field, and only count if they're in stock.
- Tap ♥ to favorite. Tap a drink for ingredients (with which of your bottles it'd use), method, and serving count.
- **Make it** deducts pour volume as a fraction of a bottle (bottle sizes like `750ml`/`1L` are read automatically). Fresh items and top-ups aren't tracked.
- Add or edit your own recipes; list alternates in "matches" with `|` (e.g. `gin|plymouth`).

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
