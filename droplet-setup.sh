#!/bin/bash
# Run on a fresh Ubuntu 24.04 DigitalOcean Droplet
# Usage: bash droplet-setup.sh yourdomain.com
set -e
DOMAIN=${1:-"ausautoparts.yourdomain.com"}
echo "Setting up AusAutoParts on $DOMAIN"
apt-get update && apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release ufw openssl
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable docker
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
mkdir -p /opt/ausautoparts && cd /opt/ausautoparts
PGPASS=$(openssl rand -hex 16)
REDISPASS=$(openssl rand -hex 16)
JWTS=$(openssl rand -hex 32)
JWTR=$(openssl rand -hex 32)
printf "POSTGRES_USER=ausautoparts\nPOSTGRES_PASSWORD=%s\nPOSTGRES_DB=auto_parts_platform\nREDIS_PASSWORD=%s\nJWT_SECRET=%s\nJWT_REFRESH_SECRET=%s\nNODE_ENV=production\nPORT=3000\nAPI_PREFIX=/api/v1\nBCRYPT_ROUNDS=12\nALLOWED_ORIGINS=https://%s\nCORS_CREDENTIALS=true\nRATELIMIT_WINDOW_MS=3600000\nLOG_LEVEL=info\nLOG_FORMAT=json\n" \
  "$PGPASS" "$REDISPASS" "$JWTS" "$JWTR" "$DOMAIN" > .env.production
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx-proxy.conf
docker run --rm -p 80:80 \
  -v /opt/ausautoparts/certbot-www:/var/www/certbot \
  -v /opt/ausautoparts/certbot-certs:/etc/letsencrypt \
  certbot/certbot certonly --standalone --non-interactive --agree-tos \
  --email "admin@$DOMAIN" -d "$DOMAIN"
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
sleep 20
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec -T backend npx ts-node prisma/seed.ts || true
echo "Live at https://$DOMAIN"
echo "Admin: admin@aussieautoparts.com.au / Password123!"
