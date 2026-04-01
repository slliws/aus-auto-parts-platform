# Database Setup Guide - Australian Auto Parts Platform

## Overview

This document provides instructions for setting up and managing the PostgreSQL database for the Australian Auto Parts Sales Platform using Prisma ORM.

## Database Schema

The database consists of **15 tables** organized into 4 categories:

### Core Tables (5)
1. **tenants** - Multi-tenant isolation and subscription management
2. **users** - User accounts with role-based access control (ADMIN, MANAGER, SALES, VIEWER)
3. **customers** - Customer records (RETAIL, TRADE, WHOLESALE types)
4. **vehicles** - Vehicle inventory with VIN tracking
5. **parts** - Parts catalog with compatibility and pricing

### Commerce Tables (4)
6. **quotes** - Quote generation with 7-day expiry
7. **quote_items** - Line items for quotes
8. **orders** - Order processing and fulfillment
9. **order_items** - Line items for orders

### Finance Tables (2)
10. **payments** - Payment tracking (Stripe/Square integration ready)
11. **shipments** - Shipping integration (Australia Post/StarTrack)

### Support Tables (4)
12. **communications** - Customer interaction history
13. **audit_logs** - Immutable audit trail for compliance
14. **suppliers** - Supplier management
15. **warranty_claims** - Australian Consumer Law (ACL) compliance

## Prerequisites

1. **PostgreSQL 14+** installed and running
2. **Node.js 18+** and npm 9+
3. Database created: `auto_parts_platform`
4. Database user with appropriate permissions

## Initial Setup

### 1. Install PostgreSQL (if not installed)

**Windows:**
```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE auto_parts_platform;

# Create user (optional)
CREATE USER autoparts_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE auto_parts_platform TO autoparts_user;

# Exit psql
\q
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and update the database connection string:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/auto_parts_platform?schema=public"
```

