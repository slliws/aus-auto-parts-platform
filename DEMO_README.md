# Australian Auto Parts Platform - Demo Package

**Demo Package Date:** November 10, 2025
**Version:** Demo v1.0
**Platform:** Windows 10/11

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Extract the Package
1. Right-click `AusAutoPartsDemo.zip` → **"Extract All..."**
2. Choose a destination folder (e.g., Desktop)
3. Open the extracted `AusAutoPartsDemo` folder

### Step 2: Run the Demo
**Option A: Double-click launcher (Easiest)**
- Double-click `start-demo.bat`

**Option B: PowerShell (Advanced)**
- Right-click `demo-setup.ps1` → **"Run with PowerShell"**

### Step 3: Wait for Setup
- The script will automatically:
  - Check system requirements
  - Install dependencies
  - Set up database with demo data
  - Build frontend and backend
  - Start all services

### Step 4: Start the Demo
- Once setup completes, URLs will be displayed
- Open **http://localhost:5173** in your browser
- Follow the demo script below

---

## 🎯 Demo Features Overview

This demo showcases the complete Australian Auto Parts Sales Automation Platform with pre-loaded data.

### 🎪 What You Can Demonstrate

#### **Core Platform Features**
- ✅ Multi-tenant SaaS architecture
- ✅ Complete inventory management
- ✅ Customer relationship management
- ✅ Sales order processing
- ✅ Real-time messaging system
- ✅ Analytics and reporting
- ✅ Mobile-responsive design

#### **Key Workflows**
1. **Inventory Management:** Add/edit vehicles and parts
2. **Customer Portal:** Search and browse parts
3. **Order Processing:** Create quotes and sales
4. **Admin Dashboard:** Analytics and user management
5. **Messaging:** Customer communication
6. **Mobile App:** Offline-first capabilities

#### **Australian Compliance**
- GST calculations (10%)
- ABN validation
- Consumer law compliance
- Data residency (AWS Sydney)

---

## 📊 Demo Data Summary

### Pre-loaded Demo Data
- **1 Demo Tenant:** "Demo Wreckers Pty Ltd"
- **3 Demo Customers:** John Smith, Sarah Jones, Mike Brown
- **3 Demo Vehicles:** Honda Accord, Toyota Camry, Ford Focus
- **4 Demo Parts:** Engine, Transmission, Brakes, Alternator
- **2 Demo Orders:** 1 Quote, 1 Completed Sale

### Demo User Accounts
```
Admin User: admin@demo.com     / password123
Test User:  user@demo.com      / password123
```

---

## 🎬 Demo Script (15 Minutes)

### **Section 1: Platform Overview (2 minutes)**
1. **Login as Admin** (`admin@demo.com` / `password123`)
2. Show the **dashboard** with key metrics
3. Navigate through main sections:
   - Vehicles (3 vehicles)
   - Parts (4 parts in inventory)
   - Customers (3 customers)
   - Orders (1 quote, 1 sale)

### **Section 2: Inventory Management (3 minutes)**
1. Click **"Vehicles"** → View vehicle details
2. Click **"Parts"** → Show part catalog
3. Demonstrate **search and filtering**
4. Show **low stock alerts**

### **Section 3: Sales Process (4 minutes)**
1. Create a **new quote** for a customer
2. Add parts to the quote
3. Show **GST calculation** (10%)
4. Convert quote to **confirmed sale**
5. Process **payment** (demo mode)

### **Section 4: Customer Portal (3 minutes)**
1. Switch to **customer view**
2. Demonstrate **parts search**
3. Show **compatibility checking**
4. View **order history**

### **Section 5: Analytics & Reporting (3 minutes)**
1. Return to **admin dashboard**
2. Show **sales analytics**
3. Demonstrate **revenue projections**
4. Display **customer insights**

---

## 🖥️ System Requirements

### Minimum Requirements
- **OS:** Windows 10 or 11
- **RAM:** 4GB
- **Storage:** 5GB free space
- **Network:** Internet connection for initial setup

### Recommended Requirements
- **OS:** Windows 11
- **RAM:** 8GB
- **CPU:** Quad-core processor
- **Storage:** SSD with 10GB free space

