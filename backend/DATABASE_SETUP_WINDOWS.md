# PostgreSQL Setup Guide for Windows

## Prerequisites
- Windows 10 or Windows 11
- Administrator access
- At least 1GB free disk space

## Installation Steps

### Option 1: Official PostgreSQL Installer (Recommended)

#### 1. Download PostgreSQL
1. Visit: https://www.postgresql.org/download/windows/
2. Click "Download the installer" (from EnterpriseDB)
3. Download PostgreSQL 15.x or 16.x (latest stable version)
4. Choose the Windows x86-64 installer

#### 2. Run the Installer
1. Run the downloaded `.exe` file as Administrator
2. Click "Next" through the Setup Wizard
3. **Installation Directory**: Keep default (`C:\Program Files\PostgreSQL\16`)
4. **Select Components**: Keep all selected:
   - PostgreSQL Server
   - pgAdmin 4 (GUI management tool)
   - Command Line Tools
   - Stack Builder (optional)

#### 3. Set PostgreSQL Password
- **IMPORTANT**: Set a strong password for the `postgres` superuser
- **Remember this password** - you'll need it for the `.env` file
- Default username is `postgres`

#### 4. Configure Port
- Keep default port: `5432`
- Click "Next"

#### 5. Select Locale
- Keep default locale (Default locale)
- Click "Next"

#### 6. Complete Installation
- Review summary
- Click "Next" to install
- Wait for installation to complete (2-5 minutes)
- Uncheck "Launch Stack Builder" (not needed)
- Click "Finish"

### Option 2: Using Chocolatey (Command Line)

If you have Chocolatey installed:

```powershell
# Run PowerShell as Administrator
choco install postgresql --params '/Password:YourStrongPassword'
```

### Option 3: Using winget (Windows Package Manager)

```powershell
# Run PowerShell as Administrator
winget install PostgreSQL.PostgreSQL
```

## Post-Installation Configuration

### 1. Verify PostgreSQL Service is Running

**Using Services:**
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "postgresql-x64-16" (or similar)
3. Ensure Status is "Running"
4. If not running, right-click → Start

**Using Command Line:**
```powershell
# Check service status
Get-Service postgresql*

# Start service if not running
Start-Service postgresql-x64-16
```

### 2. Add PostgreSQL to PATH

1. Press `Win + X` → System
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find "Path"
5. Click "Edit"
6. Click "New" and add:
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```
7. Click "OK" to save

**Verify PATH:**
```powershell
# Close and reopen PowerShell, then test:
psql --version
# Should show: psql (PostgreSQL) 16.x
```

### 3. Create Database for the Project

**Option A: Using pgAdmin 4 (GUI)**
1. Open pgAdmin 4 (installed with PostgreSQL)
2. Right-click "Databases" → Create → Database
3. Database name: `auto_parts_platform`
4. Owner: `postgres`
5. Click "Save"

**Option B: Using Command Line (Recommended)**
```powershell
# Connect to PostgreSQL (will prompt for password)
psql -U postgres

# Inside psql, create database:
CREATE DATABASE auto_parts_platform;

# Verify database created:
\l

# Exit psql:
\q
```

**Option C: Using One-Line Command**
```powershell
# Replace 'YourPassword' with your actual postgres password
$env:PGPASSWORD='YourPassword'; psql -U postgres -c "CREATE DATABASE auto_parts_platform;"
```

### 4. Update .env File

Edit `backend/.env` and update the DATABASE_URL with your actual password:

```env
# Replace 'password' with your PostgreSQL password
DATABASE_URL="postgresql://postgres:YourActualPassword@localhost:5432/auto_parts_platform?schema=public"
```

**Example:**
If your postgres password is `MySecure123`, use:
```env
DATABASE_URL="postgresql://postgres:MySecure123@localhost:5432/auto_parts_platform?schema=public"
```

## Testing the Connection

### Test 1: Direct PostgreSQL Connection
```powershell
# Connect to the database
psql -U postgres -d auto_parts_platform

