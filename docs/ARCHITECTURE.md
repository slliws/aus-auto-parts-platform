# Australian Auto Parts Sales Automation Platform - Architecture Document

## Executive Summary

This document presents a comprehensive architecture for a B2B SaaS platform designed specifically for the Australian second-hand auto parts industry. The platform will automate sales operations, customer/supplier relationship management, and inventory control for auto wreckers and parts suppliers across Australia.

**Project Parameters:**
- **Target Market**: All segments (small to large wreckers) with tiered pricing
- **Priority Features**: Inventory management + customer-facing parts search
- **Budget**: Mid-range ($150K-$250K)
- **Timeline**: Phased rollout over 9-12 months
- **Business Model**: Multi-tenant SaaS subscription platform

**Key Value Propositions:**
1. Reduce manual data entry through VIN decoding and automated cataloging
2. Streamline customer acquisition with self-service parts search portal
3. Automate order processing and customer communications
4. Provide real-time inventory visibility across multiple locations
5. Enable data-driven pricing based on market demand and competitor analysis
6. Ensure compliance with Australian Consumer Law and privacy regulations

---

## 1. Market Analysis

### 1.1 Australian Second-Hand Auto Parts Market

**Market Characteristics:**
- **Market Size**: Estimated $1.5-2B annually in Australia
- **Business Types**: 
  - Independent wreckers (60-70% of market)
  - Large wrecker chains (15-20%)
  - Specialized dismantlers (10-15%)
- **Geographic Distribution**: Concentrated in NSW, VIC, QLD (80% of businesses)
- **Average Business Size**: 3-15 employees, 50-500 vehicles processed annually

**Key Pain Points:**
1. **Manual Inventory Management**: 70% still use spreadsheets or paper-based systems
2. **Customer Inquiries**: Average 50-200 phone calls/day for parts availability
3. **Parts Location**: Staff spend 30-40% of time physically searching yards
4. **Pricing Inconsistency**: Lack of standardized pricing leads to revenue loss
5. **No Online Presence**: 60% have no e-commerce or searchable inventory
6. **Customer Communication**: Manual phone/SMS follow-ups consume significant time
7. **Compliance Burden**: Tracking warranties, returns, and customer rights documentation

### 1.2 Competitive Landscape

**Existing Solutions:**

| Solution | Type | Strengths | Weaknesses |
|----------|------|-----------|------------|
| **Car-Part.com.au** | Marketplace | Large network | Commission-based, no inventory mgmt |
| **RevolutionParts** | SaaS | Comprehensive features | US-focused, expensive (>$500/mo) |
| **Excel/Paper** | Manual | Free, flexible | Time-consuming, error-prone, no automation |
| **Generic POS** | Local software | Simple | No auto parts specialization |

**Our Competitive Advantages:**
1. **Australian-First Design**: Built for Australian regulations, payment systems, shipping
2. **Affordable Tiered Pricing**: Starting from $99/month for small operators
3. **Mobile-First**: On-the-go access for yard workers
4. **VIN Decoding**: Instant vehicle identification using Australian vehicle database
5. **Automated Communications**: SMS/email integration with Australian providers
6. **Parts Compatibility Engine**: Intelligent cross-vehicle part matching
7. **Local Support**: Australian-based customer support during business hours

### 1.3 Regulatory Environment

**Compliance Requirements:**
1. **Australian Consumer Law (ACL)**:
   - Warranty tracking and management
   - Consumer guarantees documentation
   - Refund and return policies
   - Product safety obligations

2. **Privacy Act 1988**:
   - Customer data protection
   - Consent management
   - Data breach notification
   - Right to access/delete personal information

3. **Automotive Industry Standards**:
   - VIN recording requirements
   - Parts traceability for recalls
   - Environmental disposal regulations (AAAA compliance)
   - Hazardous materials handling

