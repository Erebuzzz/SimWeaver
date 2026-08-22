# SimWeaver Workflow Context

**Project Status:** 100% COMPLETE - LIVE IN PRODUCTION
**Date:** 2026-08-22
**GitHub Repository:** `https://github.com/Erebuzzz/SimWeaver.git`

---

## Live Production Deployment URLs

- **Frontend (Vercel Edge Network):** [https://frontend-two-psi-90.vercel.app](https://frontend-two-psi-90.vercel.app)
  - Secondary Alias: `https://frontend-rdajknpp5-unstable-kernel.vercel.app`
  - Deployed via Vercel CLI with global CDN distribution
- **Backend (Render Web Service):** [https://simweaver-api.onrender.com](https://simweaver-api.onrender.com)
  - Health Endpoint: `https://simweaver-api.onrender.com/api/health` (HTTP 200 OK)
  - Persistent Duplex WebSockets: `wss://simweaver-api.onrender.com/ws/simulation`
  - Dashboard: `https://dashboard.render.com/web/srv-da4tlk740ujc73a1f5vg`
- **24/7 Zero-Cold-Start Keep-Alive:**
  - FastAPI Lifespan internal self-ping active every 10 minutes
  - GitHub Actions cron workflow `.github/workflows/keep_alive.yml` active

---

## Local Development Endpoints

- **Backend Server:** `http://127.0.0.1:8000`
- **Frontend Control Room:** `http://localhost:5173`
