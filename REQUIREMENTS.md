# System Requirements - Australian Auto Parts Platform Demo

**Demo Package Date:** November 10, 2025
**Platform:** Windows 10/11
**Package Size:** ~500MB (with dependencies)

---

## 🔧 Minimum System Requirements

### Hardware Requirements
- **Processor:** Intel Core i3 or equivalent (2015 or newer)
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 5GB free disk space
- **Network:** Stable internet connection (for initial setup)

### Software Requirements
- **Operating System:** Windows 10 version 1903 or later, or Windows 11
- **PowerShell:** Version 5.1 or later (included with Windows)
- **Windows Terminal:** Recommended but not required

---

## 📦 Pre-installed Software

The demo setup script will automatically check for and use these components:

### Required Software
- **Node.js 18+** - JavaScript runtime
  - Download: https://nodejs.org/
  - Version check: `node --version`
  - Includes npm package manager

- **PostgreSQL 15+** - Database server
  - Download: https://www.postgresql.org/download/windows/
  - Version check: `psql --version`
  - Default setup uses: localhost:5432, user: postgres

- **Redis 6+** - Cache server
  - Download: https://redis.io/download/
  - Version check: `redis-cli --version`
  - Optional but recommended for full demo experience

### Optional Software
- **Docker Desktop** - Container runtime
  - Download: https://www.docker.com/products/docker-desktop/
  - Used for advanced database setups
  - Not required for basic demo

- **Git** - Version control
  - Download: https://git-scm.com/downloads/
  - Used for cloning repositories (if needed)

---

## 🚀 Quick Setup Instructions

### Step 1: Install Node.js (Required)
1. Visit https://nodejs.org/
2. Download the **LTS version** (recommended for most users)
3. Run the installer
4. Restart your computer
5. Verify: Open Command Prompt → `node --version`

### Step 2: Install PostgreSQL (Required)
1. Visit https://www.postgresql.org/download/windows/
2. Download the installer for Windows
3. Run the installer as Administrator
4. **Important settings:**
   - Port: 5432 (default)
   - Password: Remember this! (default: postgres/postgres)
   - Install pgAdmin (recommended)
5. Verify: Open Command Prompt → `psql --version`

### Step 3: Install Redis (Recommended)
1. Visit https://redis.io/download/
2. Download the Windows version
3. Extract to a folder (e.g., C:\Redis)
4. Run `redis-server.exe` to start
5. Verify: Open Command Prompt → `redis-cli ping` (should return PONG)

### Step 4: Run the Demo
1. Extract the demo package
2. Double-click `start-demo.bat`
3. Follow the on-screen instructions

---

## ⚡ Performance Recommendations

### For Optimal Demo Experience

#### Hardware
- **RAM:** 8GB or more for smooth operation
- **Storage:** SSD storage for faster setup
- **CPU:** Quad-core processor or better

#### Software
- **Antivirus:** Temporarily disable during setup (may interfere with npm installs)
- **Windows Defender:** Add exclusions for the demo folder
- **Power Settings:** Set to "High Performance" mode

#### Network
- **Speed:** 10Mbps or faster for dependency downloads
- **Firewall:** Allow Node.js and database connections
- **VPN:** Disable during setup if experiencing issues

---

## 🔍 Troubleshooting Setup Issues

### Node.js Issues
**Problem:** `node command not found`
```
Solutions:
1. Restart your computer after installation
2. Check PATH: Open PowerShell → $env:PATH
3. Reinstall Node.js, ensure "Add to PATH" is checked
4. Use full path: "C:\Program Files\nodejs\node.exe"
```

**Problem:** Old Node.js version
```
Solution: Uninstall old version, install Node.js 18+ from nodejs.org
Check version: node --version (should be 18.x.x or higher)
```

### PostgreSQL Issues
**Problem:** Connection refused
```
Solutions:
1. Start PostgreSQL service: services.msc → postgresql-x64-15 → Start
2. Check port: netstat -ano | findstr :5432
3. Verify credentials in demo-setup.ps1
4. Use pgAdmin to test connection
```

**Problem:** psql command not found
```
Solutions:
1. Add PostgreSQL to PATH
2. Use full path: "C:\Program Files\PostgreSQL\15\bin\psql.exe"
3. Reinstall PostgreSQL with correct PATH settings
```

