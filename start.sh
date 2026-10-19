#!/usr/bin/env bash
# Build (if needed) and run the scheduler, then publish it on your tailnet.
#   SCHEDULER_PIN=1234 ./start.sh            # tailnet only (private to your Tailscale devices)
#   SCHEDULER_PIN=1234 ./start.sh funnel     # reachable from the public internet
set -e
cd "$(dirname "$0")"
PORT="${PORT:-3000}"
[ -d node_modules ] || npm install
[ -d .next ] || npm run build
if command -v tailscale >/dev/null; then
  if [ "$1" = "funnel" ]; then tailscale funnel --bg "$PORT"; else tailscale serve --bg "$PORT"; fi
  tailscale serve status || true
else
  echo "tailscale not found - serving on http://localhost:$PORT only"
fi
exec npx next start -p "$PORT" -H 0.0.0.0
