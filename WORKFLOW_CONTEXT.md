# SimWeaver Workflow Context

**Project Status:** 100% COMPLETE - CLEAN PRODUCTION STATE
**Date:** 2026-08-22
**Remote Git Repository:** `https://github.com/Erebuzzz/SimWeaver.git`
**Backend Server:** `http://127.0.0.1:8000` (FastAPI / WebSocket)
**Frontend Control Room:** `http://localhost:5173` (Vite / React 18 / Tailwind / Three.js / Mermaid.js)

---

## Production Deployment & Architecture Summary

1. **Frontend (Vercel)**:
   - Root: `frontend`
   - Build: `npm run build`
   - Config: `frontend/vercel.json` (SPA routing)
   - Dynamic API: `frontend/src/config.ts` (`VITE_API_URL`)

2. **Backend (Render / Railway / Docker)**:
   - Config: `render.yaml`, `Dockerfile`, `Procfile`
   - 24/7 Keep-Alive: FastAPI Lifespan internal self-ping + `.github/workflows/keep_alive.yml` (10-minute cron)

---

## Verification & Commands

- **Run all automated tests:**
  ```bash
  python -m pytest -p no:hypothesis tests/test_eir.py tests/test_simulation.py
  ```
- **Start Full Local System:**
  ```bash
  python start_simweaver.py
  ```
- **Push to GitHub:**
  ```bash
  git push origin main
  ```
