# SimWeaver Workflow Context

**Project Status:** 100% COMPLETE - LIVE IN PRODUCTION WITH DEDICATED DOMAIN ALIASES
**Date:** 2026-08-22
**GitHub Repository:** `https://github.com/Erebuzzz/SimWeaver.git`

---

## Live Production Deployment Endpoints

- **Frontend (Vercel Production Domain):** [https://simweaver.vercel.app](https://simweaver.vercel.app)
  - Direct Production Alias: [https://simweaver-omega.vercel.app](https://simweaver-omega.vercel.app)
  - Deployment Host: `https://simweaver-610x523lv-unstable-kernel.vercel.app`
  - Vercel Project: `unstable-kernel/simweaver`
- **Backend (Render Web Service):** [https://simweaver-api.onrender.com](https://simweaver-api.onrender.com)
  - Health Endpoint: `https://simweaver-api.onrender.com/api/health` (HTTP 200 OK)
  - Persistent Duplex WebSockets: `wss://simweaver-api.onrender.com/ws/simulation`
  - Render Dashboard: `https://dashboard.render.com/web/srv-da4tlk740ujc73a1f5vg`
- **24/7 Keep-Alive Automation:**
  - FastAPI Lifespan self-ping every 10 minutes
  - GitHub Actions cron workflow `.github/workflows/keep_alive.yml`

---

## Local Development Endpoints

- **Backend Server:** `http://127.0.0.1:8000`
- **Frontend Control Room:** `http://localhost:5173`
