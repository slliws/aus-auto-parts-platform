# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant B2B SaaS platform for Australian second-hand auto parts industry. Full-stack application with React frontend and Express.js backend.

**Tech Stack:**
- Frontend: React 19, TypeScript 5.9, Vite 7, MUI 7, Redux Toolkit
- Backend: Node.js 18+, Express 4.18, TypeScript 5.9, Prisma 6.18
- Database: PostgreSQL 16, Redis 7
- Testing: Jest (backend), Cypress (frontend E2E)

## Essential Commands

### Backend (`backend/`)

```bash
# Development
npm run dev                     # Start with hot reload (ts-node-dev)
npm run build                   # Compile TypeScript to dist/

# Testing (80% coverage threshold enforced)
npm test                        # Run all tests
npm run test:watch              # Watch mode
npm run test:coverage           # Generate coverage report

# Database
npm run db:migrate              # Create new migration
npm run db:generate             # Regenerate Prisma client after schema changes
npm run db:seed                 # Seed initial data
npm run db:studio               # Open Prisma Studio GUI

# Linting
npm run lint                    # ESLint check
npm run lint:fix                # Auto-fix lint issues
```

### Frontend (`frontend/`)

```bash
# Development
npm run dev                     # Vite dev server with HMR
npm run build                   # Production build (tsc + vite)
npm run preview                 # Preview production build

# Testing
npm run cypress:open            # Interactive E2E test development
npm run cypress:run             # Headless E2E tests
npm run test:e2e                # Full E2E with auto server startup

# Linting
npm run lint                    # ESLint check
```

### Docker

```bash
# Local development (PostgreSQL + Redis)
docker-compose up -d            # Start services
docker-compose down             # Stop services

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## Architecture

### Backend Layered Structure

```
Request → Router → Controller → Service → Prisma → Database
              ↓
         Middleware (Auth, Validation, Error Handling)
```

**Key directories:**
- `src/controllers/` - HTTP handlers, delegate to services
- `src/services/` - Business logic (auth, customers, parts, payments, vehicles, analytics, search)
- `src/routes/` - API endpoint definitions with validation middleware
- `src/middleware/` - Auth, tenant context, rate limiting, error handling
- `src/utils/` - JWT helpers, Winston logger, custom error classes
- `prisma/schema.prisma` - Multi-tenant database schema (15+ models)

**Import path aliases:**
```typescript
import config from '@config';
import { AuthService } from '@services/auth.service';
import { logger } from '@utils/logger';
```

### Frontend Component Architecture

Atomic Design pattern with lazy-loaded routes:

```
Pages → Organisms → Molecules → Atoms
           ↓
       Redux Store (12 slices)
           ↓
       Services (Axios API clients)
```

**Key directories:**
- `src/pages/` - Route page components (lazy-loaded)
- `src/components/atoms/` - Basic elements (Button, Avatar, Card)
- `src/components/molecules/` - Composite components (SearchBar, FilterControl)
- `src/components/organisms/` - Complex sections (Dashboard, Navigation)
- `src/store/slices/` - Redux state (auth, customers, orders, payments, parts, etc.)
- `src/services/` - Backend API integration

### Multi-Tenancy

All database queries are filtered by `tenant_id` via middleware. Each tenant has:
- Isolated data (parts, customers, orders, etc.)
- Subscription tier-based rate limiting (BASIC: 1k, PRO: 10k, ENTERPRISE: 100k req/hr)
- Role-based access control (ADMIN, MANAGER, SALES, VIEWER)

### Authentication Flow

JWT with access + refresh token pattern:
- Access token: 1 hour expiry
- Refresh token: 30 days expiry (stored in database with revocation support)
- Email verification: 24 hour expiry
- Password reset: 1 hour expiry
- Passwords: bcrypt with 12 rounds

## Database Schema Highlights

Core entities in `backend/prisma/schema.prisma`:
- **Tenant** - Multi-tenant parent with subscription tier
- **User** - Platform users with roles
- **Customer** - End customers (RETAIL, TRADE, WHOLESALE)
- **Vehicle** - Intake vehicles with VIN tracking
- **Part** - Auto parts inventory with condition grading
- **Quote/Order** - Sales workflow with status tracking
- **Payment/Transaction** - Payment processing with audit trail
- **AuditLog** - Immutable audit trail (7-year retention for compliance)

## Testing Strategy

**Backend:**
- Tests in `backend/src/tests/integration/`
- 80% coverage threshold enforced in `jest.config.ts`
- Current: 82% coverage, 90.3% pass rate (93/103 tests)
- Test database uses separate env vars

**Frontend:**
- E2E tests in `frontend/cypress/`
- Tests run against live Vite dev server on port 5173

## Critical Security Notes

1. **Never commit secrets** - All sensitive config via environment variables
2. **JWT secrets** - Must be changed from defaults in production
3. **Tenant isolation** - All queries must include tenant_id filtering
4. **Rate limiting** - Enforced per subscription tier
5. **Audit logging** - All mutations logged for compliance

## Environment Setup

Required environment variables (see `backend/.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Auth tokens (CRITICAL)
- `REDIS_HOST`, `REDIS_PORT` - Cache connection
- `ALLOWED_ORIGINS` - CORS whitelist

## Key API Patterns

- RESTful endpoints with `/api/v1/` prefix
- Consistent error responses with custom error classes
- Request ID tracing via `X-Request-Id` header
- Paginated responses with cursor/offset support
- Joi validation schemas in middleware

## Performance Targets

- API response: <200ms (p95)
- Page load: <2s
- Uptime: 99.9%
- Support: 1,000+ concurrent users