**Format:**
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
```

### 4. Enable Required PostgreSQL Extensions

```sql
-- Connect to your database
psql -U postgres -d auto_parts_platform

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable fuzzy text search (for parts search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## Database Management Commands

All commands should be run from the `backend` directory:

```bash
cd aus-auto-parts-platform/backend
```

### Generate Prisma Client

```bash
npm run db:generate
```

### Create Migration

```bash
npm run db:migrate
# You'll be prompted to name the migration
```

### Apply Migrations (Production)

```bash
npm run db:migrate:deploy
```

### Reset Database (⚠️ Deletes all data)

```bash
npm run db:migrate:reset
```

### Seed Database with Demo Data

```bash
npm run db:seed
```

### Open Prisma Studio (Database GUI)

```bash
npm run db:studio
# Opens at http://localhost:5555
```

### Validate Schema

```bash
npm run db:validate
```

### Format Schema File

```bash
npm run db:format
```

## Initial Migration & Seed

To set up a fresh database with demo data:

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Create and apply initial migration
npm run db:migrate
# Enter migration name: initial_schema

# 3. Seed with demo data
npm run db:seed
```

## Demo Data

The seed script creates:
- ✅ 1 Demo Tenant (PRO subscription)
- ✅ 2 Users (Admin & Sales)
- ✅ 3 Customers (Retail, Trade, Wholesale)
- ✅ 5 Vehicles (Toyota, Holden, Ford, Mazda, Nissan)
- ✅ 12 Parts (engines, transmissions, body parts, etc.)
- ✅ 1 Supplier

### Default Login Credentials

**Admin User:**
- Email: `admin@demoautoparts.com.au`
- Password: `password123`

**Sales User:**
- Email: `sales@demoautoparts.com.au`
- Password: `password123`

⚠️ **Change these credentials in production!**

## Australian-Specific Features

### 1. ABN (Australian Business Number)
- Format: `XX XXX XXX XXX` (11 digits)
- Stored as `VARCHAR(14)` to accommodate formatting
- Required for trade/wholesale customers

### 2. GST (Goods and Services Tax)
- All prices include GST calculation
- GST is always 10% in Australia
- Stored as `DECIMAL(10, 2)` for precision

### 3. Australian States
- NSW, VIC, QLD, WA, SA, TAS, ACT, NT
- Stored as 3-character codes

### 4. Postcode
- 4-digit Australian postcodes
- Stored as `VARCHAR(4)`

### 5. Phone Numbers
- Mobile: `+61 4XX XXX XXX`
- Landline: `+61 X XXXX XXXX`
- Stored with international format

## Multi-Tenancy

### Automatic Tenant Filtering

The Prisma middleware automatically:
- ✅ Filters all queries by `tenant_id`
- ✅ Adds `tenant_id` to all CREATE operations
- ✅ Prevents cross-tenant data access

### Setting Tenant Context

```typescript
import { setTenantContext } from './models/prisma';

// In authentication middleware
setTenantContext({ tenantId: user.tenant_id });
```

## Compliance Features

### 1. Privacy Act 1988
- **Audit Trail:** All data modifications logged in `audit_logs`
- **Timestamps:** All tables have `created_at` and `updated_at`
- **Soft Deletes:** Implement `deleted_at` field where needed

### 2. Australian Consumer Law
- **Warranty Claims:** Dedicated `warranty_claims` table
- **Minimum Warranty:** 6 months for major parts (configurable)
- **Dispute Resolution:** Track claim status and resolution

## Database Performance

### Indexes

The schema includes optimized indexes on:
- **tenant_id** (all tables) - Multi-tenant filtering
- **email** (users, customers) - Login and lookups
- **vin** (vehicles) - Vehicle identification
- **order_number, quote_number** - Order tracking
- **barcode, part_number** - Inventory management
- **created_at** (audit_logs, communications) - Time-based queries

### Connection Pooling

Prisma automatically manages connection pooling. Default settings:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

Adjust in `.env` if needed (legacy settings for reference).

## Troubleshooting

### Issue: "Missing DATABASE_URL"

**Solution:** Ensure `.env` file exists in the backend directory with valid `DATABASE_URL`.

### Issue: "Can't connect to database"

**Solutions:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check connection string in `.env`
3. Verify database exists: `psql -l`
4. Check firewall settings (port 5432)

### Issue: Migration fails

**Solutions:**
1. Check for syntax errors: `npm run db:validate`
2. Rollback: `npm run db:migrate:reset`
3. Check PostgreSQL logs for detailed errors

### Issue: Seed script fails

**Solutions:**
1. Ensure migrations are applied first
2. Reset database: `npm run db:migrate:reset`
3. Check for unique constraint violations

## Production Deployment

### AWS RDS PostgreSQL Setup

1. **Create RDS Instance:**
   - Engine: PostgreSQL 14+
   - Instance class: db.t3.micro (BASIC) to db.m5.large (ENTERPRISE)
   - Storage: 20GB+ SSD
   - Multi-AZ: Yes (production)
   - Backup retention: 7-30 days

2. **Security Group:**
   - Inbound: Port 5432 from application servers only
   - No public access

3. **Connection String:**
   ```
   DATABASE_URL="postgresql://[USER]:[PASSWORD]@[RDS_ENDPOINT]:5432/auto_parts_platform?schema=public&sslmode=require"
   ```

4. **Apply Migrations:**
   ```bash
   npm run db:migrate:deploy
   ```

5. **DO NOT seed in production** - Only use seed for development/testing

## Next Steps

After database setup is complete, you can proceed with:

1. **Service Layer Implementation:**
   - Create service classes for each model
   - Implement business logic
   - Add transaction support

2. **API Endpoint Implementation:**
   - Connect routes to services
   - Add request validation
   - Implement authentication

3. **Testing:**
   - Unit tests for services
   - Integration tests for database operations
   - E2E tests for API endpoints

## Useful Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Australian Business Number (ABN)](https://abr.gov.au/)
- [Australian Consumer Law](https://www.accc.gov.au/consumers/consumer-rights-guarantees)

## Support

For issues or questions:
1. Check this documentation
2. Review Prisma documentation
3. Check PostgreSQL logs
4. Create an issue in the project repository