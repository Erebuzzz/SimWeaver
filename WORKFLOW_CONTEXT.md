# SimWeaver Workflow Context

**Project Status:** 100% COMPLETE - 1-CLICK DEPLOYMENT ENGINE (VERCEL + RENDER/RAILWAY) PUSHED TO GITHUB
**Date:** 2026-08-22
**Remote Git Repository:** `https://github.com/Erebuzzz/SimWeaver.git`
**Backend Server:** `http://127.0.0.1:8000` (FastAPI / WebSocket)
**Frontend Control Room:** `http://localhost:5173` (Vite / React 18 / Tailwind / Three.js / Mermaid.js)

---

## 1-Click Deployment Engine Configured

1. **Frontend on Vercel**:
   - `frontend/vercel.json` added for clean SPA routing.
   - Dynamic `getApiUrl` and `getWsUrl` in `frontend/src/config.ts` dynamically resolving `VITE_API_URL` and `VITE_WS_URL`.

2. **Backend on Render / Railway / Fly.io / Docker**:
   - `render.yaml` added for 1-click Render blueprint deployments.
   - `Dockerfile` and `Procfile` added for container / Railway deployments.
   - Preserves persistent WebSockets (`/ws/simulation`), continuous ODE physics state, and multi-agent optimization loops without timeout restrictions.

---

## Verification & Commands

- **Run all automated tests:**
  ```bash
  python run_tests.py
  ```
- **Start Full Local System:**
  ```bash
  python start_simweaver.py
  ```
- **Push to GitHub:**
  ```bash
  git push origin main
  ```
