# Furniture Fair Scheduler

Weekly staff scheduler. Hours: Mon–Sat 11a–8p, Sun 11a–6p.
Shifts: **10:30a–8p**, **12p–8p**, **10:30a–6p** (Sundays only allow 10:30a–6p, since the store closes at 6).

Features: week view, assign people to shifts (one shift per person per day), days-off, hourly
coverage bars (red = under minimum staff), weekly hours per person, print view.
Data is stored in `data/schedule.json` (no database or external accounts needed).

## Run

```bash
npm install
npm run build
SCHEDULER_PIN=1234 ./start.sh
```

Two pages: `/` is the read-only employee schedule, and `/manager` is where edits are made (PIN-protected via `SCHEDULER_PIN`; if unset, anyone with the link can edit).

## Tailscale

`start.sh` runs `tailscale serve --bg 3000`, which publishes the app at
`https://<machine>.<tailnet>.ts.net` to devices on your tailnet (share the node or invite
staff to the tailnet for access). For access from anyone on the internet (e.g. employees'
personal phones), run `./start.sh funnel` (needs Funnel enabled in your tailnet ACLs) and set a PIN.

Back up by copying `data/schedule.json`.

## Fedora (always-on) setup

```bash
git clone -b claude/furniture-fair-scheduler-5za8u1 https://github.com/jlibecap/schedulernew.git
cd schedulernew && ./deploy/fedora-setup.sh
```
Uses local port 3100 and Tailscale HTTPS port 8443 (so it will not replace other apps like Postiz); override with `PORT=` and `TS_HTTPS_PORT=`. Result: `https://<machine>.<tailnet>.ts.net:8443/`.
Update later with `git pull && npm run build && sudo systemctl restart furniture-fair`.
Needs HTTPS enabled for your tailnet (Tailscale admin console → DNS → HTTPS Certificates).
