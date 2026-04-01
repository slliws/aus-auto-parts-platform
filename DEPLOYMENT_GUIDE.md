# AUS Auto Parts Platform - Deployment Guide

This guide provides comprehensive instructions for deploying the AUS Auto Parts Platform to a remote Linux server from a Windows development machine.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Deployment Steps](#detailed-deployment-steps)
4. [Accessing the Application](#accessing-the-application)
5. [Manual Deployment](#manual-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Management Commands](#management-commands)
8. [Security Considerations](#security-considerations)

---

## Prerequisites

### On Windows Development Machine

- **PowerShell 5.0+** (included with Windows 10/11)
- **SSH Client** (Windows 10+ has OpenSSH built-in)
  - Alternative: PuTTY suite (plink, pscp) - [Download here](https://www.putty.org/)
- **Google Chrome** (optional, for automatic browser opening)
- **Network Access** to the server (192.168.1.110)

### On Linux Server (192.168.1.110)

- **Operating System**: Debian 11+ or Ubuntu 20.04+
- **Root/Sudo Access**: Required for Docker installation
- **Available Ports**: 
  - `3000` - Backend API
  - `8080` - Frontend GUI
  - `22` - SSH (default)
- **Minimum Resources**:
  - 2GB RAM
  - 20GB free disk space
  - 2 CPU cores

---

## Quick Start

### Automated Deployment (Recommended)

From your Windows PowerShell terminal in the project directory:

```powershell
# Navigate to project directory
cd "c:\Users\shayn\VS Projects\aus-auto-parts-platform"

# Run deployment script (will prompt for password)
.\deploy-from-windows.ps1

# Or provide password as parameter
.\deploy-from-windows.ps1 -Password (ConvertTo-SecureString "19833ke704agE!" -AsPlainText -Force)
```

The script will:
1. ✓ Verify prerequisites
2. ✓ Test server connection
3. ✓ Copy project files to server
4. ✓ Install Docker and Docker Compose (if needed)
5. ✓ Build Docker containers
6. ✓ Start all services
7. ✓ Open both GUIs in Chrome

**Total time: 5-10 minutes** (depending on network speed and server performance)

---

## Detailed Deployment Steps

### Step 1: Prepare Your Windows Machine

Ensure you have SSH access:

```powershell
# Test SSH availability
ssh -V

# If not found, enable OpenSSH (Windows 10+)
# Settings > Apps > Optional Features > Add OpenSSH Client
```

### Step 2: Verify Network Connectivity

```powershell
# Test server reachability
Test-Connection -ComputerName 192.168.1.110 -Count 4

# Test SSH connection
ssh root@192.168.1.110
# Enter password: 19833ke704agE!
# Type 'exit' to close connection
```

### Step 3: Run Deployment Script

```powershell
# Basic usage (prompts for password)
.\deploy-from-windows.ps1

# With custom parameters
.\deploy-from-windows.ps1 `
    -ServerIP "192.168.1.110" `
    -Username "root" `
    -Password (ConvertTo-SecureString "19833ke704agE!" -AsPlainText -Force) `
    -BackendPort 3000 `
    -FrontendPort 8080 `
    -SkipBrowserOpen  # Optional: don't auto-open browser
```

### Step 4: Monitor Deployment

Watch the console output for progress:

```
================================================================
Checking Prerequisites
================================================================
✓ PowerShell version: 5.1.22621.4249
✓ Project directory found: C:\Users\shayn\VS Projects\aus-auto-parts-platform
✓ All required files present
✓ Using native SSH client
✓ Using native SCP client

================================================================
Testing Server Connection
================================================================
✓ Server is reachable via ping
✓ SSH connection successful

================================================================
Copying Project Files to Server
================================================================
✓ Remote directory created
ℹ Copying files to server (this may take a few minutes)...
✓ Copied: docker-compose.prod.yml
✓ Copied: deploy-to-server.sh
✓ Copied: backend
✓ Copied: frontend
✓ All files copied successfully

[... Docker build output ...]

================================================================
Deployment Complete!
================================================================
```

---

## Accessing the Application

Once deployment completes, access the application at:

### Frontend GUI
```
http://192.168.1.110:8080
```

**Default Login Credentials:**
- **Username**: `admin@example.com`
- **Password**: `admin123`

### Backend API
```
http://192.168.1.110:3000
```

**Health Check Endpoint:**
```
http://192.168.1.110:3000/api/v1/health
```

**API Documentation:**
```
http://192.168.1.110:3000/api/v1/docs
```

### Browser Auto-Launch

If Chrome is installed, both URLs will open automatically. If not, open them manually in your preferred browser.

---

## Manual Deployment

If automated deployment fails or you prefer manual control:

### Option 1: Manual PowerShell Steps

```powershell
# 1. Copy files to server
scp -r docker-compose.prod.yml backend frontend deploy-to-server.sh root@192.168.1.110:/opt/aus-auto-parts-platform/

# 2. SSH into server
ssh root@192.168.1.110

# 3. Run deployment script on server
cd /opt/aus-auto-parts-platform
chmod +x deploy-to-server.sh
sudo ./deploy-to-server.sh
```

### Option 2: Completely Manual Setup

**On the server via SSH:**

```bash
# 1. Install Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 2. Navigate to project directory
cd /opt/aus-auto-parts-platform

# 3. Create environment file
cat > .env <<EOF
BACKEND_PORT=3000
FRONTEND_PORT=8080
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=auto_parts_platform
VITE_API_URL=http://192.168.1.110:3000/api/v1
EOF

# 4. Build and start containers
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 5. Check status
docker compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. SSH Connection Refused

**Problem**: `ssh: connect to host 192.168.1.110 port 22: Connection refused`

**Solutions**:
- Verify server IP address is correct
- Ensure SSH service is running on server: `sudo systemctl start ssh`
- Check firewall rules: `sudo ufw allow 22`
- Verify server is powered on and network is accessible

#### 2. Password Authentication Failed

**Problem**: `Permission denied (publickey,password)`

**Solutions**:
- Verify password is correct: `19833ke704agE!`
- Check if password authentication is enabled on server:
  ```bash
  sudo nano /etc/ssh/sshd_config
  # Ensure: PasswordAuthentication yes
  sudo systemctl restart ssh
  ```

#### 3. Docker Installation Fails

**Problem**: Docker installation errors on server

**Solutions**:
- Check server OS version: `lsb_release -a`
- Ensure sufficient disk space: `df -h`
- Try manual Docker installation (see Manual Deployment)
- Check internet connectivity from server: `ping google.com`

#### 4. Container Build Fails

**Problem**: Docker build errors during deployment

**Solutions**:
```bash
# SSH into server
ssh root@192.168.1.110

# Check Docker daemon
sudo systemctl status docker

# View detailed build logs
cd /opt/aus-auto-parts-platform
docker compose -f docker-compose.prod.yml build --progress=plain

# Check for port conflicts
sudo netstat -tulpn | grep -E ':(3000|8080|5432|6379)'
```

#### 5. Services Not Starting

**Problem**: Containers exit immediately or fail health checks

**Solutions**:
```bash
# View container logs
docker logs aus-auto-parts-backend
docker logs aus-auto-parts-frontend
docker logs aus-auto-parts-postgres
docker logs aus-auto-parts-redis

# Check container status
docker ps -a

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

#### 6. Cannot Access Frontend/Backend

**Problem**: URLs not accessible from browser

**Solutions**:
- Verify containers are running:
  ```bash
  docker ps
  ```
- Check server firewall:
  ```bash
  sudo ufw status
  sudo ufw allow 3000
  sudo ufw allow 8080
  ```
- Test from server itself:
  ```bash
  curl http://localhost:3000/api/v1/health
  curl http://localhost:8080
  ```
- Verify network connectivity:
  ```powershell
  Test-NetConnection -ComputerName 192.168.1.110 -Port 8080
  Test-NetConnection -ComputerName 192.168.1.110 -Port 3000
  ```

#### 7. Database Connection Errors

**Problem**: Backend cannot connect to PostgreSQL

**Solutions**:
```bash
# Check PostgreSQL container
docker exec aus-auto-parts-postgres pg_isready -U postgres

# View PostgreSQL logs
docker logs aus-auto-parts-postgres

# Connect to database manually
docker exec -it aus-auto-parts-postgres psql -U postgres -d auto_parts_platform

# Recreate database
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

#### 8. Redis Connection Errors

**Problem**: Backend cannot connect to Redis

**Solutions**:
```bash
# Check Redis container
docker exec aus-auto-parts-redis redis-cli ping

# View Redis logs
docker logs aus-auto-parts-redis

# Test Redis connection
docker exec -it aus-auto-parts-redis redis-cli
```

---

## Management Commands

### Via SSH (on the server)

```bash
# SSH into server
ssh root@192.168.1.110
cd /opt/aus-auto-parts-platform

# View all containers
docker compose -f docker-compose.prod.yml ps

# View logs (follow mode)
docker logs -f aus-auto-parts-backend
docker logs -f aus-auto-parts-frontend

# View logs (last 100 lines)
docker logs --tail 100 aus-auto-parts-backend

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Remove all containers and volumes (DESTRUCTIVE!)
docker compose -f docker-compose.prod.yml down -v

# View resource usage
docker stats
```

### Database Management

```bash
# Access PostgreSQL CLI
docker exec -it aus-auto-parts-postgres psql -U postgres -d auto_parts_platform

# Backup database
docker exec aus-auto-parts-postgres pg_dump -U postgres auto_parts_platform > backup.sql

# Restore database
cat backup.sql | docker exec -i aus-auto-parts-postgres psql -U postgres -d auto_parts_platform

# View database size
docker exec aus-auto-parts-postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('auto_parts_platform'));"
```

### Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a
```

---

## Security Considerations

### Production Deployment Checklist

- [ ] **Change default passwords** in `backend/.env`:
  ```bash
  JWT_SECRET=<generate-new-secret>
  JWT_REFRESH_SECRET=<generate-new-secret>
  SESSION_SECRET=<generate-new-secret>
  POSTGRES_PASSWORD=<strong-password>
  ```

- [ ] **Configure firewall**:
  ```bash
  sudo ufw enable
  sudo ufw allow 22      # SSH
  sudo ufw allow 80      # HTTP (if using reverse proxy)
  sudo ufw allow 443     # HTTPS (if using reverse proxy)
  sudo ufw allow 3000    # Backend (only if direct access needed)
  sudo ufw allow 8080    # Frontend (only if direct access needed)
  ```

- [ ] **Setup SSL/TLS** using Nginx reverse proxy or Caddy

- [ ] **Enable automated backups**:
  ```bash
  # Add to crontab
  0 2 * * * docker exec aus-auto-parts-postgres pg_dump -U postgres auto_parts_platform > /backups/db_$(date +\%Y\%m\%d).sql
  ```

- [ ] **Configure log rotation**

- [ ] **Setup monitoring** (e.g., Prometheus, Grafana)

- [ ] **Restrict SSH access** (disable root login, use SSH keys)

- [ ] **Update CORS origins** in backend `.env` to production domains only

---

## Re-deployment / Updates

To deploy updates after making changes:

```powershell
# From Windows
.\deploy-from-windows.ps1
```

This will:
1. Stop existing containers
2. Copy updated files
3. Rebuild containers with changes
4. Restart services

**Note**: Database data is preserved in Docker volumes.

---

## Complete Uninstall

To completely remove the deployment:

```bash
# SSH into server
ssh root@192.168.1.110

# Remove all containers and volumes
cd /opt/aus-auto-parts-platform
docker compose -f docker-compose.prod.yml down -v

# Remove project files
cd /
sudo rm -rf /opt/aus-auto-parts-platform

# Optional: Uninstall Docker
sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review container logs: `docker logs [container-name]`
3. Check Docker Compose status: `docker compose ps`
4. Review the project documentation in other `.md` files

---

## Summary

**Deployment Time**: 5-10 minutes (automated)

**Access URLs**:
- Frontend: `http://192.168.1.110:8080`
- Backend: `http://192.168.1.110:3000`

**Key Files**:
- [`deploy-from-windows.ps1`](deploy-from-windows.ps1:1) - Windows deployment script
- [`deploy-to-server.sh`](deploy-to-server.sh:1) - Server-side deployment script
- [`docker-compose.prod.yml`](docker-compose.prod.yml:1) - Docker Compose configuration

**Default Credentials**:
- Email: `admin@example.com`
- Password: `admin123`

---

*Last Updated: 2025-11-14*