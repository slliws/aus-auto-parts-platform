# Quick Start Guide - Database Setup

## Current Situation

You have Docker installed but Docker Desktop needs to be running to use it. This is the fastest way to get PostgreSQL running for development.

## Option 1: Use Docker (Fastest - Recommended)

### Step 1: Start Docker Desktop

1. **Open Docker Desktop**
   - Search for "Docker Desktop" in Windows Start Menu
   - Click to launch it
   - Wait for Docker Desktop to fully start (Docker icon in system tray will stop animating)
   - This usually takes 30-60 seconds

2. **Verify Docker is Running**
   ```powershell
   docker info
   # Should show server information without errors
   ```

### Step 2: Start PostgreSQL and Redis

Once Docker Desktop is running:

```powershell
cd backend
docker-compose up -d
```

This will:
- Download PostgreSQL 16 and Redis 7 images (first time only)
- Start both services in the background
- Create a database named `auto_parts_platform`
- Expose PostgreSQL on port 5432
- Expose Redis on port 6379

### Step 3: Verify Services are Running

```powershell
# Check containers are running
docker ps

# You should see:
# - auto-parts-postgres
# - auto-parts-redis
```

### Step 4: Run Database Migrations

```powershell
cd backend
npm run db:migrate
```

### Step 5: Seed Database with Demo Data

```powershell
npm run db:seed
```

### Done! ✅

Your database is now set up with:
- 1 demo tenant
- 2 users (admin and sales)
- 3 customers
- 5 vehicles
- 12 parts
- 1 supplier

**Login Credentials:**
- Admin: `admin@demoautoparts.com.au` / `password123`
- Sales: `sales@demoautoparts.com.au` / `password123`

---

## Option 2: Install PostgreSQL Directly on Windows

If you prefer not to use Docker, follow the detailed guide:

📄 See: `DATABASE_SETUP_WINDOWS.md`

This involves:
1. Downloading PostgreSQL installer
2. Running installer
3. Configuring PostgreSQL service
4. Creating database manually

**Time:** ~15-20 minutes

---

## Docker Commands Reference

### Start Services
```powershell
cd backend
docker-compose up -d
```

### Stop Services
```powershell
docker-compose down
```

### View Logs
```powershell
# All services
docker-compose logs -f

# Just PostgreSQL
docker-compose logs -f postgres

# Just Redis
docker-compose logs -f redis
```

### Restart Services
```powershell
docker-compose restart
```

### Remove Everything (including data)
```powershell
docker-compose down -v
```

### Connect to PostgreSQL
```powershell
# Using docker exec
docker exec -it auto-parts-postgres psql -U postgres -d auto_parts_platform

# If you have psql installed locally
psql -h localhost -U postgres -d auto_parts_platform
# Password: password
```

---

## Troubleshooting

### Docker Desktop Won't Start

1. **Restart Computer** - Sometimes fixes Windows subsystem issues
2. **Check Windows Subsystem for Linux (WSL2)**
   ```powershell
   wsl --status
   wsl --update
   ```
3. **Reinstall Docker Desktop** - Download from https://www.docker.com/products/docker-desktop

### Port 5432 Already in Use

```powershell
# Find what's using port 5432
netstat -ano | findstr :5432

# If PostgreSQL is already installed and running, either:
# A) Use that instance instead of Docker
# B) Stop the local PostgreSQL service:
Stop-Service postgresql*
```

Then change docker-compose.yml to use different port:
```yaml
ports:
  - "5433:5432"  # Changed from 5432:5432
```

And update .env:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5433/auto_parts_platform?schema=public"
```

### Can't Connect to Database

```powershell
# Check if container is running
docker ps

# Check PostgreSQL logs
docker-compose logs postgres

# Restart containers
docker-compose restart
```

### Reset Everything and Start Fresh

```powershell
cd backend

# Stop and remove containers + data
docker-compose down -v

# Start fresh
docker-compose up -d

# Wait 10 seconds for database to initialize
Start-Sleep -Seconds 10

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

---

## Database Management Tools

Once PostgreSQL is running (via Docker or locally), you can use these tools:

### 1. Prisma Studio (Included)
```powershell
cd backend
npm run db:studio
```
Opens at: http://localhost:5555

### 2. pgAdmin 4
- Download: https://www.pgadmin.org/download/pgadmin-4-windows/
- Connect to: localhost:5432
- Username: postgres
- Password: password
- Database: auto_parts_platform

### 3. Azure Data Studio
- Download: https://aka.ms/azuredatastudio
- Install PostgreSQL extension
- Connect to localhost:5432

### 4. VS Code Extension
- Install: "PostgreSQL" by Chris Kolkman
- Connect to: postgresql://postgres:password@localhost:5432/auto_parts_platform

---

## Environment Variables

Your `.env` file should have:

```env
# Database Configuration (Prisma)
DATABASE_URL="postgresql://postgres:password@localhost:5432/auto_parts_platform?schema=public"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Note:** These match the Docker Compose configuration.

---

## Next Steps After Database Setup

Once database is running and migrated:

1. ✅ Test authentication endpoints
2. ✅ Implement core CRUD services
3. ✅ Add VIN decoder integration
4. ✅ Build frontend React app
5. ✅ Implement customer portal

---

## Support

- Docker Documentation: https://docs.docker.com/
- Prisma Documentation: https://www.prisma.io/docs/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
