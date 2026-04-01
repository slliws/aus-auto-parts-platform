# Technical Requirements - Australian Auto Parts Sales Automation Platform

## 1. Technology Stack Overview

### 1.1 Frontend Architecture

**Web Application**
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit
- **UI Framework**: Material-UI (MUI) v5+
- **Build Tool**: Vite or Create React App
- **Package Manager**: npm or yarn
- **Code Quality**: ESLint, Prettier, Husky

**Mobile Application**
- **Framework**: React Native 0.72+
- **Package Manager**: npm or yarn
- **iOS Target**: iOS 13+
- **Android Target**: Android 11+ (API 30+)
- **Native Modules**: Camera, barcode scanner, push notifications
- **Offline Database**: SQLite + WatermelonDB
- **Code Sharing**: 60-70% shared business logic with web app

**Key Libraries**
- **HTTP Client**: Axios or React Query
- **Form Validation**: React Hook Form + Zod
- **Date Handling**: Day.js
- **PDF Generation**: React-PDF or PDFKit
- **Charts**: Recharts or Chart.js
- **Testing**: Jest, React Testing Library

### 1.2 Backend Architecture

**Runtime & Framework**
- **Node.js**: v18 LTS or higher
- **Framework**: Express.js 4.18+
- **API Style**: RESTful + GraphQL (Apollo Server)
- **Language**: TypeScript 5+
- **Package Manager**: npm or yarn

**Core Libraries**
- **Authentication**: JWT + bcrypt
- **Validation**: Joi or Zod
- **ORM**: Sequelize or TypeORM (with better typing)
- **Query Builder**: Knex.js (as fallback)
- **File Upload**: Multer + Sharp (image processing)
- **Email**: Nodemailer + SendGrid SDK
- **SMS**: Twilio SDK
- **Background Jobs**: Bull (Redis-based queues)
- **Logging**: Winston or Pino
- **Rate Limiting**: express-rate-limit + Redis

**Code Quality**
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest, Supertest
- **API Documentation**: Swagger/OpenAPI

### 1.3 Database & Data Layer

**Primary Database: PostgreSQL 15+**
- **Hosting**: AWS RDS (managed)
- **Backup**: Daily automated backups with 30-day retention
- **Replication**: Read replicas for reporting queries
- **Connection Pooling**: PgBouncer (3-5 connection limit)
- **Encryption**: SSL/TLS for connections, at-rest encryption enabled

**Key Extensions**
- **PostGIS**: For location-based queries
- **UUID-OSSP**: For UUID generation
- **pg_trgm**: For fuzzy text search
- **JSON/JSONB**: Native for flexible attributes

**Caching: Redis**
- **Hosting**: AWS ElastiCache (managed)
- **Use Cases**: 
  - Session management
  - Rate limiting counters
  - Inventory cache
  - Job queues
  - Real-time updates (pub/sub)
- **Configuration**: 3-node cluster for high availability

**Search: Elasticsearch/OpenSearch**
- **Hosting**: AWS OpenSearch (managed Elasticsearch)
- **Indexes**:
  - Parts (searchable parts catalog)
  - Vehicles (searchable vehicle inventory)
  - Communication (searchable messages)
- **Query Types**: Full-text, faceted, autocomplete
- **Sync Strategy**: Near real-time updates from PostgreSQL

**File Storage**
- **Provider**: AWS S3 (Sydney region)
- **Use Cases**: Part photos, vehicle images, documents, exports
- **CDN**: CloudFront for image delivery
- **Encryption**: Server-side encryption enabled
- **Lifecycle**: Auto-delete old versions after 90 days

### 1.4 Infrastructure & Deployment

**Cloud Provider: AWS (Sydney Region - ap-southeast-2)**
- **Rationale**: Australian data residency, low latency, comprehensive services

**Compute**
- **Service**: ECS Fargate (serverless containers)
- **Container Registry**: ECR (Elastic Container Registry)
- **Container Image**: Docker (multi-stage builds)
- **Auto-Scaling**: Based on CPU (70%) and memory (80%) utilization
- **Load Balancer**: Application Load Balancer (ALB)

**Database & Cache**
- **RDS PostgreSQL**: db.t3.medium → db.m5.large (scaling)
- **ElastiCache Redis**: cache.t3.micro → cache.m5.large (scaling)
- **OpenSearch**: 3-node cluster (minimum), t3.small per node

**Networking**
- **VPC**: Private subnets for databases and cache
- **Security Groups**: Minimal required permissions (least privilege)
- **NAT Gateway**: For outbound database connections
- **VPN**: Optional for development access