# If successful, you'll see:
# auto_parts_platform=#

# Exit:
\q
```

### Test 2: Prisma Connection Test
```powershell
# From backend directory:
cd backend
npx prisma db pull
```

If successful, Prisma will connect to your database.

## Troubleshooting

### Issue: "psql: command not found"
**Solution**: PostgreSQL bin directory not in PATH
1. Add to PATH as described above
2. Restart terminal/PowerShell

### Issue: "Connection refused" or "Can't reach database"
**Solution**: PostgreSQL service not running
```powershell
# Check service
Get-Service postgresql*

# Start service
Start-Service postgresql-x64-16
```

### Issue: "password authentication failed"
**Solution**: Incorrect password in DATABASE_URL
1. Reset postgres password:
```powershell
# As Administrator
psql -U postgres
\password postgres
# Enter new password
```
2. Update `.env` file with new password

### Issue: Port 5432 already in use
**Solution**: Another service using port
1. Find what's using port:
```powershell
netstat -ano | findstr :5432
```
2. Either:
   - Stop the conflicting service
   - Configure PostgreSQL to use different port (5433)

### Issue: "database does not exist"
**Solution**: Database not created
```powershell
psql -U postgres -c "CREATE DATABASE auto_parts_platform;"
```

## Security Notes

### For Development:
- Default username: `postgres`
- Keep password secure but accessible
- Connection limited to localhost

### For Production:
- Create dedicated database user (not postgres superuser)
- Use strong, unique passwords
- Enable SSL connections
- Configure `pg_hba.conf` for proper authentication
- Regular backups

## Create Dedicated Database User (Recommended)

Instead of using `postgres` superuser:

```sql
-- Connect as postgres
psql -U postgres

-- Create new user
CREATE USER auto_parts_admin WITH PASSWORD 'SecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auto_parts_platform TO auto_parts_admin;

-- Grant schema privileges
\c auto_parts_platform
GRANT ALL ON SCHEMA public TO auto_parts_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO auto_parts_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO auto_parts_admin;

-- Exit
\q
```

Then update `.env`:
```env
DATABASE_URL="postgresql://auto_parts_admin:SecurePassword123!@localhost:5432/auto_parts_platform?schema=public"
```

## GUI Management Tools

### pgAdmin 4 (Installed with PostgreSQL)
- Location: Start Menu → PostgreSQL → pgAdmin 4
- Web-based interface
- Full database management

### Alternative: Azure Data Studio
- Download: https://aka.ms/azuredatastudio
- Install PostgreSQL extension
- Modern, VS Code-like interface

### Alternative: DBeaver
- Download: https://dbeaver.io/download/
- Free, cross-platform
- Excellent for SQL development

## Next Steps

Once PostgreSQL is installed and running:

1. ✅ Verify service is running
2. ✅ Create database
3. ✅ Update .env file
4. ✅ Test connection
5. Run migrations:
```powershell
cd backend
npm run db:migrate
```
6. Seed database:
```powershell
npm run db:seed
```

## Quick Reference Commands

```powershell
# Check PostgreSQL service status
Get-Service postgresql*

# Start PostgreSQL service
Start-Service postgresql-x64-16

# Stop PostgreSQL service
Stop-Service postgresql-x64-16

# Restart PostgreSQL service
Restart-Service postgresql-x64-16

# Connect to database
psql -U postgres -d auto_parts_platform

# List all databases
psql -U postgres -c "\l"

# Create database
psql -U postgres -c "CREATE DATABASE auto_parts_platform;"

# Drop database (careful!)
psql -U postgres -c "DROP DATABASE auto_parts_platform;"
```

## Support

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- PostgreSQL Windows FAQ: https://www.postgresql.org/docs/current/install-windows.html
- pgAdmin Documentation: https://www.pgadmin.org/docs/
