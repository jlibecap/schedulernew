#!/usr/bin/env bash
# One-time setup on Fedora: build the app, run it as a systemd service that starts on boot,
# and publish it on your tailnet with `tailscale serve`.
#   cd schedulernew && ./deploy/fedora-setup.sh
# Optional: SCHEDULER_PIN=1234 PORT=3100 TS_HTTPS_PORT=8443 ./deploy/fedora-setup.sh
# Uses its own local port and its own Tailscale HTTPS port so it never replaces other apps
# (e.g. Postiz) already served on this machine.
set -euo pipefail
cd "$(dirname "$0")/.."
APP_DIR="$PWD"
RUN_USER="${SUDO_USER:-$USER}"
PORT="${PORT:-3100}"
TS_HTTPS_PORT="${TS_HTTPS_PORT:-8443}"
ENV_FILE=/etc/furniture-fair.env

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  sudo dnf install -y nodejs npm
fi
command -v tailscale >/dev/null || { echo "Install Tailscale first: https://tailscale.com/download/linux"; exit 1; }

if [ -z "${SCHEDULER_PIN:-}" ] && [ ! -f "$ENV_FILE" ]; then
  read -rsp "Choose a manager PIN: " SCHEDULER_PIN; echo
fi
if [ -n "${SCHEDULER_PIN:-}" ]; then
  printf 'SCHEDULER_PIN=%s\nDATA_DIR=%s/data\nNODE_ENV=production\n' "$SCHEDULER_PIN" "$APP_DIR" | sudo tee "$ENV_FILE" >/dev/null
  sudo chmod 600 "$ENV_FILE"
fi

if ss -ltn "sport = :$PORT" | grep -q LISTEN && ! systemctl is-active --quiet furniture-fair; then
  echo "Port $PORT is already in use by something else. Re-run with PORT=<free port>."; exit 1
fi
if tailscale serve status 2>&1 | grep -q ":$TS_HTTPS_PORT" && ! tailscale serve status 2>&1 | grep -q "127.0.0.1:$PORT"; then
  echo "Tailscale HTTPS port $TS_HTTPS_PORT is already serving something else. Re-run with TS_HTTPS_PORT=<other>."; exit 1
fi

npm install
npm run build
mkdir -p data

sudo tee /etc/systemd/system/furniture-fair.service >/dev/null <<UNIT
[Unit]
Description=Furniture Fair Scheduler
After=network-online.target

[Service]
User=$RUN_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$(command -v node) $APP_DIR/node_modules/next/dist/bin/next start -p $PORT -H 127.0.0.1
Restart=always

[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now furniture-fair
sudo systemctl restart furniture-fair

sudo tailscale serve --bg --https="$TS_HTTPS_PORT" "$PORT"
echo; tailscale serve status
echo "Employee view: https://$(tailscale status --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))'):$TS_HTTPS_PORT/"
echo "Manager page:  same address + /manager"