**CI/CD**
- **Repository**: GitHub
- **CI/CD Pipeline**: GitHub Actions
- **Stages**: 
  1. Lint & format check
  2. Unit tests
  3. Integration tests
  4. Build Docker image
  5. Push to ECR
  6. Deploy to staging
  7. Manual approval
  8. Deploy to production
- **Artifact Storage**: ECR

**Monitoring & Logging**
- **Application Monitoring**: CloudWatch or New Relic
- **Error Tracking**: Sentry
- **Log Aggregation**: CloudWatch Logs
- **Uptime Monitoring**: UptimeRobot or Pingdom
- **Metrics**: CPU, memory, database query performance, API latency

**Backup & Disaster Recovery**
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Backup Strategy**:
  - Daily automated RDS backups (30-day retention)
  - Cross-region replication to ap-southeast-1
  - Point-in-time recovery (last 7 days)
- **Disaster Recovery**: Documented runbook, quarterly drills

---

## 2. Performance Requirements

### 2.1 Response Time Targets

| Endpoint | Target (p95) | Notes |
|----------|-------------|-------|
| **API Calls** | <200ms | Excluding external API calls |
| **Page Load** | <2s | Time to interactive |
| **Search Results** | <500ms | Including Elasticsearch query |
| **Image Load** | <1s | Via CloudFront CDN |
| **PDF Generation** | <3s | Invoice/quote generation |

### 2.2 Throughput & Scalability

- **Concurrent Users**: 1,000+ simultaneous
- **Requests/Minute**: 10,000+ peak capacity
- **Searchable Parts**: 100,000+ parts indexed
- **Data Volume**: Up to 100GB database size (Year 2-3)

### 2.3 Availability & Reliability

- **Uptime Target**: 99.9% (8 hours downtime/month)
- **Database Availability**: 99.95% (RDS Multi-AZ)
- **Graceful Degradation**: API responds with cached data if database slow
- **Error Budget**: 0.1% error rate threshold

---

## 3. Security Requirements

### 3.1 Data Encryption

**In Transit**
- TLS 1.3 for all connections (HTTP/2)
- HTTPS only (no HTTP)
- Certificate: AWS Certificate Manager (auto-renewal)

**At Rest**
- RDS: AWS KMS encryption (AES-256)
- S3: Server-side encryption (S3-managed keys)
- Redis: Not required (session cache, non-sensitive)
- Application-level: PII fields encrypted (AES-256)

### 3.2 Authentication & Authorization

**User Authentication**
- JWT (JSON Web Tokens) with RS256 algorithm
- Access token: 1-hour expiry
- Refresh token: 30-day expiry, rotated on use
- Password hashing: bcrypt with cost factor 12
- Multi-factor authentication: Optional (TOTP)

**Authorization**
- Role-Based Access Control (RBAC)
- JWT includes: user_id, tenant_id, role, permissions
- Middleware validates permissions per endpoint
- Row-Level Security (RLS) at database level

**Session Management**
- Stateless (JWT-based)
- Session tracking in Redis (optional)
- Device fingerprinting (optional)
- Force logout on security incident

### 3.3 Secrets Management

- **Provider**: AWS Secrets Manager
- **Rotation**: Automatic 90-day rotation
- **Access**: Via IAM roles (no hardcoded secrets)
- **Staging/Dev**: Separate secrets per environment
- **Audit**: CloudTrail logs all secret access

### 3.4 Audit Logging

- **Log Everything**: Create, update, delete, status changes
- **Captured Data**: User ID, action, old/new values, timestamp, IP address
- **Retention**: 7 years (regulatory requirement)
- **Immutable**: Archive to S3 Glacier after 90 days
- **Encryption**: At-rest encryption for audit data

### 3.5 API Security

- **Rate Limiting**: Redis-based token bucket
  - Basic: 1,000 requests/hour
  - Pro: 10,000 requests/hour
  - Enterprise: 100,000 requests/hour
- **CORS**: Whitelist specific origins
- **CSRF**: CSRF tokens for form submissions
- **SQL Injection**: Parameterized queries only
- **XSS**: Input sanitization, Content Security Policy
- **Dependency Scanning**: Dependabot, npm audit

---

## 4. Database Schema Highlights

### 4.1 Core Tables

**Multi-Tenancy**
- Every table has `tenant_id` foreign key
- Row-Level Security (RLS) policies enforce isolation
- Tenants table: business_name, subscription_tier, settings

**Users & Authentication**
- users: email, password_hash, role, is_active, last_login_at
- Indexes: tenant_id, email, role

**Customers & Vehicles**
- customers: business_name, abn, email, phone, classification
- vehicles: vin, make, model, year, vehicle_status, storage_location
- Indexes: tenant_id, vin (unique), status

