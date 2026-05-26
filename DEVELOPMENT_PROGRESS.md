# Australian Auto Parts Platform — Development Progress

> **Last Updated:** 2026-05-26 (Orchestrator heartbeat @ 15:01 UTC)
> **Status: Full stack complete. 4 stress tests passed. Ready for ST#5 or production decision.**

---

## Architecture Overview

| Layer | Technology | Status |
|-------|-----------|--------|
| Backend API | Node.js + Express + TypeScript + Prisma | ✅ Production-hardened |
| Database | PostgreSQL 16 (Docker) | ✅ Running |
| Cache | Redis 7 (Docker) | ✅ Running |
| Frontend Web | React 19 + TypeScript + Material-UI + Redux Toolkit | ✅ Complete |
| Mobile App | Expo React Native (TypeScript) | ✅ Complete — committed da77d4f..5c49d8d |
| Container | Docker Compose (4 services) | ✅ Dev stack running |

---

## Backend — Complete Feature Set

### API Routes
- `auth.routes.ts` — JWT login/register/logout/refresh, role guards
- `parts.routes.ts` — Full CRUD, image upload, pricing/margin
- `vehicle.routes.ts` — VIN intake, vehicle management
- `customers.routes.ts` — Customer CRUD + search
- `orders.routes.ts` — Order lifecycle (PENDING→PROCESSING→SHIPPED→DELIVERED)
- `quotes.routes.ts` — Quote generation from cart
- `analytics.routes.ts` — Dashboard KPIs (revenue, sales, inventory, customers)
- `search.routes.ts` — Global search across parts/vehicles/customers
- `tenants.routes.ts` — Multi-tenant management
- `users.routes.ts` — User management (ADMIN/MANAGER/STAFF roles)
- `payments.routes.ts` — Payment gateway hooks
- `messages.routes.ts` — Internal messaging