4. **Taxation**:
   - GST calculation and reporting (10%)
   - BAS integration
   - Tax invoice requirements
   - ABN validation

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTO PARTS SALES PLATFORM                        │
├─────────────────────────────────────────────────────────────────────┤
│                         PRESENTATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │   Web App    │  │  Mobile App  │  │   Customer   │  │  Admin  │ │
│  │   (React)    │  │ (React Native│  │    Portal    │  │  Panel  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        APPLICATION LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │     CRM      │  │  Inventory   │  │    Order     │  │ Pricing │ │
│  │   Service    │  │   Service    │  │   Service    │  │ Engine  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Supplier    │  │Communication │  │   Search     │  │  VIN    │ │
│  │   Service    │  │   Service    │  │   Service    │  │Decoder  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                        INTEGRATION LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │   Payment    │  │   Shipping   │  │  Accounting  │  │   SMS   │ │
│  │   Gateway    │  │   Provider   │  │  Integration │  │  Email  │ │
│  │(Stripe/Square│  │ (AusPost/TNT)│  │ (Xero/MYOB)  │ │(Twilio) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                           DATA LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │  S3 Storage  │  │ Elastic │ │
│  │  (Primary)   │  │   (Cache)    │  │   (Photos)   │  │ (Search)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Cloud Infrastructure │
                    │   (AWS Sydney Region)  │
                    │   - EC2/ECS/Fargate    │
                    │   - RDS PostgreSQL     │
                    │   - ElastiCache Redis  │
                    │   - S3 + CloudFront    │
                    │   - Elasticsearch      │
                    └───────────────────────┘
```

### 2.2 Technology Stack Justification

#### **Frontend Layer**

**Web Application: React + TypeScript**
- **Rationale**: Industry standard, excellent ecosystem, strong typing with TypeScript
- **UI Framework**: Material-UI (MUI) for professional, accessible components
- **State Management**: Redux Toolkit for predictable state management
- **Benefits**: 
  - Rapid development with component reusability
  - Large talent pool in Australia
  - Strong PWA capabilities for offline functionality
  - Excellent mobile responsiveness

**Mobile Application: React Native**
- **Rationale**: Code sharing with web app (60-70% shared business logic)
- **Benefits**:
  - Single codebase for iOS and Android
  - Native performance for camera (part photos), barcode scanning
  - Offline-first architecture for yard operations
  - Lower development costs than separate native apps

#### **Backend Layer**

**Primary Framework: Node.js + Express.js**
- **Rationale**: JavaScript across entire stack, excellent async performance
- **API Style**: RESTful API + GraphQL for complex queries
- **Benefits**:
  - High concurrency for real-time inventory updates
  - Large ecosystem of libraries
  - Easy integration with modern frontend frameworks
  - Strong Australian developer community

**Alternative Consideration: Python + FastAPI**
- **Use Case**: If ML-based pricing algorithms are prioritized
- **Benefits**: Superior data science libraries, async support
- **Trade-off**: Slightly smaller ecosystem for business logic

**Recommended: Node.js** (better ecosystem fit, team skillset availability)

#### **Database Layer**

**Primary Database: PostgreSQL 15+**
- **Rationale**: ACID compliance, excellent JSON support, full-text search
- **Features Utilized**:
  - JSONB for flexible parts attributes
  - Full-text search for parts descriptions
  - Row-level security for multi-tenant isolation
  - PostGIS extension for location-based queries
- **Benefits**:
  - Open-source, no licensing costs
  - Excellent performance for transactional workloads
  - Strong data integrity guarantees
  - Mature replication and backup tools

**Caching: Redis**
- **Use Cases**: Session management, rate limiting, inventory cache, job queues
- **Benefits**: Sub-millisecond latency, pub/sub for real-time updates

**Search: Elasticsearch**
- **Use Cases**: Advanced parts search, faceted filtering, autocomplete
- **Benefits**: Excellent full-text search, relevance scoring, fast aggregations

**File Storage: AWS S3**
- **Use Cases**: Part photos, vehicle images, documents
- **Benefits**: Unlimited scalability, integrated with CloudFront CDN, low cost

#### **Infrastructure**

**Cloud Provider: AWS (Sydney Region)**
- **Rationale**: 
  - Australian data residency (Privacy Act compliance)
  - Low latency for Australian users (<20ms)
  - Comprehensive service offering
  - Mature enterprise features
- **Services**:
  - **Compute**: ECS Fargate (containerized, auto-scaling)
  - **Database**: RDS PostgreSQL (managed, automated backups)
  - **Cache**: ElastiCache Redis (managed)
  - **Storage**: S3 + CloudFront CDN
  - **Search**: OpenSearch (managed Elasticsearch)
  - **Monitoring**: CloudWatch + Application Load Balancer

**Containerization: Docker + Docker Compose (dev) / ECS (prod)**
- **Benefits**: Consistent environments, easy scaling, simplified deployments

**CI/CD: GitHub Actions**
- **Pipeline**: Test → Build → Deploy to staging → Manual approval → Production
- **Benefits**: Free for private repos, excellent ecosystem integration

### 2.3 Multi-Tenant Architecture

**Tenancy Model: Row-Level Multi-Tenancy**

**Approach**: Single database with `tenant_id` on all tables + Row-Level Security (RLS)

**Rationale**:
- **Cost-Effective**: Single infrastructure serves all customers
- **Efficient**: Shared connection pooling, easier maintenance
- **Scalable**: Can migrate large tenants to dedicated instances later
- **Data Isolation**: PostgreSQL RLS provides security guarantees

**Implementation**:
```sql
-- Every table includes tenant_id
CREATE TABLE parts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  vin VARCHAR(17),
  -- other fields
);

-- Row-Level Security Policy
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON parts
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

**Tenant Configuration**:
- **Subdomain-based**: `{wrecker-name}.autopartsplatform.com.au`
- **Custom Domain Support**: Premium feature for enterprise tier
- **Tenant Settings**: Stored in `tenants` table with JSONB for flexible config

**Resource Allocation**:
- **Storage Quotas**: Enforced per tier (Basic: 10GB, Pro: 100GB, Enterprise: Unlimited)
- **API Rate Limiting**: Redis-based, per tenant (Basic: 1000/hour, Pro: 10000/hour)
- **Concurrent Users**: Configurable per subscription tier

---

## 3. Core Features Specification

### 3.1 User Roles and Permissions

**Role-Based Access Control (RBAC)**:

| Role | Permissions | Typical User |
|------|-------------|--------------|
| **Owner** | Full access, billing, user management | Business owner |
| **Admin** | All operations except billing | General manager |
| **Sales** | CRM, orders, quotes, limited inventory view | Sales staff |
| **Inventory** | Full inventory, vehicle processing, parts catalog | Yard workers |
| **Accountant** | Read-only, reports, export data | External accountant |
| **Customer** | Self-service portal, order history | End customers |

**Permission Matrix**:
```
Feature              | Owner | Admin | Sales | Inventory | Accountant | Customer
---------------------|-------|-------|-------|-----------|------------|----------
User Management      |   ✓   |   ✓   |   ✗   |     ✗     |     ✗      |    ✗
Billing & Subscription|  ✓   |   ✗   |   ✗   |     ✗     |     ✗      |    ✗
CRM (Full)           |   ✓   |   ✓   |   ✓   |     ✗     |     ✗      |    ✗
Create Orders        |   ✓   |   ✓   |   ✓   |     ✗     |     ✗      |    ✗
Inventory Management |   ✓   |   ✓   |   ○   |     ✓     |     ✗      |    ✗
Vehicle Processing   |   ✓   |   ✓   |   ✗   |     ✓     |     ✗      |    ✗
Pricing Management   |   ✓   |   ✓   |   ○   |     ✗     |     ✗      |    ✗
Reports              |   ✓   |   ✓   |   ○   |     ○     |     ✓      |    ○
Parts Search         |   ✓   |   ✓   |   ✓   |     ✓     |     ✗      |    ✓
Order Tracking       |   ✓   |   ✓   |   ✓   |     ✗     |     ✗      |    ✓

Legend: ✓ Full Access | ○ Read Only | ✗ No Access
```

### 3.2 Customer Management (CRM)

**Customer Types**:
1. **Individual Consumers** (B2C): Retail customers, DIY mechanics
2. **Business Customers** (B2B): Repair shops, dealerships, fleet managers

**CRM Features**:

**Customer Records**:
- Personal/business details with ABN validation
- Contact preferences (SMS, email, phone)
- Customer classification (retail, trade, wholesale)
- Credit terms for business customers
- Purchase history and lifetime value
- Communication history (calls, emails, SMS)
- Notes and custom fields

**Lead Management**:
- Capture leads from web inquiries, phone calls, walk-ins
- Lead scoring based on engagement and potential value
- Follow-up task automation
- Lead-to-customer conversion tracking

**Communication Tools**:
- **Email**: Template-based emails for quotes, orders, follow-ups
- **SMS**: Automated notifications via Twilio/MessageMedia
  - "Part available" notifications
  - Order status updates
  - Payment reminders
- **Phone Integration**: Click-to-call, call logging
- **Communication History**: Unified timeline of all interactions

**Customer Portal**:
- Self-service account management
- Order history and tracking
- Quote requests
- Parts search and availability
- Invoice downloads
- Warranty claims

### 3.3 Inventory Management System

**Vehicle Processing Workflow**:

```
Vehicle Arrival → Inspection → VIN Decode → Dismantling → Parts Cataloging → Storage Assignment → Publishing
```

**Step-by-Step Process**:

1. **Vehicle Intake**:
   - Record VIN (barcode scan or manual entry)
   - Auto-populate make, model, year, engine via VIN decoder
   - Document condition, odometer reading
   - Photo documentation (exterior, damage, unique features)
   - Assign vehicle ID and storage location

2. **VIN Decoding**:
   - Integration with Australian vehicle database (NEVDIS)
   - Extract: Make, model, year, body type, engine, transmission, market
   - Validate stolen vehicle status (optional NEVDIS check)
   - Generate parts compatibility matrix

3. **Dismantling Workflow**:
   - Guided dismantling checklist by vehicle type
   - Track dismantler/staff assignment
   - Real-time parts cataloging as removed
   - Hazardous materials flagging (airbags, fluids)
   - Update vehicle status (In Progress → Complete → Disposed)

4. **Parts Cataloging**:
   - **Core Fields**:
     - Part type (from standardized taxonomy)
     - Part number (OEM and aftermarket)
     - Condition grade (New, Excellent, Good, Fair, Poor)
     - Source vehicle (VIN linkage)
     - Warranty period (3, 6, 12 months)
     - Location (yard, row, bin, shelf)
     - Price (auto-suggested + manual override)
   
   - **Extended Attributes** (JSONB):
     - Color, material, specifications
     - Damage notes
     - Compatible vehicles (cross-reference)
     - Testing results (tested, working, needs repair)
   
   - **Photo Management**:
     - Multiple photos per part (up to 10)
     - Photo annotations for damage/condition
     - Automatic thumbnail generation
     - CDN delivery for fast loading

5. **Compatibility Engine**:
   - Automatic cross-vehicle compatibility
   - "Fits: 2015-2020 Toyota Hilux, 2016-2021 Fortuner"
   - Interchange part number matching
   - Similar parts suggestion

**Inventory Tracking**:
- Real-time stock levels
- Multi-location support (multiple yards)
- Reserved inventory during quotes/orders
- Automated low-stock alerts
- Inventory aging reports (identify slow-moving stock)
- Batch actions (price updates, location changes, bulk delete)

**Inventory Search**:
- **Quick Search**: Part name, part number, VIN
- **Advanced Filters**:
  - Vehicle (make, model, year range)
  - Part type/category
  - Condition grade
  - Price range
  - Location
  - Availability (in stock, reserved, sold)
  - Date added (last 7/30/90 days)
- **Search Results**: Grid/list view with thumbnails, quick actions

### 3.4 Parts Database and Search

**Parts Taxonomy** (Hierarchical):
```
1. Engine Components
   ├── 1.1 Complete Engines
   ├── 1.2 Cylinder Heads
   ├── 1.3 Engine Blocks
   └── ...
2. Transmission & Drivetrain
3. Suspension & Steering
4. Brakes
5. Electrical & Lighting
6. Body Panels
7. Interior Components
8. Glass & Mirrors
9. Cooling & HVAC
10. Fuel System
11. Exhaust System
12. Wheels & Tires
```

**Search Implementation**:
- **Primary**: Elasticsearch with faceted search
- **Fallback**: PostgreSQL full-text search
- **Search Features**:
  - Autocomplete (suggest part names, vehicles)
  - Fuzzy matching (handle typos)
  - Synonym handling ("bonnet" = "hood")
  - Relevance scoring (prioritize exact matches)
  - Search filters (sidebar with counts)
  - Saved searches for customers

**VIN Decoder Integration**:
- **Provider Options**:
  1. **NEVDIS API** (government database) - most accurate for Australian vehicles
  2. **Redbook API** (commercial) - includes valuation data
  3. **Open VIN databases** - fallback for imports

- **Functionality**:
  - Decode 17-character VIN
  - Extract vehicle specifications
  - Generate parts compatibility list
  - Flag if vehicle reported stolen (NEVDIS check)

### 3.5 Order Management

**Order Lifecycle**:
```
Quote → Order → Payment → Fulfillment → Shipping → Delivery → Warranty
```

**Quote Generation**:
- Add multiple parts to quote
- Apply customer-specific pricing (trade discounts)
- Shipping cost estimation (location-based)
- GST calculation (10%)
- Quote expiry dates (default 7 days)
- PDF generation with terms & conditions
- Email/SMS quote delivery
- Quote follow-up reminders (automated)

**Order Processing**:
- Convert quote to order
- Direct order creation (skip quote)
- Order confirmation to customer (email/SMS)
- Payment capture (online or mark as "Pay on Pickup")
- Inventory reservation (prevent overselling)
- Pick list generation for warehouse staff
- Order notes (internal and customer-visible)

**Payment Processing**:
- **Online Payments**:
  - Stripe integration (credit/debit cards)
  - Square integration (alternative)
  - Payment plans for large orders (Afterpay/Zip integration)
- **Offline Payments**:
  - Cash (mark as paid)
  - Bank transfer (record transaction reference)
  - EFTPOS (manual recording)
- **Payment Status**: Pending, Paid, Partially Paid, Refunded
- **Invoicing**: Auto-generate tax invoices (ATO compliant)

**Fulfillment & Shipping**:
- **Fulfillment Options**:
  - Customer pickup (specify location and hours)
  - Courier delivery (Australia Post, TNT, StarTrack)
  - Freight (for large items like engines)
- **Shipping Integration**:
  - Real-time rate calculation
  - Label generation
  - Tracking number capture
  - Tracking link to customer
  - Delivery confirmation
- **Packaging**:
  - Packaging notes for staff
  - Box size recommendations
  - Special handling flags (fragile, hazmat)

**Returns & Warranty**:
- Warranty tracking per part (3, 6, 12 months)
- Customer-initiated return requests
- Return authorization workflow
- Return reasons (defective, wrong part, changed mind)
- Restocking fee calculation (if applicable)
- Warranty claim documentation (photos, testing notes)
- Replacement or refund processing

### 3.6 Pricing Engine

**Pricing Strategies**:

1. **Cost-Plus Pricing**:
   - Base cost (vehicle purchase, dismantling labor)
   - Markup percentage (by part type, condition)
   - Minimum profit margin enforcement

2. **Market-Based Pricing**:
   - Competitor price tracking (manual entry or scraping)
   - Dynamic adjustment (match, undercut, or premium positioning)
   - Price alerts when competitors change prices

3. **Demand-Based Pricing**:
   - Track inquiry frequency per part type
   - Increase prices for high-demand, low-supply parts
   - Decrease prices for slow-moving inventory (>90 days)

4. **Customer Segment Pricing**:
   - Retail customers: Standard pricing
   - Trade customers: 10-20% discount
   - Wholesale customers: 20-30% discount
   - VIP customers: Custom pricing

**Pricing Rules Engine**:
```javascript
// Example pricing rule
{
  "rule_name": "Trade Customer Discount",
  "conditions": {
    "customer_type": "trade",
    "order_value": { "min": 500 }
  },
  "action": {
    "discount_type": "percentage",
    "discount_value": 15
  }
}
```

**Bulk Pricing**:
- Quantity discounts (e.g., 5+ items: 10% off)
- Package deals (e.g., "Complete Front Suspension Kit")
- Clearance pricing for old stock

**Price Management**:
- Bulk price updates (CSV import)
- Price history tracking
- Scheduled price changes
- Price approval workflows (for large discounts)

### 3.7 Supplier Management

**Supplier Types**:
1. **Vehicle Suppliers**: Auctions, insurance companies, private sellers
2. **Parts Suppliers**: New parts, aftermarket parts for resale

**Supplier Records**:
- Business details (ABN, ACN, contact info)
- Payment terms (net 7, 14, 30 days)
- Preferred contact method
- Performance metrics (quality, timeliness)
- Communication history

**Vehicle Procurement**:
- Vehicle purchase tracking
- Cost per vehicle
- Profitability analysis (revenue from parts vs. vehicle cost)
- Supplier performance (parts yield per vehicle)

**Parts Purchasing** (for resale):
- Purchase orders
- Receiving workflow
- Inventory integration (add to stock)
- Supplier invoicing

### 3.8 Communication & Automation

**Automated Notifications**:

| Event | Customer | Staff |
|-------|----------|-------|
| Quote created | Email/SMS with PDF | Dashboard notification |
| Quote expiring | Reminder email/SMS (2 days before) | Follow-up task created |
| Order confirmed | Confirmation email/SMS | Pick list generated |
| Payment received | Receipt email | Dashboard update |
| Order shipped | Tracking link SMS/Email | - |
| Part available (waitlist) | SMS/Email alert | - |
| Warranty expiring soon | Reminder email (30 days before) | - |

**Communication Channels**:
1. **Email** (SendGrid/AWS SES):
   - Transactional emails (orders, quotes)
   - Marketing emails (promotions, newsletters)
   - Template-based with dynamic content

2. **SMS** (Twilio/MessageMedia):
   - Time-sensitive notifications
   - Two-way SMS (customer can reply)
   - Delivery confirmations

3. **In-App Notifications**:
   - Real-time dashboard alerts
   - Push notifications (mobile app)

**Email/SMS Templates**:
- Pre-built templates for common scenarios
- Customizable per tenant (branding, messaging)
- Variable substitution (customer name, order details)
- Preview before sending

**Waitlist Management**:
- Customers request notification when part available
- Automatic alerts when matching part cataloged
- First-come, first-served priority
- Waitlist expiry (auto-remove after 30 days)

### 3.9 Reporting & Analytics

**Dashboard (Real-Time)**:
- Today's sales revenue
- Orders pending fulfillment
- Low stock alerts
- Top-selling parts (last 7 days)
- Customer inquiries waiting response
- Vehicles in processing

**Sales Reports**:
- Revenue by period (day, week, month, year)
- Revenue by part category
- Revenue by customer segment
- Sales by staff member
- Average order value trends
- Conversion rate (quotes → orders)

**Inventory Reports**:
- Current stock levels
- Inventory value
- Inventory aging (0-30, 31-60, 61-90, 90+ days)
- Stock turnover rate
- Parts by location
- Most/least profitable parts

**Customer Reports**:
- New customers per period
- Customer lifetime value
- Top customers by revenue
- Customer retention rate
- Geographic distribution

**Operational Reports**:
- Vehicles processed per month
- Parts cataloged per vehicle
- Dismantling time per vehicle
- Average time: quote → order
- Fulfillment time metrics

**Financial Reports**:
- Profit & loss summary
- GST report (BAS preparation)
- Outstanding invoices (accounts receivable)
- Payment method breakdown

**Export Options**:
- PDF (formatted reports)
- CSV (data analysis)
- Excel (formatted with charts)
- Schedule automated email delivery (weekly/monthly)

### 3.10 Mobile App Features

**iOS & Android Apps** (React Native):

**Yard Worker Mode**:
- Vehicle intake (scan VIN barcode)
- Photo capture (camera integration)
- Parts cataloging (voice-to-text notes)
- Location assignment (bin/shelf barcode scan)
- Offline mode (sync when online)

**Sales Mode**:
- Customer lookup
- Quick parts search
- On-the-spot quoting
- Order creation
- Payment processing (Square integration)

**Management Mode**:
- Dashboard metrics
- Approval workflows (discount approvals)
- Push notifications for urgent tasks

**Offline Capabilities**:
- Cache inventory data for search
- Queue actions for sync (add parts, update prices)
- Sync status indicator
- Conflict resolution (last-write-wins or manual merge)

---

## 4. Database Schema Design

### 4.1 Core Entities Overview

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Tenants   │──────<│    Users    │>──────│  Customers  │
└─────────────┘       └─────────────┘       └─────────────┘
                             │
                             │
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Suppliers  │       │  Vehicles   │──────<│    Parts    │
└─────────────┘       └─────────────┘       └─────────────┘
                             │                      │
                             │                      │
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Quotes    │>──────│    Orders   │>──────│ OrderItems  │
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │
       │                      │
┌─────────────┐       ┌─────────────┐
│  Payments   │       │  Shipments  │
└─────────────┘       └─────────────┘
```

### 4.2 Detailed Schema

**Tenants Table** (Multi-tenancy):
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  abn VARCHAR(11),
  acn VARCHAR(9),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  address JSONB,
  subscription_tier VARCHAR(50) NOT NULL, -- basic, pro, enterprise
  subscription_status VARCHAR(50) NOT NULL, -- trial, active, suspended, cancelled
  subscription_start_date TIMESTAMP NOT NULL,
  subscription_end_date TIMESTAMP,
  settings JSONB, -- tenant-specific configuration
  storage_quota_gb INTEGER NOT NULL DEFAULT 10,
  api_rate_limit INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_subscription_status ON tenants(subscription_status);
```

**Users Table**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL, -- owner, admin, sales, inventory, accountant
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
```

**Customers Table**:
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_type VARCHAR(50) NOT NULL, -- individual, business
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  business_name VARCHAR(255),
  abn VARCHAR(11),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  address JSONB,
  customer_classification VARCHAR(50), -- retail, trade, wholesale
  credit_limit DECIMAL(10, 2),
  payment_terms INTEGER, -- days
  preferred_contact VARCHAR(50), -- email, sms, phone
  notes TEXT,
  custom_fields JSONB,
  lifetime_value DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
```

**Vehicles Table**:
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vin VARCHAR(17) UNIQUE NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  body_type VARCHAR(50),
  engine VARCHAR(100),
  transmission VARCHAR(50),
  color VARCHAR(50),
  odometer INTEGER,
  acquisition_date DATE NOT NULL,
  acquisition_source VARCHAR(50), -- auction, insurance, private
  acquisition_cost DECIMAL(10, 2),
  vehicle_status VARCHAR(50) NOT NULL, -- pending, in_progress, completed, disposed
  storage_location VARCHAR(255),
  dismantler_user_id UUID REFERENCES users(id),
  disposal_date DATE,
  photos JSONB, -- array of photo URLs
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_status ON vehicles(vehicle_status);
```

**Parts Table**:
```sql
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  part_type VARCHAR(255) NOT NULL,
  part_category VARCHAR(100) NOT NULL, -- engine, transmission, body, etc.
  oem_part_number VARCHAR(100),
  aftermarket_part_number VARCHAR(100),
  description TEXT NOT NULL,
  condition_grade VARCHAR(50) NOT NULL, -- new, excellent, good, fair, poor
  warranty_months INTEGER NOT NULL DEFAULT 3,
  quantity INTEGER NOT NULL DEFAULT 1,
  location VARCHAR(255), -- yard location (row, bin, shelf)
  cost_price DECIMAL(10, 2),
  sell_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- available, reserved, sold, returned
  reserved_until TIMESTAMP,
  compatibility JSONB, -- array of compatible vehicles
  extended_attributes JSONB, -- color, material, specs, damage notes
  photos JSONB, -- array of photo URLs
  weight_kg DECIMAL(8, 2),
  dimensions JSONB, -- length, width, height in cm
  date_cataloged DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_tenant_id ON parts(tenant_id);
CREATE INDEX idx_parts_vehicle_id ON parts(vehicle_id);
CREATE INDEX idx_parts_category ON parts(part_category);
CREATE INDEX idx_parts_status ON parts(status);
CREATE INDEX idx_parts_part_type ON parts(part_type);
-- GIN index for JSONB search
CREATE INDEX idx_parts_compatibility ON parts USING GIN (compatibility);
```

**Quotes Table**:
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_user_id UUID REFERENCES users(id),
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- draft, sent, accepted, declined, expired, converted
  notes TEXT,
  terms_conditions TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_tenant_id ON quotes(tenant_id);
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
```

**Quote Items Table**:
```sql
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
```

**Orders Table**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sales_user_id UUID REFERENCES users(id),
  order_date TIMESTAMP NOT NULL DEFAULT NOW(),
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL, -- pending, paid, partially_paid, refunded
  fulfillment_status VARCHAR(50) NOT NULL, -- pending, picking, packed, shipped, delivered, pickup_ready, completed
  fulfillment_method VARCHAR(50) NOT NULL, -- pickup, courier, freight
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON orders(fulfillment_status);
```

**Order Items Table**:
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL,
  warranty_months INTEGER NOT NULL,
  warranty_expiry_date DATE NOT NULL,
  return_status VARCHAR(50), -- null, requested, approved, completed
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_part_id ON order_items(part_id);
```

**Payments Table**:
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id),
  payment_method VARCHAR(50) NOT NULL, -- card, cash, bank_transfer, eftpos
  payment_gateway VARCHAR(50), -- stripe, square
  transaction_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL, -- pending, completed, failed, refunded
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
```

**Shipments Table**:
```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id),
  carrier VARCHAR(100), -- australia_post, tnt, startrack
  tracking_number VARCHAR(255),
  shipping_label_url TEXT,
  shipped_date DATE,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_status VARCHAR(50), -- pending, in_transit, delivered, failed
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(20),
  delivery_address JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_tenant_id ON shipments(tenant_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
```

**Suppliers Table**:
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_type VARCHAR(50) NOT NULL, -- vehicle, parts
  business_name VARCHAR(255) NOT NULL,
  abn VARCHAR(11),
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  payment_terms INTEGER,
  notes TEXT,
  performance_rating DECIMAL(3, 2), -- 0.00 to 5.00
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);
```

**Communications Table** (Audit Trail):
```sql
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES users(id),
  communication_type VARCHAR(50) NOT NULL, -- email, sms, phone, in_app
  direction VARCHAR(50) NOT NULL, -- inbound, outbound
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(50), -- sent, delivered, failed, read
  related_entity_type VARCHAR(50), -- quote, order, part
  related_entity_id UUID,
  metadata JSONB, -- email_id, sms_id, etc.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_communications_tenant_id ON communications(tenant_id);
CREATE INDEX idx_communications_customer_id ON communications(customer_id);
CREATE INDEX idx_communications_created_at ON communications(created_at DESC);
```

**Audit Trail Table**:
```sql
CREATE TABLE audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(100) NOT NULL, -- part, order, customer, etc.
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- create, update, delete, status_change
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_trail_tenant_id ON audit_trail(tenant_id);
CREATE INDEX idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at DESC);
```

### 4.3 Data Relationships Summary

- **Tenants** → Users (1:many)
- **Tenants** → Customers (1:many)
- **Tenants** → Vehicles (1:many)
- **Tenants** → Parts (1:many)
- **Vehicles** → Parts (1:many)
- **Customers** → Quotes (1:many)
- **Quotes** → Quote Items (1:many)
- **Customers** → Orders (1:many)
- **Orders** → Order Items (1:many)
- **Orders** → Payments (1:many)
- **Orders** → Shipments (1:1)
- **Parts** → Order Items (1:many)

---

## 5. API Architecture

### 5.1 API Design Principles

**RESTful API Design**:
- Resource-based URLs
- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- JSON request/response format
- Consistent error responses
- API versioning (`/api/v1/...`)

**GraphQL for Complex Queries**:
- Single endpoint: `/graphql`
- Client specifies exact data needed
- Reduced over-fetching/under-fetching
- Real-time subscriptions (inventory updates)

### 5.2 Authentication & Authorization

**Authentication: JWT (JSON Web Tokens)**:
```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "securepass123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "refresh_token": "eyJhbGciOiJIUzI1...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Authorization: Role-Based Access Control (RBAC)**:
- JWT payload includes: `user_id`, `tenant_id`, `role`, `permissions`
- Middleware validates role/permissions for each endpoint
- Database Row-Level Security (RLS) enforces tenant isolation

**Session Management**:
- Access tokens: 1 hour expiry
- Refresh tokens: 30 days expiry
- Token rotation on refresh
- Device tracking (optional)

### 5.3 Core API Endpoints

**Authentication**:
```
POST   /api/v1/auth/login               # User login
POST   /api/v1/auth/logout              # User logout
POST   /api/v1/auth/refresh             # Refresh access token
POST   /api/v1/auth/forgot-password     # Password reset request
POST   /api/v1/auth/reset-password      # Password reset confirmation
```

**Users**:
```
GET    /api/v1/users                    # List users (admin only)
GET    /api/v1/users/:id                # Get user details
POST   /api/v1/users                    # Create user (admin only)
PATCH  /api/v1/users/:id                # Update user
DELETE /api/v1/users/:id                # Delete user (admin only)
```

**Customers**:
```
GET    /api/v1/customers                # List customers (paginated, filterable)
GET    /api/v1/customers/:id            # Get customer details
POST   /api/v1/customers                # Create customer
PATCH  /api/v1/customers/:id            # Update customer
DELETE /api/v1/customers/:id            # Delete customer
GET    /api/v1/customers/:id/orders     # Customer order history
GET    /api/v1/customers/:id/communications # Customer communication history
```

**Vehicles**:
```
GET    /api/v1/vehicles                 # List vehicles
GET    /api/v1/vehicles/:id             # Get vehicle details
POST   /api/v1/vehicles                 # Create vehicle
PATCH  /api/v1/vehicles/:id             # Update vehicle
DELETE /api/v1/vehicles/:id             # Delete vehicle
POST   /api/v1/vehicles/decode-vin      # VIN decoder
GET    /api/v1/vehicles/:id/parts       # Parts from vehicle
```

**Parts**:
```
GET    /api/v1/parts                    # List parts (paginated, advanced filtering)
GET    /api/v1/parts/:id                # Get part details
POST   /api/v1/parts                    # Create part
PATCH  /api/v1/parts/:id                # Update part
DELETE /api/v1/parts/:id                # Delete part
POST   /api/v1/parts/search             # Advanced parts search
POST   /api/v1/parts/bulk-update        # Bulk price/location updates
GET    /api/v1/parts/:id/compatibility  # Compatible vehicles
POST   /api/v1/parts/:id/photos         # Upload part photos
```

**Quotes**:
```
GET    /api/v1/quotes                   # List quotes
GET    /api/v1/quotes/:id               # Get quote details
POST   /api/v1/quotes                   # Create quote
PATCH  /api/v1/quotes/:id               # Update quote
DELETE /api/v1/quotes/:id               # Delete quote
POST   /api/v1/quotes/:id/convert       # Convert quote to order
POST   /api/v1/quotes/:id/send          # Send quote to customer (email/SMS)
GET    /api/v1/quotes/:id/pdf           # Generate PDF
```

**Orders**:
```
GET    /api/v1/orders                   # List orders
GET    /api/v1/orders/:id               # Get order details
POST   /api/v1/orders                   # Create order
PATCH  /api/v1/orders/:id               # Update order
POST   /api/v1/orders/:id/payments      # Record payment
POST   /api/v1/orders/:id/ship          # Create shipment
PATCH  /api/v1/orders/:id/status        # Update fulfillment status
GET    /api/v1/orders/:id/invoice       # Generate invoice PDF
```

**Payments**:
```
POST   /api/v1/payments/stripe/intent   # Create Stripe payment intent
POST   /api/v1/payments/stripe/webhook  # Stripe webhook
POST   /api/v1/payments/square/checkout # Square checkout
POST   /api/v1/payments/:id/refund      # Process refund
```

**Shipping**:
```
POST   /api/v1/shipping/calculate-rate  # Calculate shipping cost
POST   /api/v1/shipping/create-label    # Generate shipping label
POST   /api/v1/shipping/track           # Track shipment
```

**Reports**:
```
GET    /api/v1/reports/dashboard        # Dashboard metrics
GET    /api/v1/reports/sales            # Sales report (date range, filters)
GET    /api/v1/reports/inventory        # Inventory report
GET    /api/v1/reports/customers        # Customer report
POST   /api/v1/reports/export           # Export report (PDF/CSV/Excel)
```

**Suppliers**:
```
GET    /api/v1/suppliers                # List suppliers
GET    /api/v1/suppliers/:id            # Get supplier details
POST   /api/v1/suppliers                # Create supplier
PATCH  /api/v1/suppliers/:id            # Update supplier
DELETE /api/v1/suppliers/:id            # Delete supplier
```

**Communications**:
```
POST   /api/v1/communications/email     # Send email
POST   /api/v1/communications/sms       # Send SMS
GET    /api/v1/communications/history   # Communication history
POST   /api/v1/communications/templates # Manage templates
```

### 5.4 API Response Standards

**Success Response**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "part_type": "Engine",
    "description": "2.4L Petrol Engine"
  },
  "meta": {
    "timestamp": "2025-10-22T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**List Response (Paginated)**:
```json
{
  "success": true,
  "data": [
    { "id": "...", "..." },
    { "id": "...", "..." }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_items": 95
  },
  "meta": {
    "timestamp": "2025-10-22T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-22T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

**Error Codes**:
- `400` Bad Request - Validation errors
- `401` Unauthorized - Authentication required
- `403` Forbidden - Insufficient permissions
- `404` Not Found - Resource not found
- `409` Conflict - Resource already exists
- `422` Unprocessable Entity - Business logic error
- `429` Too Many Requests - Rate limit exceeded
- `500` Internal Server Error - Server error

### 5.5 Rate Limiting

**Implementation**: Redis-based token bucket algorithm

**Limits by Tier**:
- Basic: 1000 requests/hour
- Pro: 10,000 requests/hour
- Enterprise: 100,000 requests/hour

**Rate Limit Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1698000000
```

**Exceeded Response**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 3600
  }
}
```

---

## 6. Integration Requirements

### 6.1 Payment Gateways

**Primary: Stripe**
- **Features**: Credit/debit cards, payment intents API, webhooks
- **Integration**: Stripe.js (frontend), Stripe SDK (backend)
- **Compliance**: PCI DSS Level 1 (Stripe handles card data)
- **Fees**: 1.75% + $0.30 per transaction
- **Use Case**: Online payments, saved cards, subscriptions

**Secondary: Square**
- **Features**: In-person payments, invoicing, Square Reader integration
- **Integration**: Square SDK
- **Fees**: 1.6% for in-person, 1.9% + $0.30 online
- **Use Case**: EFTPOS terminal payments, mobile payments

**Implementation**:
```javascript
// Stripe Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 15000, // cents
  currency: 'aud',
  customer: customerId,
  metadata: { order_id: orderId }
});
```

### 6.2 Shipping Providers

**Australia Post API**:
- **Features**: Rate calculation, label generation, tracking
- **Integration**: Australia Post Shipping API
- **Services**: Express Post, Parcel Post, International
- **Use Case**: Small to medium parcels (parts)

**TNT/StarTrack**:
- **Features**: Freight services, dangerous goods (batteries)
- **Integration**: StarTrack API
- **Use Case**: Large items (engines, transmissions)

**Implementation Approach**:
- Multi-carrier rate comparison
- Auto-select cheapest/fastest based on user preference
- Label generation and printing
- Tracking updates via webhooks

### 6.3 Accounting Software

**Xero Integration**:
- **Features**: Invoice sync, customer sync, payment reconciliation
- **Integration**: Xero OAuth 2.0 API
- **Sync Direction**: Platform → Xero (one-way)
- **Entities**: Customers, Invoices, Payments

**MYOB Integration**:
- **Features**: Similar to Xero
- **Integration**: MYOB AccountRight API
- **Use Case**: Alternative for MYOB users

**Implementation**:
- OAuth 2.0 authentication
- Scheduled sync (daily or real-time)
- Mapping: Platform customers → Xero contacts
- Error handling and retry logic

### 6.4 Communication Services

**Email: SendGrid / AWS SES**:
- **Use Case**: Transactional emails (orders, quotes), marketing emails
- **Features**: Template engine, delivery tracking, bounce handling
- **Volume**: 100,000+ emails/month
- **Cost**: SendGrid ~$20/month for 40K emails, AWS SES $0.10 per 1000

**SMS: Twilio / MessageMedia**:
- **Use Case**: Order notifications, part availability alerts
- **Features**: Two-way SMS, delivery receipts, Australian numbers
- **Volume**: 10,000+ SMS/month
- **Cost**: Twilio ~$0.08/SMS in Australia, MessageMedia ~$0.06/SMS

**Phone: Twilio Voice**:
- **Use Case**: Click-to-call, call recording (compliance)
- **Features**: Call routing, IVR, voicemail

### 6.5 VIN Decoder

**NEVDIS (National Exchange of Vehicle and Driver Information System)**:
- **Provider**: Australian Government
- **Access**: Requires accreditation (fee-based)
- **Data**: VIN decode, stolen vehicle check, odometer history
- **Use Case**: Primary VIN decoder for Australian vehicles

**Redbook API**:
- **Provider**: Redbook (commercial)
- **Data**: Vehicle specifications, valuations, market data
- **Cost**: Subscription-based
- **Use Case**: Enhanced vehicle data, pricing insights

**Fallback: Open VIN Databases**:
- NHTSA (US), European VIN databases
- Free but less accurate for Australian vehicles

### 6.6 ABN Lookup

**ABN Lookup API** (Australian Government):
- **Integration**: ABR Web Services
- **Features**: Validate ABN/ACN, business name, GST registration status
- **Use Case**: Customer/supplier validation
- **Cost**: Free

**Implementation**:
```javascript
// ABN validation on customer creation
const abnDetails = await abnLookup.search(abn);
if (abnDetails.isValid) {
  customer.business_name = abnDetails.businessName;
  customer.gst_registered = abnDetails.gstRegistered;
}
```

---

## 7. Security & Compliance

### 7.1 Data Security

**Encryption**:
- **In Transit**: TLS 1.3 for all connections
- **At Rest**: 
  - Database: AWS RDS encryption (AES-256)
  - File Storage: S3 server-side encryption
  - Sensitive Fields: Application-level encryption (PII fields)

**Access Control**:
- **Authentication**: JWT with bcrypt password hashing (cost factor 12)
- **Authorization**: RBAC with granular permissions
- **Database**: PostgreSQL Row-Level Security (RLS)
- **API**: Role-based middleware, tenant isolation

**Secrets Management**:
- **AWS Secrets Manager**: API keys, database credentials
- **Environment Variables**: Never commit secrets to Git
- **Rotation**: Automatic key rotation every 90 days

**Audit Logging**:
- All CRUD operations logged to `audit_trail` table
- User actions: IP address, user agent, timestamp
- Retention: 7 years (compliance requirement)

### 7.2 Privacy Act 1988 Compliance

**Personal Information**:
- Collect only necessary data
- Clear privacy policy on website
- Consent for marketing communications

**Customer Rights**:
- **Access**: API endpoint to download all personal data (JSON export)
- **Correction**: Customers can update their own data
- **Deletion**: "Right to be forgotten" (anonymize customer data)

**Data Breach**:
- Notification process (within 72 hours)
- Incident response plan
- Logging and monitoring for suspicious activity

**Data Retention**:
- Customer data: 7 years (tax requirements)
- Audit logs: 7 years
- Marketing data: Until consent withdrawn

### 7.3 Australian Consumer Law (ACL)

**Consumer Guarantees**:
- Display warranty periods clearly
- Track warranty expiry dates
- Automated warranty expiry reminders

**Refunds & Returns**:
- Clear return policy (14 days for change of mind)
- Return workflow in system
- Automatic refund processing

**Product Safety**:
- Flag recalled parts (integration with ACCC recalls database)
- Notify customers if recalled part was sold

### 7.4 GST Compliance

**GST Calculation**:
- Automatic 10% GST on all sales
- GST-exclusive pricing display for businesses
- GST breakdown on invoices

**Tax Invoices**:
- Include ABN, GST amount, total
- Sequential invoice numbering
- PDF generation with all required fields

**BAS Reporting**:
- GST report export (CSV)
- Integration with Xero/MYOB for auto-BAS

### 7.5 Vulnerability Management

**Security Best Practices**:
- Regular dependency updates (npm audit, Snyk)
- OWASP Top 10 mitigation:
  - SQL Injection: Parameterized queries
  - XSS: Content Security Policy, input sanitization
  - CSRF: CSRF tokens on forms
  - Auth: Bcrypt, rate limiting on login
- Penetration testing (annually)

**Infrastructure Security**:
- AWS Security Groups (firewall rules)
- Private subnets for databases
- VPC isolation per environment (dev, staging, prod)
- AWS GuardDuty for threat detection

**Backup & Recovery**:
- Database: Daily automated backups (30-day retention)
- Point-in-time recovery (last 7 days)
- Cross-region backup replication
- Disaster recovery plan (RTO: 4 hours, RPO: 1 hour)

---

## 8. Subscription Model & Pricing

### 8.1 Tiered Subscription Plans

| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|------------|
| **Price** | $99/month | $299/month | $799/month |
| **Users** | 3 | 10 | Unlimited |
| **Vehicles/Month** | 20 | 100 | Unlimited |
| **Parts Inventory** | 1,000 | 10,000 | Unlimited |
| **Storage** | 10 GB | 100 GB | Unlimited |
| **Locations** | 1 | 3 | Unlimited |
| **API Calls/Hour** | 1,000 | 10,000 | 100,000 |
| **Customer Portal** | ✓ | ✓ | ✓ |
| **Mobile App** | ✓ | ✓ | ✓ |
| **Email Support** | ✓ | ✓ | ✓ |
| **Phone Support** | ✗ | ✓ | ✓ (Priority) |
| **VIN Decoder** | ✓ | ✓ | ✓ |
| **Advanced Reports** | ✗ | ✓ | ✓ |
| **Accounting Integration** | ✗ | ✓ (Xero) | ✓ (Xero + MYOB) |
| **White Label** | ✗ | ✗ | ✓ (Custom Domain) |
| **Dedicated Support** | ✗ | ✗ | ✓ (Account Manager) |

### 8.2 Additional Features (Add-Ons)

| Add-On | Price | Description |
|--------|-------|-------------|
| **Extra Users** | $15/user/month | Beyond plan limit |
| **Extra Storage** | $10/10GB/month | Beyond plan limit |
| **SMS Credits** | $50/1000 SMS | Australian SMS delivery |
| **Priority Support** | $99/month | 1-hour response time |
| **Custom Integrations** | Custom quote | API integration development |
| **Training & Onboarding** | $500 one-time | 4-hour training session |

### 8.3 Trial & Onboarding

**Free Trial**:
- 14-day free trial (no credit card required)
- Full Pro plan features during trial
- Automated email reminders (7 days, 1 day before expiry)
- Easy upgrade to paid plan

**Onboarding Process**:
1. **Sign Up**: Email, business name, subdomain selection
2. **Initial Setup**: Add first user, set timezone/currency
3. **Guided Tour**: Interactive walkthrough of key features
4. **Sample Data**: Option to load sample vehicles/parts
5. **First Tasks**: Checklist (add vehicle, create part, create customer)

### 8.4 Billing & Payment

**Payment Methods**:
- Credit/debit card (via Stripe)
- Direct debit (for annual plans)

**Billing Cycle**:
- Monthly or annual (annual = 2 months free discount)
- Auto-renewal with 7-day advance notice
- Grace period: 7 days after failed payment before suspension

**Invoicing**:
- Automatic invoice generation
- Email delivery
- GST-inclusive pricing for Australian customers

**Cancellation**:
- Cancel anytime (no lock-in contracts)
- Access until end of billing period
- Data export option before account closure
- Data retention: 90 days after cancellation

### 8.5 Revenue Projections (Year 1)

**Assumptions**:
- 200 wreckers in Australia actively seeking solutions
- 10% conversion in Year 1 (20 customers)
- Average plan: Pro ($299/month)

**Monthly Revenue**:
- 20 customers × $299 = $5,980/month

**Annual Revenue** (Year 1):
- $71,760 (ramping up throughout year)
- Add-ons: ~$10,000
- **Total**: ~$80,000

**Year 2-3 Projections**:
- 60 customers by end of Year 2 → $215K annual revenue
- 150 customers by end of Year 3 → $538K annual revenue

---

## 9. Development Phases & Timeline

### 9.1 Phase 1: Foundation & MVP (Months 1-3)

**Month 1: Infrastructure Setup**
- [ ] AWS account setup and configuration
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Database schema implementation
- [ ] Authentication system (JWT, RBAC)
- [ ] Multi-tenant architecture foundation
- [ ] Basic API framework (Express.js)
- [ ] Frontend boilerplate (React + TypeScript)

**Month 2: Core Inventory Features**
- [ ] Vehicle management (CRUD)
- [ ] VIN decoder integration (basic)
- [ ] Parts management (CRUD)
- [ ] Photo upload (S3 integration)
- [ ] Basic parts search
- [ ] Location management
- [ ] Inventory dashboard

**Month 3: Order Management Basics**
- [ ] Customer management (CRUD)
- [ ] Quote generation
- [ ] Order creation
- [ ] Basic payment recording (manual)
- [ ] Order status tracking
- [ ] Simple reports (sales, inventory)

**Deliverables**:
- Working MVP with inventory and order management
- Admin web app (React)
- Basic API documentation
- Deployment to staging environment

### 9.2 Phase 2: Automation & Customer Portal (Months 4-6)

**Month 4: Customer Portal**
- [ ] Customer registration and login
- [ ] Parts search (customer-facing)
- [ ] Quote request functionality
- [ ] Order history
- [ ] Self-service profile management

**Month 5: Communication & Automation**
- [ ] Email integration (SendGrid)
- [ ] SMS integration (Twilio)
- [ ] Email/SMS templates
- [ ] Automated notifications (order confirmations, shipping)
- [ ] Waitlist functionality

**Month 6: Payment Integration**
- [ ] Stripe integration (payment intents)
- [ ] Online checkout flow
- [ ] Payment webhooks
- [ ] Refund processing
- [ ] Invoice PDF generation

**Deliverables**:
- Customer portal (public-facing)
- Automated communications
- Online payment processing
- Closed beta with 3-5 pilot customers

### 9.3 Phase 3: Advanced Features & Mobile (Months 7-9)

**Month 7: Advanced Inventory**
- [ ] Parts compatibility engine
- [ ] Advanced search (Elasticsearch)
- [ ] Bulk operations (price updates, location changes)
- [ ] Inventory aging reports
- [ ] Low stock alerts

**Month 8: Mobile App Development**
- [ ] React Native app setup
- [ ] Vehicle intake (barcode scanning)
- [ ] Parts cataloging (camera integration)
- [ ] Offline mode (local storage + sync)
- [ ] Push notifications

**Month 9: Integrations**
- [ ] Shipping API integration (Australia Post)
- [ ] Accounting integration (Xero)
- [ ] ABN lookup integration
- [ ] NEVDIS VIN decoder (if accreditation obtained)

**Deliverables**:
- Mobile app (iOS + Android beta)
- Third-party integrations
- Advanced inventory features
- 10+ paying customers

### 9.4 Phase 4: Polish & Launch (Months 10-12)

**Month 10: Supplier & Advanced CRM**
- [ ] Supplier management
- [ ] Vehicle procurement tracking
- [ ] Lead management
- [ ] Communication history timeline
- [ ] Advanced customer segmentation

**Month 11: Reporting & Analytics**
- [ ] Comprehensive dashboard
- [ ] Advanced reports (profitability, customer LTV)
- [ ] Report scheduling and email delivery
- [ ] Export functionality (PDF, CSV, Excel)
- [ ] Data visualization (charts, graphs)

**Month 12: Final Polish & Launch**
- [ ] Performance optimization
- [ ] Security audit and penetration testing
- [ ] User acceptance testing (UAT)
- [ ] Documentation (user guide, API docs)
- [ ] Marketing website
- [ ] Public launch

**Deliverables**:
- Production-ready platform
- Mobile apps in App Store / Play Store
- Marketing website
- 25+ paying customers
- Break-even on development costs

### 9.5 Post-Launch Roadmap (Year 2)

**Q1 (Months 13-15)**:
- White-label features (custom domains, branding)
- Multi-language support
- Advanced pricing engine (AI-based suggestions)
- Marketplace features (sell on other platforms)

**Q2 (Months 16-18)**:
- MYOB integration
- Square integration
- Parts interchange database expansion
- Customer loyalty program

**Q3-Q4 (Months 19-24)**:
- Machine learning for demand forecasting
- IoT integration (barcode printers, scanners)
- API for third-party developers
- Franchise management features

---

## 10. Scalability & Performance

### 10.1 Performance Targets

**Response Times**:
- API endpoints: <200ms (p95)
- Page load time: <2 seconds
- Search results: <500ms
- Image loading: <1 second (CDN cached)

**Throughput**:
- 1000 concurrent users
- 10,000 requests/minute
- 100,000 parts searchable

**Database**:
- Read queries: <50ms
- Write queries: <100ms
- Full-text search: <200ms

### 10.2 Scaling Strategy

**Horizontal Scaling**:
- **Application Layer**: Auto-scaling ECS tasks (CPU >70% → add instance)
- **Database**: Read replicas for reporting queries
- **Cache**: Redis cluster for high availability
- **Search**: Elasticsearch cluster (3+ nodes)

**Vertical Scaling**:
- Database: Start with db.t3.medium, scale to db.m5.large+ as needed
- Cache: Start with cache.t3.micro, scale to cache.m5.large+

**Content Delivery**:
- CloudFront CDN for images and static assets
- Edge caching for parts search results
- Gzip compression for API responses

**Database Optimization**:
- Proper indexing (see schema design)
- Query optimization (EXPLAIN ANALYZE)
- Connection pooling (PgBouncer)
- Partitioning large tables (orders, audit_trail by date)

### 10.3 Monitoring & Alerting

**Metrics to Track**:
- Application: Response times, error rates, throughput
- Infrastructure: CPU, memory, disk usage, network
- Database: Query performance, connection count, slow queries
- Business: Daily active users, orders created, revenue

**Tools**:
- **AWS CloudWatch**: Infrastructure metrics, log aggregation
- **Application Performance Monitoring (APM)**: New Relic or Datadog
- **Error Tracking**: Sentry for exception tracking
- **Uptime Monitoring**: Pingdom or UptimeRobot

**Alerting**:
- Critical: Page outage, database unreachable, payment gateway down
- Warning: High error rate (>5%), slow queries (>1s), disk space low
- Info: Successful deployments, scheduled task completions

### 10.4 Load Testing

**Pre-Launch Testing**:
- Load test with 1000 concurrent users (Apache JMeter or k6)
- Stress test to identify breaking point
- Soak test (sustained load for 24 hours)
- Spike test (sudden traffic surge)

**Ongoing Testing**:
- Quarterly load tests
- Before major releases
- After infrastructure changes

---

## 11. Risk Analysis

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **VIN decoder API unavailable** | Medium | High | Implement fallback to open databases, cache decoded VINs |
| **Payment gateway outage** | Low | High | Support multiple gateways, offline payment recording |
| **Database performance degradation** | Medium | High | Proper indexing, read replicas, query optimization |
| **Mobile app approval delays** | Medium | Medium | Submit early, follow store guidelines strictly |
| **Data breach** | Low | Critical | Security audits, encryption, compliance monitoring |
| **Third-party API changes** | Medium | Medium | Version pinning, test webhooks, maintain fallbacks |

### 11.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Low customer adoption** | Medium | High | Pilot program, customer feedback, iterative improvement |
| **Competitor launches similar product** | Medium | Medium | Focus on Australian market, superior support, fair pricing |
| **Economic downturn** | Low | Medium | Flexible pricing, focus on ROI, cost-saving features |
| **Scope creep** | High | Medium | Phased approach, MVP first, feature prioritization |
| **Development delays** | Medium | Medium | Buffer time in timeline, outsource if needed |
| **Budget overrun** | Medium | High | Fixed-price contracts, milestone-based payments, cost tracking |

### 11.3 Regulatory Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Privacy Act changes** | Low | Medium | Regular compliance reviews, flexible architecture |
| **ACL interpretation disputes** | Low | Medium | Legal consultation, clear terms & conditions |
| **GST law changes** | Low | Medium | Configurable tax rates, accounting integration |
| **NEVDIS access revoked** | Low | High | Multiple VIN decoder sources, open databases |

---

## 12. Success Metrics

### 12.1 Product Metrics

**Adoption**:
- Number of active tenants
- Monthly active users (MAU)
- Feature adoption rate (% using each feature)

**Engagement**:
- Daily active users (DAU) / MAU ratio
- Session duration
- Parts cataloged per week
- Orders created per week

**Performance**:
- System uptime (target: 99.9%)
- API response times (target: <200ms p95)
- Customer support ticket volume (target: <5% of users)

### 12.2 Business Metrics

**Revenue**:
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (LTV)

**Growth**:
- New customer acquisition rate
- Churn rate (target: <5% monthly)
- Upgrade rate (Basic → Pro → Enterprise)
- Referral rate

**Efficiency**:
- Customer Acquisition Cost (CAC)
- LTV:CAC ratio (target: >3:1)
- Time to break-even per customer

### 12.3 Customer Success Metrics

**Satisfaction**:
- Net Promoter Score (NPS) (target: >50)
- Customer Satisfaction Score (CSAT) (target: >4.5/5)
- Support ticket resolution time (target: <24 hours)

**Retention**:
- 12-month retention rate (target: >80%)
- Feature usage breadth (% using 5+ features)

**Value Delivered**:
- Time saved per week (customer survey)
- Revenue increase (customer survey)
- Inquiry response time improvement

---

## 13. Next Steps

### 13.1 Immediate Actions (Pre-Development)

**Week 1-2: Requirements Validation**
- [ ] Conduct customer interviews (5-10 wreckers)
- [ ] Validate pain points and priorities
- [ ] Refine feature set based on feedback
- [ ] Get pricing feedback (willingness to pay)

**Week 3-4: Team Assembly**
- [ ] Hire/contract development team:
  - 1 Full-stack developer (React + Node.js)
  - 1 Backend developer (Node.js + PostgreSQL)
  - 1 Mobile developer (React Native)
  - 1 UI/UX designer
  - 1 Project manager / Product owner
- [ ] Set up collaboration tools (GitHub, Slack, Jira)

**Week 5-6: Technical Setup**
- [ ] AWS account setup and IAM configuration
- [ ] Domain registration (autopartsplatform.com.au)
- [ ] Development environment setup
- [ ] CI/CD pipeline configuration
- [ ] Choose third-party services (Stripe, SendGrid, Twilio)

### 13.2 Pilot Program (Month 4-6)

**Pilot Goals**:
- Validate product-market fit
- Identify bugs and usability issues
- Gather feature requests
- Refine onboarding process

**Pilot Recruitment**:
- 5-10 small to medium wreckers
- Geographic diversity (NSW, VIC, QLD)
- Mix of tech-savvy and traditional operators

**Pilot Incentives**:
- Free access for 6 months
- Direct input on feature roadmap
- Case study participation (optional)
- Lifetime discount (50% off)

### 13.3 Go-to-Market Strategy

**Launch Plan**:
1. **Pre-Launch (Month 10-11)**:
   - Build email list (landing page, content marketing)
   - Create demo videos
   - Prepare sales materials
   - Launch marketing website

2. **Soft Launch (Month 12)**:
   - Invite-only access (pilot customers + referrals)
   - Gradual onboarding (5 new customers/week)
   - Monitor performance and support load

3. **Public Launch (Month 13)**:
   - Open registration
   - PR campaign (industry publications, trade shows)
   - Paid advertising (Google Ads, Facebook)
   - Partner with industry associations

**Marketing Channels**:
- **Content Marketing**: Blog (SEO), YouTube tutorials
- **Industry Events**: Auto recycling trade shows, AAAA conferences
- **Partnerships**: Parts supplier partnerships, industry associations
- **Direct Sales**: Outreach to large wrecker chains
- **Referral Program**: $100 credit per referral

### 13.4 Long-Term Vision (3-5 Years)

**Expansion Opportunities**:
1. **Geographic**: New Zealand, UK (right-hand drive markets)
2. **Vertical**: Expand to other vehicle types (trucks, motorcycles, boats)
3. **Horizontal**: Fleet management, repair shop management
4. **Marketplace**: National parts marketplace connecting all wreckers
5. **Data Products**: Market insights, pricing intelligence

**Exit Strategy Options**:
- Acquisition by automotive software company
- Acquisition by large wrecker chain
- IPO (if growth exceptional)
- Continue as profitable SaaS business

---

## 14. Conclusion

This architecture document provides a comprehensive blueprint for building a production-ready, scalable B2B SaaS platform tailored specifically for the Australian second-hand auto parts industry. The design emphasizes:

1. **Australian Market Focus**: Compliance with local regulations, integration with Australian services (NEVDIS, ABN lookup, Australia Post, Xero)

2. **Practical Automation**: Reducing manual data entry through VIN decoding, automated communications, and streamlined workflows

3. **Affordable Accessibility**: Tiered pricing starting at $99/month makes it accessible to small family-run wreckers while offering enterprise features for larger operations

4. **Modern Architecture**: Multi-tenant SaaS design with React/React Native frontend and Node.js backend enables scalability from 1 to 1000+ customers

5. **Phased Rollout**: 9-12 month development timeline with clear milestones and pilot program validates product-market fit before full launch

**Key Success Factors**:
- Deep understanding of wrecker business workflows
- Excellent customer onboarding and support
- Continuous iteration based on customer feedback
- Reliable, performant platform (99.9% uptime)
- Fair, transparent pricing with no lock-in contracts

**Investment Required**:
- Development: $150K-$200K (team of 4-5 for 12 months)
- Infrastructure: $5K-$10K (Year 1)
- Marketing: $20K-$30K (Year 1)
- **Total**: $175K-$240K

**Expected Return**:
- Break-even: 15-18 months
- Year 3 Revenue: $500K+ with 150 customers
- Profitability: 40-50% margins at scale

This platform has the potential to transform the Australian auto wrecking industry by bringing modern technology to a traditionally manual-intensive business, improving efficiency, customer satisfaction, and profitability for operators of all sizes.

**Recommended Next Steps**:
1. Validate this architecture with 5-10 target customers (customer interviews)
2. Assemble development team
3. Begin Phase 1 development (Foundation & MVP)
4. Launch pilot program in Month 4

---

**Document Version**: 1.0  
**Date**: October 22, 2025  
**Prepared For**: Australian Auto Parts Sales Automation Platform  
**Status**: Ready for Implementation