**Inventory**
- parts: part_type, description, condition_grade, sell_price, status
- Indexes: tenant_id, category, status, part_type
- Full-text search: description, part_type

**Transactions**
- quotes, orders, order_items, payments, shipments
- Referential integrity: Foreign keys with CASCADE delete
- Indexes: tenant_id, customer_id, status, created_at

### 4.2 Performance Optimizations

- Appropriate indexes on all frequently queried columns
- Partitioning: orders and audit_trail by date
- Connection pooling: PgBouncer (max 5 connections per app instance)
- Query timeouts: 30-second limit
- Slow query logging: CloudWatch + New Relic

---

## 5. API Architecture

### 5.1 API Design

**REST Endpoints**
- `/api/v1/...` versioning
- Resource-based URLs: `/api/v1/customers/:id`
- Standard HTTP methods: GET, POST, PATCH, DELETE
- Pagination: `page`, `per_page`, `sort`, `order`
- Filtering: Query parameters for filtering

**GraphQL (Optional)**
- `/graphql` endpoint
- Apollo Server with authentication middleware
- Subscriptions for real-time updates (inventory changes)

### 5.2 Request/Response Format

**Request Headers**
- `Authorization: Bearer <token>` (JWT)
- `Content-Type: application/json`
- `X-Tenant-ID: <tenant-uuid>` (optional explicit tenant)

**Response Format**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-24T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