### Redis Issues
**Problem:** Redis server won't start
```
Solutions:
1. Run as Administrator: right-click redis-server.exe → Run as administrator
2. Check port conflicts: netstat -ano | findstr :6379
3. Disable Windows Firewall temporarily
4. Demo works without Redis (reduced functionality)
```

### PowerShell Issues
**Problem:** Execution policy error
```
Solution: Run PowerShell as Administrator, execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Problem:** Script won't run
```
Solutions:
1. Right-click demo-setup.ps1 → Properties → Unblock
2. Run PowerShell as Administrator
3. Use: powershell -ExecutionPolicy Bypass -File demo-setup.ps1
```

---

## 📱 Mobile Testing (Optional)

### For Mobile Demo Features
- **Browser Developer Tools:** F12 → Device Toolbar
- **Screen Resolution:** Test at 375px (iPhone) and 768px (iPad)
- **Touch Events:** Use browser dev tools to simulate touch

### Mobile Apps (Future)
- iOS App: Requires Xcode and iOS Simulator
- Android App: Requires Android Studio and Emulator
- Note: Mobile apps not included in current demo

---

## ☁️ Cloud Alternatives

If local setup fails, the platform can run in cloud environments:

### AWS Lightsail
- Pre-configured Node.js instances
- PostgreSQL database included
- $10-20/month for demo purposes

### Heroku
- Easy Node.js deployment
- PostgreSQL add-on available
- Free tier available for testing

### DigitalOcean
- Droplets with Node.js images
- Managed PostgreSQL databases
- Pay-as-you-go pricing

---

## 📞 Support & Resources

### Community Resources
- **Node.js Documentation:** https://nodejs.org/en/docs/
- **PostgreSQL Manual:** https://www.postgresql.org/docs/
- **Redis Documentation:** https://redis.io/documentation

### Stack Overflow
- Search for specific error messages
- Tag: nodejs, postgresql, redis, windows

### Demo-specific Support
- Check DEMO_README.md for common issues
- Review TROUBLESHOOTING.md for detailed solutions
- Contact development team for package-specific issues

---

## 🔄 Demo Environment Cleanup

### After Demo Completion
1. Stop running processes:
   - Close PowerShell window (stops all services)
   - Or manually: `taskkill /f /im node.exe`

2. Clean up databases (optional):
   ```sql
   DROP DATABASE auto_parts_platform;
   DROP ROLE demo_user;
   ```

3. Remove demo files:
   - Delete the entire demo folder
   - Or keep for future demonstrations

### Reset for New Demo
1. Delete node_modules folders
2. Drop and recreate database
3. Run demo-setup.ps1 again

---

## 📊 Performance Benchmarks

### Expected Setup Times
- **Dependency Installation:** 2-5 minutes
- **Database Setup:** 1-2 minutes
- **Build Process:** 2-4 minutes
- **Total Setup Time:** 5-12 minutes

### Memory Usage
- **Backend (idle):** ~50MB RAM
- **Frontend (dev server):** ~100MB RAM
- **Database:** ~20MB RAM
- **Redis:** ~5MB RAM
- **Total:** ~175MB RAM

### Disk Usage
- **Source Code:** ~50MB
- **Dependencies:** ~300MB (node_modules)
- **Database:** ~10MB
- **Built Assets:** ~20MB
- **Total:** ~380MB

---

## ⚠️ Known Limitations

### Demo Environment
- **Database:** Uses demo data only
- **Email:** Mock email service (no real emails sent)
- **Payments:** Stripe test mode only
- **File Uploads:** Local storage only

### Windows-specific Notes
- **Antivirus:** May flag npm scripts (safe to allow)
- **Firewall:** May block database connections (configure exceptions)
- **Permissions:** Run as Administrator for full functionality
- **UAC:** User Account Control may prompt for permissions

### Browser Compatibility
- **Chrome:** Fully supported
- **Firefox:** Fully supported
- **Edge:** Fully supported
- **Safari:** May have minor styling differences
- **IE11:** Not supported

---

**Requirements Document Version:** 1.0 - November 10, 2025
**Target Platform:** Windows 10/11
**Tested Environment:** Windows 11 Pro, Node.js 20, PostgreSQL 15