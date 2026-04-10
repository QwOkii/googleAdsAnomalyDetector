#!/bin/bash
# Запускати на VPS після того як DNS вже прописані і docker-compose запущений

set -e

echo "=== Step 1: Starting with HTTP-only config ==="
cp nginx/conf.d/default.conf nginx/conf.d/active.conf
docker compose restart nginx

echo "=== Step 2: Getting SSL certificates ==="
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d ads.vkoctak.tech

docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d ads-api.vkoctak.tech

echo "=== Step 3: Switching to HTTPS config ==="
cp nginx/conf.d/default.ssl.conf nginx/conf.d/active.conf
docker compose restart nginx

echo "=== Done! ==="
echo "Frontend: https://ads.vkoctak.tech"
echo "Backend:  https://ads-api.vkoctak.tech"
