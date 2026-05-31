#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/memesee}"
DOMAIN="${DOMAIN:-memesee.world}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
NGINX_SITE_NAME="${NGINX_SITE_NAME:-memesee.world.conf}"
SKIP_PULL="${SKIP_PULL:-false}"

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  echo "Missing .env. Copy deploy/.env.production.example to .env and fill secrets first." >&2
  exit 1
fi

if grep -Eq 'replace-with-|same-value-as' .env; then
  echo ".env still contains placeholder values. Replace every replace-with-* value before deploying." >&2
  grep -En 'replace-with-|same-value-as' .env >&2 || true
  exit 1
fi

if [ "$SKIP_PULL" != "true" ]; then
  git pull --ff-only
fi

docker compose -f "$COMPOSE_FILE" up -d --build

if command -v nginx >/dev/null 2>&1; then
  if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    NGINX_SOURCE="deploy/nginx/$DOMAIN.ssl.conf"
  else
    NGINX_SOURCE="deploy/nginx/$DOMAIN.http.conf"
  fi

  if [ ! -f "$NGINX_SOURCE" ]; then
    echo "Missing nginx config: $NGINX_SOURCE" >&2
    exit 1
  fi

  if [ -d /etc/nginx/sites-available ]; then
    sudo cp "$NGINX_SOURCE" "/etc/nginx/sites-available/$NGINX_SITE_NAME"
    sudo ln -sfn "/etc/nginx/sites-available/$NGINX_SITE_NAME" "/etc/nginx/sites-enabled/$NGINX_SITE_NAME"
  else
    sudo cp "$NGINX_SOURCE" "/etc/nginx/conf.d/$NGINX_SITE_NAME"
  fi

  sudo nginx -t
  sudo systemctl reload nginx
else
  echo "nginx is not installed; skipped nginx config install."
fi

curl -fsS http://127.0.0.1:8080/api/communities >/dev/null
curl -fsS http://127.0.0.1:3000 >/dev/null

echo "memesee deployment finished for $DOMAIN"
echo "If /api returns 500, inspect logs with:"
echo "  docker compose -f $COMPOSE_FILE logs --tail=200 gateway-service user-service content-service"
