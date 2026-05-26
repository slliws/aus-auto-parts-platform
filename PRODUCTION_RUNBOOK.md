# Aus Auto Parts Platform — Production Deployment Runbook

> **Written:** 2026-05-26 | **Platform version:** post-ST#5 (5 stress tests, 0 open findings)
> **Replaces:** the stale DEPLOYMENT_GUIDE.md (last updated 2025-11-14)

---

## Overview

This is the single authoritative guide for deploying the platform to production. The full stack is:

| Service | Container | Network |
|---------|-----------|---------|
| Backend (Node/Express, TypeScript) | `aus-auto-parts-backend` | internal only |
| Frontend (React/Vite via nginx) | `aus-auto-parts-frontend` | internal + proxy |
| PostgreSQL 16 (digest-pinned) | `aus-auto-parts-postgres` | internal only |
| Redis 7 (digest-pinned, ACL auth) | `aus-auto-parts-redis` | internal only |
| nginx-proxy (TLS termination) | `aus-auto-parts-nginx-proxy` | proxy |
| acme-companion (Let's Encrypt) | `aus-auto-parts-acme` | proxy |

**Key design decisions:**
- DB and Redis are **not exposed to the host** — internal Docker network only
- TLS via nginx-proxy + Let's Encrypt — cleartext :80 is auto-redirected to :443
- Redis password lives in ACL file, NOT in command args (invisible to `docker inspect`)
- Docker images use sha256-pinned digests — no silent tag drift
- Both Dockerfiles fail hard on TS errors — no silent fallbacks

---

## Prerequisites

### Server Requirements
- Linux server (Debian 11+, Ubuntu 20.04+, or any modern distro)
- Docker Engine 24+ and Docker Compose v2 (`docker compose`, not `docker-compose`)
- Ports **80** and **443** accessible from internet (for Let's Encrypt ACME challenge)
- A **public domain name** with DNS A record pointing to server IP
- Minimum: 2 vCPU, 2GB RAM, 20GB free disk

### Install Docker (if not installed)
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
docker --version && docker compose version
```

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/<your-org>/aus-auto-parts-platform.git
cd aus-auto-parts-platform
```

Or if deploying from a zip:
```bash
unzip aus-auto-parts-platform.zip
cd aus-auto-parts-platform
```

---

## Step 2 — Generate Secrets

Run these commands to generate strong, unique secrets. **Do this before creating any .env files.**

```bash
# Generate JWT secrets (64-byte hex)
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
echo "JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

# Generate DB password (32 chars alphanumeric)
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '+/=' | head -c 32)"

# Generate Redis password (24 chars)
echo "REDIS_PASSWORD=$(openssl rand -base64 18 | tr -d '+/=' | head -c 24)"
```

Save all these values somewhere secure (password manager). You'll use them in the next steps.

---

## Step 3 — Configure Redis ACL

The Redis password is stored in an ACL file (not in env vars or command args) so it cannot be leaked via `docker inspect`.

```bash
# Copy the template
cp redis/acl.conf.template redis/acl.conf

# Replace the placeholder with your actual Redis password
sed -i 's/<REDIS_PASSWORD_HERE>/YOUR_REDIS_PASSWORD_HERE/' redis/acl.conf

# Verify it looks right (password should not be the placeholder)
cat redis/acl.conf
# Expected: user default on >YourActualPassword allkeys allcommands
```

> ⚠️ `redis/acl.conf` is in `.gitignore` — never commit it.

---

## Step 4 — Create Backend Production .env

```bash
# Copy the template
cp backend/.env.prod.example backend/.env.prod

# Edit with your values
nano backend/.env.prod   # or vim, etc.
```

**Required fields to fill in (everything else has safe defaults):**

| Variable | What to set |
|----------|-------------|
| `DATABASE_URL` | `postgresql://YOURUSER:YOURPASS@localhost:5432/aus_auto_parts_prod?schema=public` |
| `POSTGRES_USER` | Your chosen DB username (e.g. `autoparts_prod`) |
| `POSTGRES_PASSWORD` | The password you generated in Step 2 |
| `POSTGRES_DB` | `aus_auto_parts_prod` |
| `REDIS_PASSWORD` | The Redis password you generated in Step 2 |
| `JWT_SECRET` | 64-char hex from Step 2 |
| `JWT_REFRESH_SECRET` | 64-char hex from Step 2 |
| `SESSION_SECRET` | 32-char hex from Step 2 |
| `ALLOWED_ORIGINS` | `https://your-domain.com.au` (your actual domain) |
| `APP_DOMAIN` | `your-domain.com.au` |
| `ACME_EMAIL` | Your email for cert expiry notifications |

**Email (SMTP) — configure when ready:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-key
EMAIL_FROM=noreply@your-domain.com.au
```
Order confirmation emails and password reset emails will be silently skipped until SMTP is configured. Non-blocking.

> ⚠️ `backend/.env.prod` is in `.gitignore` — never commit it.

---

## Step 5 — DNS Verification

Before deploying, verify your domain resolves to your server's IP:

```bash
# Should return your server's public IP
dig +short your-domain.com.au A

# Or
nslookup your-domain.com.au
```

Let's Encrypt will fail if DNS isn't propagated. If you just updated DNS, wait 5–10 minutes.

---

## Step 6 — First Deploy

```bash
# Build images and start all 6 services in detached mode
docker compose -f docker-compose.prod.yml up -d --build

# Watch logs during startup (Ctrl+C to stop watching, containers keep running)
docker compose -f docker-compose.prod.yml logs -f
```

**Expected startup sequence:**
1. `postgres` and `redis` start first → become healthy
2. `backend` starts → runs Prisma migrations → becomes healthy
3. `frontend` starts → nginx serves built assets → becomes healthy
4. `nginx-proxy` starts → discovers frontend container via VIRTUAL_HOST env
5. `acme-companion` starts → requests Let's Encrypt cert for your domain

Let's Encrypt cert issuance takes **30–120 seconds** on first deploy.

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Expected: all services STATUS = "running (healthy)"
```

---

## Step 7 — Verify Deployment

```bash
# Health check — should return {"status":"ok"}
curl https://your-domain.com.au/api/v1/health

# TLS — should show valid Let's Encrypt certificate
curl -v https://your-domain.com.au 2>&1 | grep "SSL certificate"

# HTTP redirect — should redirect to HTTPS (301/302)
curl -I http://your-domain.com.au
```

Then open `https://your-domain.com.au` in your browser.

**First login:**
- Email: `admin@example.com`
- Password: `admin123`

> ⚠️ **Change the admin password immediately after first login.**

---

## Step 8 — Post-Deploy Checklist

- [ ] Admin password changed from `admin123`
- [ ] HTTPS works and certificate is valid
- [ ] HTTP → HTTPS redirect works
- [ ] `/api/v1/health` returns `{"status":"ok"}`
- [ ] Can log in, create a customer, add a part, create a quote
- [ ] SMTP configured (or acknowledged as deferred)
- [ ] DB backups scheduled (see Backups section below)
- [ ] Server firewall: only 22/80/443 open (see Firewall below)

---

## Firewall Configuration

The prod compose does NOT expose Postgres, Redis, or backend ports to the host. Only nginx-proxy binds to :80 and :443.

```bash
# Minimal UFW rules for production
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (nginx-proxy auto-redirects to HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Verify
sudo ufw status verbose
```

> Do NOT open :3000 (backend), :5432 (Postgres), or :6379 (Redis) — they are internal-only by design.

---

## Database Backups

Automated daily backup to local file:

```bash
# Create backup directory
mkdir -p /opt/backups/aus-auto-parts

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * docker exec aus-auto-parts-postgres pg_dump -U \$POSTGRES_USER \$POSTGRES_DB > /opt/backups/aus-auto-parts/db_\$(date +\%Y\%m\%d).sql 2>&1") | crontab -

# Manual backup anytime
docker exec aus-auto-parts-postgres pg_dump -U YOUR_USER aus_auto_parts_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
cat backup.sql | docker exec -i aus-auto-parts-postgres psql -U YOUR_USER -d aus_auto_parts_prod
```

For offsite backups, consider rsync to another server or rclone to S3/Backblaze.

---

## Management Commands

```bash
# Status
docker compose -f docker-compose.prod.yml ps

# Logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Restart a service
docker compose -f docker-compose.prod.yml restart backend

# Stop everything (data preserved in volumes)
docker compose -f docker-compose.prod.yml down

# Start again (no rebuild)
docker compose -f docker-compose.prod.yml up -d

# Resource usage
docker stats

# Disk usage
docker system df
```

---

## Updating / Redeploying

```bash
# Pull latest code
git pull origin main

# Rebuild images and restart (zero-downtime not guaranteed — brief gap during restart)
docker compose -f docker-compose.prod.yml up -d --build

# If you want to force a full restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

> Postgres and Redis data live in **named volumes** (`aus-auto-parts-postgres-prod`, `aus-auto-parts-redis-prod`). They survive `down` and `up` — only `down -v` destroys them.

---

## Troubleshooting

### Let's Encrypt cert not issued

```bash
# Check acme-companion logs
docker logs aus-auto-parts-acme

# Common issues:
# - DNS not propagated yet (wait 5 min, retry)
# - Port 80 blocked by firewall (must be open for ACME challenge)
# - Domain doesn't resolve to this server IP
```

### Backend won't start

```bash
docker logs aus-auto-parts-backend

# Common causes:
# - Prisma migration failed (check DB connectivity)
# - Missing env var (look for "Cannot read properties of undefined")
# - Redis connection refused (check redis/acl.conf has correct password)
```

### Redis auth failures

```bash
docker logs aus-auto-parts-redis

# Verify ACL file is mounted and password matches backend REDIS_PASSWORD
cat redis/acl.conf
grep REDIS_PASSWORD backend/.env.prod
```

### Database connection refused

```bash
# Test Postgres is healthy
docker exec aus-auto-parts-postgres pg_isready -U YOUR_USER

# Check Postgres logs
docker logs aus-auto-parts-postgres

# Manually connect
docker exec -it aus-auto-parts-postgres psql -U YOUR_USER -d aus_auto_parts_prod
```

### Disk space

```bash
df -h                          # Overall disk
docker system df               # Docker-specific usage
docker system prune            # Remove unused images/containers (SAFE)
docker system prune -a         # Also remove unused images (MORE AGGRESSIVE)
```

---

## Cloudflare Alternative (No Let's Encrypt)

If you use Cloudflare for DNS, you can skip nginx-proxy + acme-companion entirely and let Cloudflare handle TLS:

1. In `docker-compose.prod.yml`, remove the `nginx-proxy` and `acme-companion` services
2. Restore port binding on frontend: add `ports: ["80:80"]`
3. In Cloudflare: enable "Full (strict)" SSL mode, enable HTTPS redirect
4. Set `ALLOWED_ORIGINS` to your Cloudflare-proxied domain in `.env.prod`

This is simpler and free for most use cases.

---

## Security Notes

- **JWT secrets**: Never reuse between dev/staging/prod
- **DB password**: Should be 32+ chars random, not a word/phrase
- **Redis ACL**: Template is in git, but `acl.conf` with real password is gitignored
- **Postgres/Redis**: Not exposed to host network — only accessible from backend container
- **No dev fallbacks in Dockerfiles**: Both images fail hard on TS errors — no silent broken-build deploys
- **PDF rate limiting**: 10 requests/user/min on `/quotes/:id/pdf` and `/orders/:id/invoice`
- **Auth tokens**: Verification + reset tokens are emailed, NOT returned in API responses (dev mode exposes them for convenience only)

---

## Mobile App (Expo)

The mobile app (Expo React Native) connects to the backend via `EXPO_PUBLIC_API_URL`.

For production, set in `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://your-domain.com.au/api/v1
```

Build with EAS Build or Expo classic build. The mobile app is committed at `da77d4f` but does not yet have its own GitHub remote (decision pending).

---

## Platform Status (as of 2026-05-26)

| Stress Test | Findings | Status |
|------------|---------|--------|
| ST#1 | — | ✅ Clean |
| ST#2 | — | ✅ Clean |
| ST#3 | — | ✅ Clean |
| ST#4 | 2 RED, 3 ORANGE, 3 YELLOW | ✅ All resolved |
| ST#5 | 0 RED, 3 ORANGE, 4 YELLOW | ✅ All resolved |

**Current state: production-ready. 5 stress tests, 0 open findings.**
