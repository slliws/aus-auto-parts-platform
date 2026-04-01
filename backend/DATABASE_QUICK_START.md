# Database Quick Start Guide
# Australian Auto Parts Sales Automation Platform

This guide provides comprehensive instructions for setting up the PostgreSQL database for the Australian Auto Parts Sales Automation Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [PostgreSQL Installation](#postgresql-installation)
   - [Direct Installation](#direct-installation)
   - [Docker Installation](#docker-installation)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running Migrations and Seed](#running-migrations-and-seed)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js (v18+)
- npm (v9+)
- PostgreSQL (v14+) or Docker

## PostgreSQL Installation

### Direct Installation

#### Windows

1. Download PostgreSQL installer from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the wizard
3. Set password for postgres user (recommended: `postgres`)
4. Default port: `5432` (keep this default)
5. Add PostgreSQL bin directory to your PATH (the installer should do this)
6. Verify installation: 
   ```
   psql -U postgres -c "SELECT version();"
   ```

#### macOS

1. Install using Homebrew:
   ```
   brew install postgresql@14
   brew services start postgresql@14
   ```
2. Set password for postgres user:
   ```
   psql postgres
   \password postgres
   ```
3. Verify installation:
   ```
   psql -U postgres -c "SELECT version();"
   ```

#### Linux (Ubuntu/Debian)

1. Install PostgreSQL:
   ```
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```
2. Start service:
   ```
   sudo service postgresql start
   ```
3. Set password for postgres user:
   ```
   sudo -u postgres psql
   \password postgres
   ```
4. Verify installation:
   ```
   psql -U postgres -c "SELECT version();"
   ```

### Docker Installation

1. Ensure Docker is installed and running on your system
2. Run PostgreSQL container:
   ```
   docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
   ```
3. Verify connection:
   ```
   docker exec -it postgres psql -U postgres -c "SELECT version();"
   ```

## Environment Configuration

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Copy the example environment file:
   ```
   cp .env.example .env
   ```

3. Edit `.env` file to set your database connection:
   ```
   # Database Configuration (Prisma)
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auto_parts_platform?schema=public"
   ```

   The format is:
   ```
   postgresql://[username]:[password]@[host]:[port]/[database_name]?schema=[schema]
   ```

   - Replace `[username]` with your PostgreSQL username (default: `postgres`)
   - Replace `[password]` with your PostgreSQL password (default: `postgres`)
   - Replace `[host]` with your PostgreSQL host (default: `localhost`)
   - Replace `[port]` with your PostgreSQL port (default: `5432`)
   - Replace `[database_name]` with your database name (default: `auto_parts_platform`)
   - Replace `[schema]` with your schema name (default: `public`)

4. If using Docker, ensure the host is set to `localhost` (not `127.0.0.1` - sometimes this matters)

## Database Setup

### Option 1: Using the Setup Script (Windows)

1. Run the PowerShell setup script:
   ```
   .\setup-database.ps1
   ```
   
   This script will:
   - Check PostgreSQL connection
   - Create the database if it doesn't exist
   - Install npm dependencies
   - Generate Prisma client
   - Run migrations
   - Offer to seed the database with sample data

### Option 2: Manual Setup (All Platforms)

1. Create the database (if not exists):
   ```
   psql -U postgres -c "CREATE DATABASE auto_parts_platform;"
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Generate Prisma client:
   ```
   npm run db:generate
   ```

4. Run migrations:
   ```
   npm run db:migrate
   ```

## Running Migrations and Seed

### Migrations

- Run pending migrations:
  ```
  npm run db:migrate
  ```

- Reset database (drop and recreate):
  ```
  npm run db:migrate:reset
  ```

- Deploy migrations in production:
  ```
  npm run db:migrate:deploy
  ```

### Seed Data

Populate the database with sample data:
```
npm run db:seed
```

This will create:
- A default Australian tenant with ABN
- Admin, manager, and sales user accounts
- Sample customers of different types (retail, trade, wholesale)
- Sample vehicles with common Australian models
- Sample parts across different categories
- Sample supplier with Australian details

#### Default Login Credentials

- Admin: `admin@aussieautoparts.com.au` / `Password123!`
- Manager: `manager@aussieautoparts.com.au` / `Password123!`
- Sales: `sales@aussieautoparts.com.au` / `Password123!`

## Troubleshooting

### Common Issues

1. **PostgreSQL connection error**
   - Verify PostgreSQL is running:
     ```
     # Windows
     sc query postgresql
     
     # macOS
     brew services list
     
     # Linux
     sudo service postgresql status
     ```
   - Check credentials in `.env` file
   - Ensure your firewall allows connections to port 5432

2. **"Database already exists" error**
   - This is normal if you've already created the database
   - Continue with the next steps

3. **Migration errors**
   - Check DATABASE_URL in `.env` file
   - Ensure PostgreSQL is running on the specified host/port
   - Verify your database user has the correct permissions

4. **"Cannot find module '@prisma/client'" error**
   - Run `npm install` to install dependencies
   - Run `npm run db:generate` to generate Prisma client

5. **Docker connection issues**
   - Ensure the Docker container is running:
     ```
     docker ps
     ```
   - Check Docker container logs:
     ```
     docker logs postgres
     ```
   - Verify port mapping:
     ```
     docker port postgres
     ```

### Database Inspection

- Open Prisma Studio (database GUI):
  ```
  npm run db:studio
  ```
  This opens a web interface at `http://localhost:5555`

- Connect directly with psql:
  ```
  psql -U postgres -d auto_parts_platform
  ```

- Useful psql commands:
  ```
  \l           # List all databases
  \c auto_parts_platform  # Connect to database
  \dt          # List all tables
  \d "User"    # Show table structure
  \q           # Quit psql
  ```

### Resetting Everything

If you need a complete reset:

1. Drop the database:
   ```
   psql -U postgres -c "DROP DATABASE auto_parts_platform;"
   ```

2. Create a new database:
   ```
   psql -U postgres -c "CREATE DATABASE auto_parts_platform;"
   ```

3. Run migrations and seed:
   ```
   npm run db:migrate
   npm run db:seed