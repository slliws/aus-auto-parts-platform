# Australian Auto Parts Platform — Next Steps

> **Last Updated:** 2026-05-26 (Orchestrator heartbeat @ 15:01 UTC)
> **Current State:** Full stack complete, 4 stress tests passed, all findings resolved.

---

## ✅ Where We Are Now

The platform is **feature-complete and security-hardened** across:
- **Backend API** — 12 route modules, JWT auth, role guards, audit logging, rate limiting
- **Frontend Web** — 24 pages, full Redux state, all screens wired to live API
- **Mobile App** — 3 operational modes (Yard/Sales/Management), offline sync, barcode scanner
- **Infrastructure** — Docker Compose dev stack running (backend + frontend + PostgreSQL + Redis)
- **Security** — 4 stress tests passed; all RED/ORANGE/YELLOW findings resolved

---

## 🎯 Immediate Decisions Required

### 1. Stress Test #5 (devils-advocate)
- All ST#4 items cleared as of 2026-05-26 13:01 UTC
- Platform is clean — ready for adversarial review
- **Action:** Shayne to trigger ST#5, or decide platform is production-ready

### 2. Mobile GitHub Remote
- Mobile app is committed locally at `5c49d8d` (subdirectory `/mobile/`)
- No remote GitHub repo yet
- **Options:**
  - A) Monorepo: keep mobile inside parent repo (already working this way)
  - B) Separate private repo: fork out `/mobile/` to its own GitHub remote
- **Action:** Shayne to decide

### 3. Production Deployment
- Docker prod config exists in `DOCKER_DEPLOYMENT.md`
- Dev stack currently running on MiniPC (192.168.0.133 / Tailscale 100.66.254.52)
- Backend running on ts-node-dev (dev mode) — needs `npm run build` + `node dist/` for prod
- **Action:** When ready, follow `DOCKER_DEPLOYMENT.md` for prod hardening

---

## 📋 Backlog (No Blockers — Can Start Anytime)

### Testing Coverage
- No unit tests written yet
- No integration tests
- No E2E tests (Cypress/Playwright)
- Target: 80% coverage for backend services + controllers

### Email Integration
- Email verification and password reset return tokens but don't send emails
- Need to wire SendGrid (or Resend.com — simpler API, free tier)
- `backend/src/services/email.service.ts` — stub exists, needs implementation

### PDF Invoice Generation
- Quote → invoice → PDF export
- Recommend: `pdfkit` or `puppeteer` for backend PDF generation
- Frontend: download button on QuoteDetailPage / OrderDetailPage

### Payment Gateway
- `payments.routes.ts` exists with hooks
- Not connected to a real payment processor
- Options: Stripe (international), Pin Payments (AU-focused)

### VIN Decoder (Real)
- Currently mock VIN decode
- Connect to NHTSA API (free, US/global) or PPSR (Australian for compliance)

### Push Notifications (Mobile)
- Expo Notifications API already available in the project
- Use case: order status updates, sync conflict alerts, low stock alerts

---

## 🔧 Infrastructure Housekeeping (Optional — Shayne to decide)

| Item | Command | Benefit |
|------|---------|---------|
| Remove snap Firefox/GNOME | `sudo snap remove firefox gnome-42-2204 gnome-46-2404 gtk-common-themes mesa-2404` | ~3GB freed from root overlay |
| Vacuum journal | `sudo journalctl --vacuum-size=50M` | ~200MB freed |
| Remove Ollama (if unused) | `sudo snap remove ollama` or uninstall | ~3.5GB freed |

Root overlay is at 74% (14GB free) — no emergency, but above steps would take it back below 65%.

---

## 🚀 Production Checklist (When Ready)

- [ ] ST#5 complete (or explicitly waived)
- [ ] Mobile GitHub remote decision made
- [ ] Backend: switch from ts-node-dev → compiled production build
- [ ] Secrets rotation: generate new JWT_SECRET + DATABASE_URL for prod
- [ ] SSL/TLS: Nginx reverse proxy + Let's Encrypt (or Tailscale HTTPS)
- [ ] Email service: SendGrid/Resend wired up
- [ ] Prod database: PostgreSQL with regular pg_dump backups
- [ ] Monitoring: basic uptime alerting (UptimeRobot or similar)
- [ ] Mobile: publish to Expo EAS or build APK for direct install

---

## 📚 Key Files Reference

```
/home/pi/VS-Projects/gaming/aus-auto-parts-platform/
├── backend/
│   ├── src/
│   │   ├── routes/          # 12 route modules
│   │   ├── controllers/     # Business logic controllers
│   │   ├── services/        # Service layer
│   │   ├── middleware/       # Auth, rate-limit, audit
│   │   └── app.ts           # Express entry
│   └── prisma/schema.prisma # Database schema
├── frontend/
│   └── src/
│       ├── pages/           # 24 page components
│       ├── store/slices/    # Redux slices
│       └── services/        # API service layer
├── mobile/
│   └── app/
│       ├── yard/            # Yard mode (VIN, parts intake)
│       ├── sales/           # Sales mode (cart, quotes)
│       └── management/      # Management mode (KPIs)
├── docker-compose.yml       # Dev stack (4 containers)
├── DOCKER_DEPLOYMENT.md     # Production deployment guide
└── DEVELOPMENT_PROGRESS.md  # This doc's companion (full history)
```
