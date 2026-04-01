# Deployment Architecture - Australian Auto Parts Platform
## NanoPi T6 Local Deployment Strategy

**Document Version**: 1.0  
**Date**: November 11, 2025  
**Target Environment**: FriendlyElec NanoPi T6 with M.2 NAS Board  
**Deployment Scope**: Small Production (5-10 users)  
**Status**: Architecture Design Complete

---

## Executive Summary

This document provides a comprehensive deployment architecture for running the Australian Auto Parts Sales Automation Platform on a FriendlyElec NanoPi T6 ARM-based single-board computer. The architecture is optimized for:

- **Constrained Resources**: RK3588 ARM processor with limited RAM/storage
- **Small Production Scale**: 5-10 concurrent users
- **Full Stack Deployment**: PostgreSQL + Redis + Node.js backend + React frontend
- **Cost-Effective**: No cloud hosting costs, single-device deployment
- **Production-Ready**: Proper security, backup, and monitoring strategies

**Key Considerations**:
- ARM architecture compatibility (arm64/aarch64)
- Resource optimization for limited hardware
- Local network deployment with optional external access
- Minimal infrastructure complexity

---

## Table of Contents

1. [Hardware Specifications](#1-hardware-specifications)
2. [System Architecture](#2-system-architecture)
3. [Software Stack](#3-software-stack)
4. [Deployment Strategy](#4-deployment-strategy)
5. [Network Architecture](#5-network-architecture)
6. [Security Implementation](#6-security-implementation)
7. [Database Strategy](#7-database-strategy)
8. [Backup & Recovery](#8-backup--recovery)
9. [Performance Optimization](#9-performance-optimization)
10. [Monitoring & Maintenance](#10-monitoring--maintenance)
11. [Scaling Considerations](#11-scaling-considerations)
12. [Cost Analysis](#12-cost-analysis)
13. [Implementation Roadmap](#13-implementation-roadmap)

---

## 1. Hardware Specifications

### 1.1 NanoPi T6 Specifications

**Processor**: Rockchip RK3588
- 4x Cortex-A76 @ 2.4 GHz (high performance)
- 4x Cortex-A55 @ 1.8 GHz (efficiency)
- 8-core ARM architecture (arm64/aarch64)

**Memory**: 
- Available configurations: 4GB, 8GB, or 16GB LPDDR4X
- Recommended: 8GB minimum for production deployment

**Storage**:
- M.2 NAS board with SATA interface
- Supports 2.5" SATA SSD/HDD
- Recommended: 256GB SSD minimum for production data + OS

**Network**:
- Dual Gigabit Ethernet (2.5GbE)
- Excellent for local network deployment

**Power**:
- 12V/2A DC power supply
- Low power consumption (~10-20W under load)

### 1.2 Recommended Hardware Configuration

| Component | Minimum | Recommended | Rationale |
|-----------|---------|-------------|-----------|
| **RAM** | 4GB | 8GB | PostgreSQL + Redis + Node.js need adequate memory |
| **Storage** | 128GB SSD | 256GB SSD | Database growth, logs, backups |
| **Network** | 1Gbps | 2.5Gbps | Better throughput for multiple users |
| **Cooling** | Passive heatsink | Active cooling | Sustained load requires temperature management |

### 1.3 Current Hardware Assessment

**Expected Performance**:
- **Concurrent Users**: 5-10 users comfortably
- **API Response Time**: <300ms (acceptable for local deployment)
- **Database Operations**: Adequate for <10,000 parts inventory
- **Limitations**: 
  - No Elasticsearch (too resource-intensive)
  - Limited concurrent connections
  - Single point of failure

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```mermaid
graph TB
    subgraph NanoPi-T6[NanoPi T6 Device]
        subgraph Docker[Docker Environment]
            Frontend[React Frontend Container<br/>Port 80/443]
            Backend[Node.js API Container<br/>Port 3000]
            Postgres[(PostgreSQL Container<br/>Port 5432)]
            Redis[(Redis Container<br/>Port 6379)]
            Nginx[Nginx Reverse Proxy<br/>Port 80/443]
        end
        
        subgraph Storage[M.2 NAS Storage]
            DBData[PostgreSQL Data<br/>/mnt/nas/postgres]
            Uploads[File Uploads<br/>/mnt/nas/uploads]
            Backups[Automated Backups<br/>/mnt/nas/backups]
            Logs[Application Logs<br/>/mnt/nas/logs]
        end
    end
    
    subgraph Network[Local Network]
        Users[5-10 Users<br/>Browsers/Mobile]
        Admin[Admin Workstation]
    end
    
    Users -->|HTTPS| Nginx
    Admin -->|SSH/HTTPS| Nginx
    Nginx -->|Proxy| Frontend
    Nginx -->|API Proxy| Backend
    Backend -->|Queries| Postgres
    Backend -->|Cache| Redis
    Postgres -.->|Persist| DBData
    Backend -.->|Store| Uploads
    
    style NanoPi-T6 fill:#e1f5ff
    style Docker fill:#fff3e0
    style Storage fill:#f3e5f5
    style Network fill:#e8f5e9
```

### 2.2 Container Architecture

**Docker Compose Stack**:
```yaml
services:
  nginx:           # Reverse proxy & SSL termination
  frontend:        # React production build
  backend:         # Node.js API server
  postgres:        # PostgreSQL database
  redis:           # Redis cache
  # Optional: portainer (container management UI)
```

### 2.3 Resource Allocation (8GB RAM)

| Service | Memory Limit | CPU Priority | Storage |
|---------|--------------|--------------|---------|
| **PostgreSQL** | 2GB | High | 50GB (data) |
| **Redis** | 512MB | Medium | 1GB (persistence) |
| **Node.js Backend** | 1GB | High | 5GB (logs) |
| **React Frontend** | 256MB | Low | 500MB (static) |
| **Nginx** | 128MB | High | 1GB (logs) |
| **System/OS** | 2GB | - | 20GB |
| **Available Buffer** | 2GB | - | 180GB |

---

## 3. Software Stack

### 3.1 Operating System

**Recommended**: Ubuntu Server 22.04 LTS ARM64
- **Rationale**: 
  - Official ARM support
  - 5-year LTS support
  - Excellent Docker compatibility
  - Large community support
  
**Alternative**: Armbian (Debian-based)
- Lighter weight if needed
- Good NanoPi T6 support

### 3.2 Container Runtime

**Docker Engine** (v24+)
- ARM64 official support
- Docker Compose for orchestration
- Lightweight compared to Kubernetes

**Why not Kubernetes?**
- Overkill for single-node deployment
- Higher resource overhead
- Unnecessary complexity

### 3.3 Database Configuration

**PostgreSQL 16 ARM64**
- Official ARM Docker images available
- Configuration tuning for 2GB memory allocation
- Connection pooling (max 20 connections)

**Redis 7 ARM64**
- Official ARM support
- Configured for 512MB max memory
- Persistence enabled (AOF + RDB)

### 3.4 Application Services

**Backend**: Node.js 18+ LTS
- ARM64 native support
- Production optimizations
- PM2 or native Docker restart policies

**Frontend**: React (static build)
- Served via Nginx
- Optimized production bundle
- Gzip compression enabled

### 3.5 Web Server

**Nginx** (reverse proxy + static serving)
- Efficient ARM performance
- SSL/TLS termination
- Rate limiting
- Static asset caching

---

## 4. Deployment Strategy

### 4.1 Docker Compose Deployment

**File Structure**:
```
/opt/auto-parts-platform/
├── docker-compose.yml           # Main orchestration file
├── docker-compose.prod.yml      # Production overrides
├── .env.production              # Environment variables
├── nginx/
│   ├── nginx.conf              # Main Nginx config
│   ├── ssl/                    # SSL certificates
│   └── conf.d/                 # Site configurations
├── backend/
│   ├── Dockerfile.arm64        # ARM-optimized backend image
│   └── dist/                   # Compiled TypeScript
├── frontend/
│   ├── Dockerfile.arm64        # ARM-optimized frontend image
│   └── build/                  # Production React build
└── volumes/                     # Docker volume mount points
    ├── postgres/               # PostgreSQL data
    ├── redis/                  # Redis data
    ├── uploads/                # User uploads
    └── backups/                # Automated backups
```

### 4.2 Optimized Docker Compose Configuration

**`docker-compose.prod.yml`** (ARM-optimized):
```yaml
version: '3.8'

services:
  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: autoparts-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/build:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 128m
    cpus: 0.5

  # React frontend (build stage only - served by Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.arm64
    container_name: autoparts-frontend
    volumes:
      - frontend-build:/app/build
    networks:
      - app-network
    mem_limit: 256m

  # Node.js backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.arm64
    container_name: autoparts-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://autoparts:${DB_PASSWORD}@postgres:5432/auto_parts_platform
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    volumes:
      - /mnt/nas/uploads:/app/uploads
      - /mnt/nas/logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 1g
    cpus: 2.0
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL database
  postgres:
    image: postgres:16-alpine
    container_name: autoparts-postgres
    environment:
      POSTGRES_USER: autoparts
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: auto_parts_platform
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - /mnt/nas/postgres:/var/lib/postgresql/data
      - ./backend/prisma:/docker-entrypoint-initdb.d
    ports:
      - "127.0.0.1:5432:5432"  # Only localhost access
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 2g
    cpus: 2.0
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U autoparts -d auto_parts_platform"]
      interval: 10s
      timeout: 5s
      retries: 5
    command:
      - "postgres"
      - "-c"
      - "shared_buffers=512MB"           # 25% of allocated memory
      - "-c"
      - "effective_cache_size=1536MB"    # 75% of allocated memory
      - "-c"
      - "maintenance_work_mem=128MB"
      - "-c"
      - "checkpoint_completion_target=0.9"
      - "-c"
      - "wal_buffers=16MB"
      - "-c"
      - "default_statistics_target=100"
      - "-c"
      - "random_page_cost=1.1"           # SSD optimization
      - "-c"
      - "effective_io_concurrency=200"
      - "-c"
      - "work_mem=10MB"
      - "-c"
      - "min_wal_size=1GB"
      - "-c"
      - "max_wal_size=4GB"
      - "-c"
      - "max_connections=50"             # Limited for small deployment

  # Redis cache
  redis:
    image: redis:7-alpine
    container_name: autoparts-redis
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru --save 900 1 --save 300 10 --appendonly yes
    volumes:
      - /mnt/nas/redis:/data
    ports:
      - "127.0.0.1:6379:6379"  # Only localhost access
    restart: unless-stopped
    networks:
      - app-network
    mem_limit: 512m
    cpus: 0.5
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  app-network:
    driver: bridge

volumes:
  frontend-build:
```

### 4.3 ARM-Optimized Dockerfiles

**Backend Dockerfile** (`backend/Dockerfile.arm64`):
```dockerfile
# Multi-stage build for ARM64
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (production only)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install runtime dependencies
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/server.js"]
```

**Frontend Dockerfile** (`frontend/Dockerfile.arm64`):
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Production stage (served by Nginx, so just export build)
FROM scratch
COPY --from=builder /app/build /build
```

### 4.4 Environment Configuration

**`.env.production`** (template):
```bash
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Database (PostgreSQL)
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_123
DATABASE_URL=postgresql://autoparts:${DB_PASSWORD}@postgres:5432/auto_parts_platform?schema=public

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# JWT (CRITICAL: Change these!)
JWT_SECRET=CHANGE_THIS_VERY_LONG_RANDOM_STRING_AT_LEAST_64_CHARACTERS
JWT_REFRESH_SECRET=CHANGE_THIS_DIFFERENT_VERY_LONG_RANDOM_STRING_64_CHARS
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d
JWT_ISSUER=aus-auto-parts-platform

# Rate Limiting
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_BASIC=1000
RATE_LIMIT_MAX_PRO=10000

# CORS
ALLOWED_ORIGINS=http://localhost,http://192.168.1.100,https://autoparts.local
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=/app/logs/app.log
LOG_ERROR_FILE_PATH=/app/logs/error.log

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=CHANGE_THIS_SESSION_SECRET_STRING

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads/

# Monitoring (optional)
SENTRY_DSN=
```

---

## 5. Network Architecture

### 5.1 Network Topology

```mermaid
graph LR
    subgraph Internet
        ExtUser[External Users<br/>Optional]
    end
    
    subgraph LocalNetwork[Local Network 192.168.1.0/24]
        Router[Router/Firewall<br/>192.168.1.1]
        
        subgraph Clients
            PC1[Workstation 1]
            PC2[Workstation 2]
            Mobile[Mobile Devices]
        end
        
        subgraph NanoPi[NanoPi T6<br/>192.168.1.100]
            Eth0[eth0: 192.168.1.100]
            Nginx2[Nginx<br/>:80/:443]
        end
    end
    
    ExtUser -.->|Port Forward<br/>80/443| Router
    Router -->|HTTPS| Eth0
    PC1 -->|HTTPS| Eth0
    PC2 -->|HTTPS| Eth0
    Mobile -->|HTTPS| Eth0
    Eth0 --> Nginx2
    
    style Internet fill:#ffebee
    style LocalNetwork fill:#e8f5e9
    style NanoPi fill:#e1f5ff
```

### 5.2 Network Configuration

**Static IP Assignment**:
```bash
# /etc/netplan/01-netcfg.yaml (Ubuntu)
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

### 5.3 DNS Configuration

**Option 1: Local DNS (Router/Pi-hole)**
- Configure `autoparts.local` → `192.168.1.100`
- Users access via https://autoparts.local

**Option 2: Hosts File (Simple)**
- Add to each client's `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
  ```
  192.168.1.100  autoparts.local
  ```

**Option 3: mDNS (Avahi)**
- Install Avahi on NanoPi: `autoparts.local` automatically resolves
- Works on local network without configuration

### 5.4 Firewall Configuration

**UFW (Uncomplicated Firewall)**:
```bash
# Enable firewall
sudo ufw enable

# Allow SSH (critical - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow from local network only (alternative)
sudo ufw allow from 192.168.1.0/24 to any port 80
sudo ufw allow from 192.168.1.0/24 to any port 443

# Deny external PostgreSQL/Redis access
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp

# Check status
sudo ufw status verbose
```

### 5.5 External Access (Optional)

**For External Users (Internet Access)**:

**Requirements**:
- Dynamic DNS service (DuckDNS, No-IP)
- Router port forwarding (80 → 192.168.1.100:80, 443 → 192.168.1.100:443)
- Valid SSL certificate (Let's Encrypt)

**Security Considerations**:
- ⚠️ Exposes NanoPi to internet attacks
- Requires strong passwords, rate limiting, fail2ban
- Regular security updates critical
- Consider VPN instead (WireGuard/Tailscale)

**Recommended: VPN Access**
- Deploy WireGuard/Tailscale on NanoPi
- Users VPN in, then access https://autoparts.local
- More secure than direct exposure

---

## 6. Security Implementation

### 6.1 SSL/TLS Configuration

**Option 1: Self-Signed Certificate (Local Only)**
```bash
# Generate self-signed cert (valid 1 year)
sudo mkdir -p /opt/auto-parts-platform/nginx/ssl
cd /opt/auto-parts-platform/nginx/ssl

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout autoparts.key \
  -out autoparts.crt \
  -subj "/C=AU/ST=NSW/L=Sydney/O=AutoParts/CN=autoparts.local"

# Set permissions
sudo chmod 600 autoparts.key
sudo chmod 644 autoparts.crt
```

**Option 2: Let's Encrypt (Public Domain)**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate (requires public domain + port 80 access)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

**Nginx SSL Configuration** (`nginx/conf.d/autoparts.conf`):
```nginx
server {
    listen 80;
    server_name autoparts.local;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name autoparts.local;
    
    # SSL certificates
    ssl_certificate /etc/nginx/ssl/autoparts.crt;
    ssl_certificate_key /etc/nginx/ssl/autoparts.key;
    
    # SSL configuration (modern, secure)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Logging
    access_log /var/log/nginx/autoparts_access.log;
    error_log /var/log/nginx/autoparts_error.log;
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Rate limiting (10 req/sec per IP)
        limit_req zone=api_limit burst=20 nodelay;
    }
    
    # Frontend static files
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health check endpoint (no auth required)
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

### 6.2 Authentication & Authorization

**Already Implemented** (in application code):
- JWT-based authentication
- Role-based access control (RBAC)
- Bcrypt password hashing (12 rounds)
- Refresh token rotation

**Additional Security Measures**:
- Enable rate limiting on login endpoints (see Nginx config)
- Implement account lockout after failed attempts
- Require strong passwords (enforce in application)

### 6.3 Database Security

**PostgreSQL Hardening**:
```sql
-- Restrict network access (only from Docker network)
-- Already configured in docker-compose (127.0.0.1 binding)

-- Create read-only user for reporting (optional)
CREATE USER autoparts_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE auto_parts_platform TO autoparts_readonly;
GRANT USAGE ON SCHEMA public TO autoparts_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO autoparts_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO autoparts_readonly;

-- Enforce SSL connections (if needed)
ALTER SYSTEM SET ssl = on;
```

### 6.4 Backup Encryption

**Encrypt Database Backups**:
```bash
#!/bin/bash
# backup-encrypt.sh

# GPG encryption for backups
gpg --symmetric --cipher-algo AES256 /mnt/nas/backups/backup-$(date +%Y%m%d).sql

# Remove unencrypted backup
rm /mnt/nas/backups/backup-$(date +%Y%m%d).sql
```

---

## 7. Database Strategy

### 7.1 PostgreSQL Configuration Tuning

**Configuration for 2GB Allocated Memory** (`postgresql.conf` via Docker command):

```conf
# Memory Settings
shared_buffers = 512MB                  # 25% of allocated memory
effective_cache_size = 1536MB           # 75% of allocated memory
maintenance_work_mem = 128MB            # For VACUUM, CREATE INDEX
work_mem = 10MB                         # Per query operation

# Checkpoint Settings (reduce I/O)
checkpoint_completion_target = 0.9
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB

# Query Planner
default_statistics_target = 100
random_page_cost = 1.1                  # SSD optimization
effective_io_concurrency = 200          # SSD optimization

# Connection Settings
max_connections = 50                    # Limited for small deployment
```

### 7.2 Connection Pooling

**Prisma Connection Pooling** (backend/src/config/database.ts):
```typescript
// Prisma automatically handles connection pooling
// Connection string with pool settings:
DATABASE_URL=postgresql://autoparts:password@postgres:5432/auto_parts_platform?schema=public&connection_limit=20&pool_timeout=20
```

### 7.3 Indexing Strategy

**Critical Indexes** (already in Prisma schema):
```sql
-- High-traffic queries
CREATE INDEX idx_parts_tenant_status ON parts(tenant_id, status);
CREATE INDEX idx_parts_category ON parts(part_category);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, payment_status, fulfillment_status);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_users_email ON users(email);

-- Full-text search (if not using Elasticsearch)
CREATE INDEX idx_parts_description_fts ON parts USING GIN(to_tsvector('english', description));
```

### 7.4 Database Maintenance

**Automated Maintenance Script** (`/opt/scripts/db-maintenance.sh`):
```bash
#!/bin/bash
# Daily database maintenance

docker exec autoparts-postgres psql -U autoparts -d auto_parts_platform -c "VACUUM ANALYZE;"
docker exec autoparts-postgres psql -U autoparts -d auto_parts_platform -c "REINDEX DATABASE auto_parts_platform;"

echo "Database maintenance completed at $(date)" >> /var/log/db-maintenance.log
```

**Cron Schedule**:
```cron
# Daily at 3 AM
0 3 * * * /opt/scripts/db-maintenance.sh
```

---

## 8. Backup & Recovery

### 8.1 Backup Strategy

**3-2-1 Backup Rule** (adapted for NanoPi):
- **3 Copies**: Production + Daily backup + Weekly archive
- **2 Media Types**: M.2 NAS + External USB drive
- **1 Offsite**: Manual offsite copy (USB drive stored elsewhere)

### 8.2 Automated Backup Script

**`/opt/scripts/backup-database.sh`**:
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/mnt/nas/backups"
EXTERNAL_BACKUP="/mnt/usb/autoparts-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Starting database backup at $(date)"
docker exec autoparts-postgres pg_dump -U autoparts auto_parts_platform | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Backup uploads directory
echo "Backing up uploads"
tar -czf "$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz" /mnt/nas/uploads/

# Backup configuration files
echo "Backing up configuration"
tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" \
    /opt/auto-parts-platform/.env.production \
    /opt/auto-parts-platform/docker-compose.yml \
    /opt/auto-parts-platform/nginx/

# Copy to external drive (if mounted)
if [ -d "$EXTERNAL_BACKUP" ]; then
    echo "Copying to external drive"
    cp "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz" "$EXTERNAL_BACKUP/"
    cp "$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz" "$EXTERNAL_BACKUP/"
fi

# Remove old backups (older than retention period)
echo "Cleaning old backups"
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete

# Log completion
echo "Backup completed at $(date)" >> /var/log/backup.log

# Send notification (optional - requires mail setup)
# echo "Backup completed successfully" | mail -s "AutoParts Backup Success" admin@example.com
```

**Cron Schedule**:
```cron
# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup-database.sh

# Weekly full backup (Sundays at 1 AM)
0 1 * * 0 /opt/scripts/backup-full.sh
```

### 8.3 Restore Procedure

**Database Restore**:
```bash
# Stop backend to prevent writes
docker stop autoparts-backend

# Restore database
gunzip < /mnt/nas/backups/db_backup_20251111_020000.sql.gz | \
    docker exec -i autoparts-postgres psql -U autoparts auto_parts_platform

# Restore uploads
tar -xzf /mnt/nas/backups/uploads_backup_20251111_020000.tar.gz -C /

# Start backend
docker start autoparts-backend

# Verify application
curl https://autoparts.local/api/v1/health
```

### 8.4 Disaster Recovery Plan

**Recovery Time Objective (RTO)**: 4 hours  
**Recovery Point Objective (RPO)**: 24 hours (daily backups)

**Disaster Scenarios**:

1. **NanoPi Hardware Failure**:
   - Replace NanoPi T6
   - Restore OS from image
   - Restore Docker containers
   - Restore database from latest backup
   - **Estimated Time**: 3-4 hours

2. **M.2 SSD Failure**:
   - Replace SSD
   - Restore from external USB backup
   - **Estimated Time**: 2-3 hours

3. **Data Corruption**:
   - Restore from point-in-time backup
   - **Estimated Time**: 30 minutes

4. **Complete Site Loss** (fire, theft):
   - Purchase new hardware
   - Restore from offsite USB backup
   - **Estimated Time**: 1-2 days (hardware procurement)

---

## 9. Performance Optimization

### 9.1 Application-Level Optimizations

**Backend Optimizations**:
```typescript
// backend/src/server.ts

import compression from 'compression';
import helmet from 'helmet';

// Gzip compression
app.use(compression({
  level: 6,  // Balanced compression (1-9, higher = more CPU)
  threshold: 1024  // Only compress responses > 1KB
}));

// Security headers
app.use(helmet());

// Static file caching
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  immutable: true
}));
```

**Database Query Optimization**:
```typescript
// Use select to limit returned fields
const parts = await prisma.part.findMany({
  where: { tenant_id: tenantId, status: 'available' },
  select: {
    id: true,
    part_number: true,
    name: true,
    sell_price: true,
    // Don't fetch large fields like description, photos
  },
  take: 20,  // Pagination
  skip: offset
});

// Use indexes for common queries
// Already defined in Prisma schema
```

### 9.2 Caching Strategy

**Redis Caching Layer**:
```typescript
// backend/src/services/parts.service.ts

async getPartById(partId: string): Promise<Part> {
  // Check cache first
  const cacheKey = `part:${partId}`;
  const cached = await getCache(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const part = await prisma.part.findUnique({ where: { id: partId } });
  
  // Cache for 1 hour
  if (part) {
    await setCache(cacheKey, JSON.stringify(part), 3600);
  }
  
  return part;
}
```

**Cache Invalidation**:
- Invalidate on update/delete operations
- Use cache tags for bulk invalidation
- TTL: 1 hour for read-heavy data, 5 minutes for volatile data

### 9.3 Frontend Optimizations

**React Production Build**:
```bash
# Enable production optimizations
GENERATE_SOURCEMAP=false npm run build

# Result: Minified, tree-shaken, code-split bundles
```

**Nginx Static Caching**:
```nginx
# Cache static assets aggressively
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 9.4 Resource Monitoring

**Container Resource Limits** (docker-compose.yml):
```yaml
services:
  backend:
    mem_limit: 1g
    cpus: 2.0
    mem_reservation: 512m  # Soft limit
```

**Monitoring Commands**:
```bash
# Real-time container stats
docker stats

# Check memory usage
free -h

# Check disk usage
df -h /mnt/nas

# PostgreSQL connection count
docker exec autoparts-postgres psql -U autoparts -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 10. Monitoring & Maintenance

### 10.1 Health Monitoring

**Application Health Checks** (already implemented):
```bash
# API health check
curl https://autoparts.local/api/v1/health

# Database health
docker exec autoparts-postgres pg_isready

# Redis health
docker exec autoparts-redis redis-cli ping
```

**Automated Health Monitoring Script** (`/opt/scripts/health-check.sh`):
```bash
#!/bin/bash

# Check all services
SERVICES=("autoparts-nginx" "autoparts-backend" "autoparts-postgres" "autoparts-redis")
FAILED=()

for service in "${SERVICES[@]}"; do
    if ! docker ps --filter "name=$service" --filter "status=running" | grep -q "$service"; then
        FAILED+=("$service")
    fi
done

if [ ${#FAILED[@]} -eq 0 ]; then
    echo "All services healthy at $(date)"
else
    echo "ALERT: Failed services: ${FAILED[*]}" >> /var/log/health-alerts.log
    # Send notification (requires mail/SMS setup)
    # echo "Services down: ${FAILED[*]}" | mail -s "AutoParts Alert" admin@example.com
fi
```

**Cron Schedule**:
```cron
# Health check every 5 minutes
*/5 * * * * /opt/scripts/health-check.sh
```

### 10.2 Log Management

**Centralized Logging** (volumes configured in docker-compose):
```bash
# Application logs
/mnt/nas/logs/app.log
/mnt/nas/logs/error.log

# Nginx logs
/var/log/nginx/autoparts_access.log
/var/log/nginx/autoparts_error.log

# Container logs
docker logs autoparts-backend
docker logs autoparts-postgres
```

**Log Rotation** (`/etc/logrotate.d/autoparts`):
```
/mnt/nas/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker kill -s USR1 autoparts-nginx
    endscript
}
```

### 10.3 Performance Monitoring

**Simple Monitoring Dashboard** (Portainer - optional):
```bash
# Deploy Portainer for web-based container management
docker run -d -p 9000:9000 -p 9443:9443 \
    --name=portainer --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:latest

# Access at https://autoparts.local:9443
```

**Metrics to Track**:
- CPU usage per container
- Memory usage per container
- Disk space remaining
- Database connection count
- API response times (via Nginx logs)
- Cache hit ratio (Redis INFO command)

### 10.4 Maintenance Schedule

| Task | Frequency | Script/Command |
|------|-----------|----------------|
| **Database Backup** | Daily 2 AM | `/opt/scripts/backup-database.sh` |
| **Database Vacuum** | Daily 3 AM | `/opt/scripts/db-maintenance.sh` |
| **Log Rotation** | Daily | `/etc/logrotate.d/autoparts` |
| **Health Check** | Every 5 min | `/opt/scripts/health-check.sh` |
| **Docker Cleanup** | Weekly | `docker system prune -f` |
| **Security Updates** | Weekly | `apt update && apt upgrade -y` |
| **External Backup** | Weekly Sun 1 AM | `/opt/scripts/backup-full.sh` |
| **SSL Renewal** | Auto (Let's Encrypt) | `certbot renew` |

---

## 11. Scaling Considerations

### 11.1 Current Limitations

**NanoPi T6 Constraints**:
- **Max Concurrent Users**: 10-15 (comfortable)
- **Max Parts Inventory**: ~20,000 parts (before search performance degrades)
- **Max Database Size**: ~100GB (limited by SSD capacity)
- **Single Point of Failure**: No redundancy

### 11.2 Vertical Scaling (Same Hardware)

**Optimization Opportunities**:
1. **Upgrade SSD**: 256GB → 512GB or 1TB
2. **Add RAM**: 8GB → 16GB (if board supports)
3. **Optimize Queries**: Add missing indexes, query tuning
4. **Enable Redis Persistence**: Reduce database load
5. **Implement API Caching**: Cache expensive queries

**Expected Improvement**: 15-20 users, 40,000 parts

### 11.3 Horizontal Scaling (Migration Path)

**When to Migrate to Cloud/Multiple Servers**:
- **20+ concurrent users**
- **100,000+ parts inventory**
- **Geographic distribution of users** (high latency)
- **Compliance requirements** (data redundancy, disaster recovery)

**Migration Path to AWS** (from docs/ARCHITECTURE.md):
```
NanoPi T6 (Local) → AWS Multi-AZ Deployment
- ECS Fargate (backend containers)
- RDS PostgreSQL Multi-AZ (database)
- ElastiCache Redis (cache)
- S3 + CloudFront (file storage)
- Application Load Balancer (high availability)

Estimated Cost: $200-400/month for 50+ users
```

### 11.4 Hybrid Approach (Future)

**Option: Local + Cloud Hybrid**:
- **Primary**: NanoPi T6 (local, low latency)
- **Backup**: AWS Standby (automatic failover)
- **CDN**: CloudFront for static assets (global distribution)

---

## 12. Cost Analysis

### 12.1 Initial Setup Costs

| Item | Cost (AUD) | Notes |
|------|------------|-------|
| **NanoPi T6 (8GB)** | $200 | Already owned |
| **M.2 NAS Board** | $50 | Already owned |
| **256GB SSD** | $80 | Recommended |
| **Cooling Fan** | $15 | Optional but recommended |
| **External USB Drive (1TB)** | $80 | For backups |
| **UPS (500VA)** | $150 | Recommended for production |
| **Ethernet Cable (Cat6)** | $20 | High-quality cable |
| **Total Initial** | **$595** | (or $345 without hardware you own) |

### 12.2 Ongoing Operational Costs

| Item | Cost/Month (AUD) | Cost/Year (AUD) |
|------|------------------|-----------------|
| **Electricity** (~20W 24/7) | $5 | $60 |
| **Internet** (existing) | $0 | $0 |
| **Domain Name** (optional) | $1.50 | $18 |
| **SSL Certificate** (Let's Encrypt) | $0 | $0 |
| **External Backup Storage** | $0 | $0 |
| **Maintenance Time** (1hr/week) | $0 | $0 |
| **Total Monthly** | **$6.50** | **$78** |

### 12.3 Cost Comparison: Local vs Cloud

**Local (NanoPi T6)**:
- Initial: $345 (hardware not owned)
- Operational: $78/year
- **Total Year 1**: $423
- **Total Year 2**: $78
- **Total Year 3**: $78
- **3-Year Total**: $579

**AWS Cloud** (from docs/ARCHITECTURE.md):
- Initial: $0 (infrastructure costs)
- Operational: ~$200/month
- **Total Year 1**: $2,400
- **Total Year 2**: $2,400
- **Total Year 3**: $2,400
- **3-Year Total**: $7,200

**Savings with Local Deployment**: $6,621 over 3 years

### 12.4 Hidden Costs & Considerations

**Local Deployment Risks**:
- **Downtime Risk**: Single point of failure (no redundancy)
- **Maintenance Time**: Self-managed (1-2 hours/week)
- **Limited Scalability**: Max 10-15 users
- **Internet Outage**: Local network only during outages
- **Hardware Failure**: Need spare parts or backup hardware

**Cloud Deployment Benefits**:
- **High Availability**: 99.9% uptime SLA
- **Managed Services**: Auto-backups, auto-scaling, managed security
- **Global Distribution**: Low latency worldwide
- **Enterprise Support**: 24/7 technical support
- **Compliance**: Built-in compliance certifications

**Recommendation**: Start with local deployment for 5-10 users, migrate to cloud when approaching 15+ users or requiring high availability.

---

## 13. Implementation Roadmap

### 13.1 Phase 1: Infrastructure Setup (Week 1)

**Day 1-2: Hardware Preparation**
- [ ] Install Ubuntu Server 22.04 ARM64 on NanoPi T6
- [ ] Configure M.2 NAS board, format SSD as ext4
- [ ] Mount SSD: `/mnt/nas`
- [ ] Configure static IP: 192.168.1.100
- [ ] Install Docker Engine + Docker Compose
- [ ] Install system monitoring tools (htop, iotop, nethogs)

**Commands**:
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Mount NAS drive
sudo mkdir -p /mnt/nas
echo "/dev/sda1 /mnt/nas ext4 defaults 0 2" | sudo tee -a /etc/fstab
sudo mount -a

# Create directory structure
sudo mkdir -p /opt/auto-parts-platform/{nginx/ssl,nginx/conf.d,backend,frontend}
sudo mkdir -p /mnt/nas/{postgres,redis,uploads,backups,logs}
sudo chown -R $USER:$USER /opt/auto-parts-platform /mnt/nas
```

**Day 3-4: Security Hardening**
- [ ] Configure UFW firewall
- [ ] Generate SSL certificates (self-signed for local)
- [ ] Set up fail2ban for SSH protection
- [ ] Create secure `.env.production` with strong passwords
- [ ] Configure SSH key-only authentication

**Commands**:
```bash
# Firewall setup
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status

# SSL certificate
cd /opt/auto-parts-platform/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout autoparts.key -out autoparts.crt \
  -subj "/C=AU/ST=NSW/O=AutoParts/CN=autoparts.local"

# Fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

**Day 5: Backup Infrastructure**
- [ ] Set up external USB drive for backups
- [ ] Create backup scripts
- [ ] Configure cron jobs
- [ ] Test backup and restore procedure

### 13.2 Phase 2: Application Deployment (Week 2)

**Day 1-2: Build Docker Images**
- [ ] Clone application repository
- [ ] Build ARM64-optimized Docker images
- [ ] Test image builds locally
- [ ] Push images to registry (or use local)

**Commands**:
```bash
cd /opt/auto-parts-platform

# Clone repository (adjust path)
git clone https://github.com/yourorg/aus-auto-parts-platform.git .

# Build backend
cd backend
docker build -f Dockerfile.arm64 -t autoparts-backend:latest .

# Build frontend
cd ../frontend
docker build -f Dockerfile.arm64 -t autoparts-frontend:latest .

# Test images
docker images
```

**Day 3-4: Database Setup**
- [ ] Deploy PostgreSQL container
- [ ] Run Prisma migrations
- [ ] Seed initial data (demo tenant)
- [ ] Test database connectivity
- [ ] Configure database backups

**Commands**:
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
docker exec autoparts-backend npx prisma migrate deploy

# Seed database
docker exec autoparts-backend npx prisma db seed

# Test connection
docker exec autoparts-postgres psql -U autoparts -d auto_parts_platform -c "SELECT version();"
```

**Day 5: Full Stack Deployment**
- [ ] Deploy all services (docker-compose up)
- [ ] Configure Nginx reverse proxy
- [ ] Test API endpoints
- [ ] Test frontend access
- [ ] Verify SSL/HTTPS

**Commands**:
```bash
# Deploy all services
cd /opt/auto-parts-platform
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check all containers running
docker ps

# Test health
curl https://autoparts.local/api/v1/health

# Check logs
docker logs autoparts-backend
docker logs autoparts-nginx
```

### 13.3 Phase 3: Testing & Validation (Week 3)

**Day 1-2: Functional Testing**
- [ ] Test user registration and login
- [ ] Test vehicle/parts management
- [ ] Test order creation workflow
- [ ] Test customer portal access
- [ ] Verify email notifications (if configured)

**Day 3-4: Performance Testing**
- [ ] Load test with 10 concurrent users (Apache JMeter)
- [ ] Monitor resource usage (CPU, RAM, disk I/O)
- [ ] Identify bottlenecks
- [ ] Optimize slow queries

**Day 5: Security Testing**
- [ ] Verify SSL certificate
- [ ] Test authentication/authorization
- [ ] Scan for vulnerabilities (OWASP ZAP)
- [ ] Review firewall rules
- [ ] Test backup restoration

### 13.4 Phase 4: Production Rollout (Week 4)

**Day 1-2: User Onboarding**
- [ ] Create user accounts (5-10 initial users)
- [ ] Provide training documentation
- [ ] Set up local DNS or hosts file entries
- [ ] Distribute access credentials

**Day 3-4: Monitoring Setup**
- [ ] Configure health check scripts
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Deploy Portainer (optional monitoring)
- [ ] Test alerting (if configured)

**Day 5: Go-Live**
- [ ] Final backup before production use
- [ ] Enable production mode
- [ ] Monitor first 24 hours closely
- [ ] Document any issues
- [ ] Celebrate successful deployment! 🎉

### 13.5 Post-Deployment Checklist

**Week 5+: Ongoing Maintenance**
- [ ] Weekly: Review logs for errors
- [ ] Weekly: Check disk space usage
- [ ] Weekly: Verify backups are running
- [ ] Monthly: Test disaster recovery procedure
- [ ] Monthly: Review security updates
- [ ] Quarterly: Performance review and optimization

---

## Deployment Architecture Summary

### Recommended Cloud Provider
**For Local Deployment**: N/A - Running on FriendlyElec NanoPi T6

### Key Infrastructure Components

**Compute**:
- NanoPi T6 (RK3588, 8GB RAM) running Ubuntu Server 22.04 ARM64
- Docker Engine with Docker Compose orchestration
- Nginx reverse proxy with SSL termination

**Database**:
- PostgreSQL 16 (2GB allocated, ARM64 container)
- Redis 7 (512MB allocated, ARM64 container)
- Persistent storage on M.2 SATA SSD

**Storage**:
- M.2 NAS board with 256GB+ SSD
- Mounted at `/mnt/nas` for data persistence
- External USB drive for backups

**Network**:
- Local network deployment (192.168.1.0/24)
- Static IP: 192.168.1.100
- Self-signed SSL certificate for HTTPS
- Optional: Dynamic DNS + port forwarding for external access

### Security Best Practices

1. **SSL/TLS**: Self-signed certificate (or Let's Encrypt for public domain)
2. **Firewall**: UFW configured to allow only 22/80/443
3. **Authentication**: JWT-based with bcrypt password hashing
4. **Database Security**: PostgreSQL accessible only from Docker network
5. **Backups**: Daily encrypted backups to NAS + external USB drive
6. **Updates**: Weekly security update schedule

### Scaling & High Availability

**Current Capacity**: 5-10 users, 20,000 parts
**Scaling Path**: Vertical (add RAM/storage) → Horizontal (migrate to AWS)
**High Availability**: Single point of failure (acceptable for 5-10 users)
**Disaster Recovery**: 4-hour RTO, 24-hour RPO

### Cost Estimation

**Initial Setup**: $345 AUD (if purchasing missing hardware)
**Monthly Operating Cost**: $6.50 AUD ($78/year)
**3-Year Total Cost**: $579 AUD

**Comparison to Cloud**: Saves $6,621 over 3 years vs AWS deployment

### Implementation Timeline

- **Week 1**: Infrastructure setup and security hardening
- **Week 2**: Application deployment and database setup
- **Week 3**: Testing and validation
- **Week 4**: Production rollout and user onboarding

**Total Time to Production**: 4 weeks

---

## Conclusion

This deployment architecture provides a **cost-effective, production-ready solution** for running the Australian Auto Parts Platform on a FriendlyElec NanoPi T6. The design balances:

✅ **Affordability**: $6,600 savings over 3 years vs cloud  
✅ **Performance**: Adequate for 5-10 users with room to grow  
✅ **Security**: Industry-standard practices (SSL, firewall, encrypted backups)  
✅ **Reliability**: Daily backups, disaster recovery plan, monitoring  
✅ **Maintainability**: Automated scripts, Docker orchestration, clear documentation  

**Migration Path**: When user count exceeds 15 or high availability is required, follow the AWS migration strategy outlined in docs/ARCHITECTURE.md.

**Next Steps**: Proceed with Phase 1 implementation (Infrastructure Setup) as detailed in Section 13.

---

**Document Status**: Ready for Implementation  
**Prepared By**: Technical Architecture Team  
**Review Date**: November 11, 2025  
**Next Review**: After Phase 2 deployment completion