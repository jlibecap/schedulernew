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

Anyone who can open the site can **view** the schedule; only people who click "Manager login"
and enter `SCHEDULER_PIN` can edit. If `SCHEDULER_PIN` is unset, everyone can edit.

## Tailscale

`start.sh` runs `tailscale serve --bg 3000`, which publishes the app at
`https://<machine>.<tailnet>.ts.net` to devices on your tailnet (share the node or invite
staff to the tailnet for access). For access from anyone on the internet (e.g. employees'
personal phones), run `./start.sh funnel` (needs Funnel enabled in your tailnet ACLs) and set a PIN.

Back up by copying `data/schedule.json`.