**Error Responses**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "email", "message": "..." }]
  }
}
```

### 5.3 Pagination & Filtering

**Pagination**
- Default: 20 items per page
- Max: 100 items per page
- Response includes: `total_items`, `total_pages`, `current_page`

**Filtering Example**
```
GET /api/v1/parts?category=engine&condition=excellent&price_min=100&price_max=500
```

**Sorting**
```
GET /api/v1/parts?sort=price&order=asc
```

---

## 6. Third-Party Integrations

### 6.1 Payment Gateways

**Stripe Integration**
- Payment Intents API for secure payments
- Webhook handling for payment confirmations
- Customer cards stored (with PCI compliance)
- 3D Secure for high-risk transactions
- Refund processing

**Square Integration** (Alternative)
- Square Payments API
- Square Reader support (in-person)
- Inventory sync (optional)

### 6.2 Shipping Providers

**Australia Post API**
- Rate calculation
- Label generation
- Tracking number capture

**TNT/StarTrack API**
- Freight services
- Dangerous goods handling

### 6.3 Communication Services

**SendGrid (Email)**
- Transactional emails
- Template engine with variables
- Bounce/complaint handling
- Unsubscribe management

**Twilio (SMS)**
- SMS delivery
- Two-way SMS (customer replies)
- Delivery receipts

### 6.4 VIN Decoder

**NEVDIS API** (Primary)
- Australian vehicle database
- VIN decode
- Stolen vehicle check

**Redbook API** (Alternative)
- Enhanced vehicle data
- Valuation information

### 6.5 Accounting Software

**Xero API**
- OAuth 2.0 authentication
- Invoice sync (platform → Xero)
- Customer sync
- Payment reconciliation

**MYOB API** (Alternative)
- AccountRight integration
- Similar sync capabilities

### 6.6 ABN Lookup

**ABR Web Services**
- ABN/ACN validation
- Business name lookup
- GST registration status

---

## 7. Testing Strategy

### 7.1 Unit Testing

- **Coverage Target**: 80%+
- **Framework**: Jest
- **Mock Strategy**: Mock external services, focus on business logic
- **Speed Target**: All tests complete in <5 minutes

### 7.2 Integration Testing

- **Database Tests**: Real PostgreSQL instance (Docker)
- **API Tests**: Supertest with real Express instance
- **Coverage**: All major endpoints, happy path + error cases

### 7.3 End-to-End Testing

- **Framework**: Cypress or Playwright
- **Coverage**: Critical user workflows (order creation, payment, etc.)
- **Environments**: Staging only (production read-only tests)
- **Frequency**: Pre-deployment

### 7.4 Performance Testing

- **Tool**: Apache JMeter or k6
- **Scenarios**: 
  - Normal load (1,000 concurrent users)
  - Spike test (sudden 3x increase)
  - Soak test (sustained 24-hour load)
- **Threshold**: All response times <200ms p95

### 7.5 Security Testing

- **OWASP Top 10**: Manual + automated scanning
- **Dependency Scanning**: Dependabot, npm audit
- **Penetration Testing**: Quarterly (external firm)
- **SQL Injection**: Manual test of all inputs

---

## 8. Deployment & DevOps

### 8.1 Containerization

**Docker**
- Multi-stage Dockerfile
- Minimal base image (node:18-alpine)
- Non-root user (UID 1001)
- Health checks defined

**Docker Compose** (Development)
- Services: app, postgres, redis, elasticsearch
- Volume mounts for code (hot reload)
- Environment variables from .env

### 8.2 CI/CD Pipeline

**GitHub Actions Workflow**
```
1. Lint & Format Check
2. Unit Tests (Jest)
3. Integration Tests
4. Build Docker Image
5. Push to ECR
6. Deploy to Staging
7. Run Smoke Tests
8. Manual Approval (Slack notification)
9. Deploy to Production
10. Health Check Validation
```

**Deployment Strategy**
- Blue-green deployment (zero downtime)
- ECS rolling update (max 1 unavailable)
- Automatic rollback on health check failure

### 8.3 Environment Management

**Environments**
- **Development**: Local Docker Compose
- **Staging**: AWS (same infrastructure as prod)
- **Production**: AWS (monitored, backed up)

**Configuration Management**
- Environment-specific .env files
- Secrets via AWS Secrets Manager
- Database migrations: Automatic pre-deployment

---

## 9. Monitoring & Observability

### 9.1 Metrics

**Application Metrics**
- Request count, latency, error rate
- Database query performance
- Cache hit rate
- Job queue depth

**Infrastructure Metrics**
- CPU utilization
- Memory usage
- Disk space
- Network I/O

**Business Metrics**
- Orders created
- Revenue (MRR)
- Active users

### 9.2 Alerting

**Critical Alerts**
- API error rate >1%
- Response time p95 >500ms
- Database unavailable
- Payment gateway down
- Disk space <10%

**Warning Alerts**
- Error rate >0.5%
- Response time p95 >300ms
- High database connections
- Cache miss rate >30%

**Notification Channels**
- Slack (#alerts channel)
- PagerDuty (on-call escalation)
- Email (digest)

### 9.3 Logging

**Application Logs**
- Framework: Winston or Pino
- Level: info (default), debug (dev), error
- Format: JSON (structured)
- Retention: 30 days in CloudWatch

**Database Logs**
- Slow query log (>1 second)
- Error logs
- Connection logs (CloudWatch)

---

## 10. Development Workflow

### 10.1 Local Setup

**Prerequisites**
- Node.js 18+, npm/yarn
- Docker & Docker Compose
- PostgreSQL client (psql)
- Git

**Setup Steps**
```bash
git clone <repo>
cd aus-auto-parts-platform
npm install
cp .env.example .env
docker-compose up -d
npm run migrate
npm run seed (optional sample data)
npm run dev
```

### 10.2 Code Standards

**TypeScript**
- Strict mode enabled
- No `any` types (use `unknown` + type guards)
- Proper error typing

**Naming Conventions**
- camelCase: variables, functions
- PascalCase: classes, types, components
- UPPER_SNAKE_CASE: constants

**Git Workflow**
- Feature branches: `feature/short-description`
- Bug fixes: `fix/short-description`
- Pull request required before merge
- Squash commits for cleaner history

**Code Review**
- At least 1 approval required
- CI must pass
- No commented-out code
- 80% test coverage minimum

---

## 11. Dependency Management

### 11.1 Version Pinning

- **package.json**: Exact versions (no `~` or `^`)
- **package-lock.json**: Committed to repository
- **Major upgrades**: Reviewed quarterly
- **Security updates**: Applied within 1 week

### 11.2 Dependency Audits

- `npm audit` in CI/CD (fail on high/critical)
- Dependabot PRs for automated updates
- Manual review of new dependencies
- License compliance check (no GPL)

---

## 12. Disaster Recovery

### 12.1 Backup Strategy

- **Database**: Daily automated RDS backups (30-day retention)
- **S3 Data**: Versioning enabled, 90-day retention
- **Cross-Region**: Replicate to ap-southeast-1 monthly
- **Test Recovery**: Monthly backup restore test

### 12.2 Runbooks

- **Database Failover**: 10-minute recovery from standby
- **Cache Reconstruction**: 15 minutes (from database)
- **Full Outage**: 4-hour recovery (RTO), 1-hour data loss (RPO)
- **Incident Response**: Documented playbook

---

## Conclusion

This technical specification provides the foundation for building a scalable, secure, and maintainable platform. The technology stack is proven in production, the infrastructure is cloud-native and auto-scaling, and the development process includes rigorous testing and monitoring.

**Document Version**: 1.0  
**Date**: October 24, 2025  
**Status**: Technical Requirements Complete