### Pre-installed Software
The demo will automatically check for:
- ✅ **Node.js 18+** (Runtime for backend/frontend)
- ✅ **PostgreSQL 15+** (Database)
- ✅ **Redis 6+** (Cache)
- ⚠️ **Docker** (Optional, for advanced demos)

---

## 🔧 Troubleshooting

### Common Issues

**❌ "PowerShell execution policy" error**
```
Solution: Run PowerShell as Administrator, execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**❌ "PostgreSQL connection failed"**
```
Solutions:
1. Install PostgreSQL from postgresql.org
2. Start PostgreSQL service manually
3. Default credentials: postgres/postgres
```

**❌ "Redis not running"**
```
Solutions:
1. Install Redis from redis.io
2. Start Redis service: redis-server
3. Or skip Redis (demo works without it)
```

**❌ "Port 3000 or 5173 already in use"**
```
Solutions:
1. Close other applications using these ports
2. Kill processes: netstat -ano | findstr :3000
3. Task Manager → End Process
```

**❌ "Frontend build failed"**
```
Solutions:
1. Check Node.js version: node --version
2. Clear cache: npm cache clean --force
3. Reinstall: rm -rf node_modules && npm install
```

### Getting Help
- Check the **detailed logs** in PowerShell window
- Review **error messages** for specific guidance
- Contact support with the error details

---

## 📁 Package Contents

```
AusAutoPartsDemo/
├── start-demo.bat           # One-click launcher
├── demo-setup.ps1          # PowerShell setup script
├── DEMO_README.md          # This file
├── DEMO_SCRIPT.md          # Detailed demo guide
├── REQUIREMENTS.md         # System requirements
├── TROUBLESHOOTING.md      # Detailed troubleshooting
├── backend/                # Complete backend source
│   ├── src/               # TypeScript source code
│   ├── prisma/            # Database schema & migrations
│   ├── package.json       # Dependencies
│   └── demo-seed.ts       # Demo data seeder
├── frontend/               # Complete React frontend
│   ├── src/               # React components & pages
│   ├── package.json       # Dependencies
│   └── dist/              # Built assets (after setup)
├── docs/                  # Technical documentation
├── requirements/          # Business requirements
└── word-documents/        # Formatted documentation
```

---

## 🚀 Advanced Demo Features

### For Technical Demonstrations
- **API Documentation:** http://localhost:3000/api-docs
- **Database Schema:** View in backend/prisma/schema.prisma
- **Code Architecture:** Review backend/src/ and frontend/src/
- **Testing:** Run `npm test` in backend/ or frontend/

### Multi-tenant Architecture
- Demonstrate tenant isolation
- Show subscription tier features
- Rate limiting per tenant
- Data security boundaries

### Mobile Responsiveness
- Resize browser to test mobile layouts
- Demonstrate offline-first capabilities
- Show barcode scanning features

---

## 📞 Support & Resources

### Demo Duration: 15-30 minutes
### Audience: Stakeholders, investors, developers, business partners

### Key Talking Points
- **Market Size:** 200-250 auto wreckers in Australia
- **Revenue Model:** $99-799/month subscription tiers
- **Technology:** Modern React/Node.js stack
- **Compliance:** Australian Consumer Law, GST, data residency
- **Timeline:** Production-ready in 8-10 months

### Next Steps After Demo
1. Schedule technical deep-dive
2. Discuss pilot program opportunities
3. Review partnership possibilities
4. Plan beta testing participation

---

## 🎉 Success Metrics

### Demo Success Indicators
- ✅ Platform loads without errors
- ✅ All demo data is visible
- ✅ Key workflows function properly
- ✅ User experience is smooth
- ✅ Questions are answered clearly

### Technical Validation
- Backend API responds correctly
- Database queries work
- Frontend renders properly
- Real-time features function
- Mobile layouts display correctly

---

**Demo Package Created:** November 10, 2025
**Target Platform:** Windows 10/11
**Estimated Setup Time:** 3-5 minutes
**Demo Duration:** 15-30 minutes

**Built with ❤️ for the Australian Auto Parts Industry**