### Security (post ST#1–4 hardening)
- JWT access tokens (1h) + refresh tokens (30d) with rotation
- Global refresh mutex — concurrent 401s no longer race (ST#4 RED#1)
- `authorize(ADMIN, MANAGER)` on all mutating endpoints — `PUT /:id` unprotected gap closed (ST#3)
- Role-change guards: cannot self-change role; only ADMIN can assign ADMIN
- `VITE_API_BASE_URL` normalized — no more split-API silent failure (ST#2)
- Rate limiting by subscription tier
- Audit logging

---

## Frontend Web — Complete Feature Set (24 Pages)

| Page | Feature |
|------|---------|
| LoginPage / RegisterPage | Auth flow |
| DashboardPage | Live analytics KPIs |
| PartsPage | Inventory list + CRUD |
| ProductDetailPage | Part detail + pricing |
| CustomersPage / CustomerDetailPage | Customer management |
| VehiclesPage / VehicleDetailPage | Vehicle intake + history |
| OrdersPage / OrderDetailPage | Order processing |
| QuotesPage / QuoteDetailPage | Quote management |
| SearchPage / SearchResultsPage | Global parts search |
| MarketplacePage | Browse catalogue (category from Redux store) |
| AnalyticsPage / ReportsPage | Business intelligence |
| MessagesPage | Internal messaging |
| UsersPage | User management (admin) |
| HomePage / FavoritesPage | Landing + saved items |
| ProfilePage | User profile |

**Redux Slices:** auth, parts, vehicles, customers, orders, quotes, analytics, users, search, sync

---

## Mobile App — Complete Feature Set

**Expo React Native app** — three operational modes:

### 🏭 Yard Mode (`app/yard/`)
- VIN barcode scanner (camera)
- Vehicle intake form
- Add-part flow: camera capture, pricing, margin calculator
- Offline-first with sync queue

### 💼 Sales Mode (`app/sales/`)
- Live parts search with debounced customer search + AbortController (ST#4 YELLOW#8)
- Cart: add/remove/setQuantity with out-of-stock gating
- Quote creation → `POST /api/v1/quotes` → success modal with quote number
- Customer search error state + Retry button

### 📊 Management Mode (`app/management/`)
- 6 live KPI cards wired to `GET /api/v1/analytics/dashboard`:
  - Parts in Stock, Today's Orders, Today's Revenue
  - Active Customers, Avg Order Value, Out of Stock
- Unified error banner (analytics + pendingCount failures) — ST#4 YELLOW#7
- Pull-to-refresh, top-3 categories, last-updated timestamp, warning colours

### Auth
- JWT with SecureStore persistence
- Global refresh mutex — no concurrent 401 race (ST#4 RED#1)
- logoutThunk dispatched on refresh fail (ST#4 ORANGE#5)

### Offline Sync
- Background sync queue persisted to expo-file-system (ST#4 ORANGE#3)
- isSyncing mutex — no duplicate writes on concurrent sync triggers (ST#4 ORANGE#4)

### Mobile Git
- Committed at HEAD: `5c49d8d`
- Mobile repo: subdirectory `/mobile/` (no GitHub remote yet — awaiting Shayne decision)

---

## Stress Test History

| Test | Date | Result |
|------|------|--------|
| ST#1 | 2026-05-25 | Various early findings — resolved |
| ST#2 | 2026-05-25 | Several API/security gaps — resolved |
| ST#3 | 2026-05-25 | Unprotected PUT /users/:id + other — resolved |
| ST#4 | 2026-05-26 | 2 RED + 3 ORANGE + 3 YELLOW — **all 8 resolved** |

### ST#4 Findings (all resolved as of 2026-05-26 13:01 UTC)

| # | Severity | Finding | Fix Commit |
|---|----------|---------|-----------|
| 1 | 🔴 RED | Concurrent 401 refresh race → silent logout | `8e500dd` |
| 2 | 🔴 RED | Dead pendingCount decrement (Immer proxy bug) | `8e500dd` |
| 3 | 🟠 ORANGE | Volatile sync queue (crash = lost offline ops) | `cff19cf` |
| 4 | 🟠 ORANGE | Concurrent sync → duplicate writes | `cff19cf` |
| 5 | 🟠 ORANGE | Silent logout — no dispatch on refresh fail | `cff19cf` |
| 6 | 🟡 YELLOW | quotesSlice dead `?? 20` limit fallback | `4f01310` |
| 7 | 🟡 YELLOW | ManagementScreen split KPI fetch, silent failure | `4f01310` |
| 8 | 🟡 YELLOW | Cart local state search — unmount race + no error UX | `4f01310` |

---

## Infrastructure

- **Docker Compose (dev):** 4 containers — backend (ts-node-dev :3000), frontend (Vite :5173), PostgreSQL 16, Redis 7
- **Server:** MiniPC Pi at 192.168.0.133 / Tailscale 100.66.254.52
- **NVMe:** 457GB total, 19% used — VS-Projects + .openclaw live here (plenty of room)
- **Root overlay:** 54GB, 74% — stable, no emergency

---

## Pending Decisions (Shayne)

1. **Mobile GitHub repo** — Should mobile app get its own private GitHub remote?
2. **Stress Test #5** — Awaiting devils-advocate to initiate
3. **Production deployment** — Docker prod config ready in `DOCKER_DEPLOYMENT.md`
4. **Snap cleanup** — Firefox + GNOME stack on headless Pi (~3GB); `sudo snap remove firefox gnome-42-2204 gnome-46-2404 gtk-common-themes mesa-2404`
5. **Journal vacuum** — `journalctl --vacuum-size=50M` (currently 253MB)
6. **Ollama** — 3.5GB CUDA libs installed but no models loaded; remove if not needed

---

## Quick Reference

```bash
# Start the stack
cd /home/pi/VS-Projects/gaming/aus-auto-parts-platform
docker-compose up -d

# Check status
docker ps

# Backend logs
docker logs aus-auto-parts-backend-dev -f

# Access
# Web:     http://100.66.254.52:5173
# API:     http://100.66.254.52:3000/api/v1

# Git log
git log --oneline -10
```
