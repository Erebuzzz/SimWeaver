# SimWeaver Workflow Context & Production Status

This document preserves the operational state, deployment configuration, and multi-agent architecture of SimWeaver.

---

## 1. Production Deployment & Live Endpoints

- **Frontend Global CDN (Vercel):** [https://simweaver.vercel.app](https://simweaver.vercel.app)
  - Direct Deployment Alias: [https://simweaver-omega.vercel.app](https://simweaver-omega.vercel.app)
- **Backend API & Simulation Engine (Render):** [https://simweaver-api.onrender.com](https://simweaver-api.onrender.com)
  - API Health Check: `https://simweaver-api.onrender.com/api/health`
  - Root Info & Probe: `https://simweaver-api.onrender.com/`
  - Duplex Telemetry WebSockets: `wss://simweaver-api.onrender.com/ws/simulation` (also `/ws/stream`)
- **GitHub Repository:** [https://github.com/Erebuzzz/SimWeaver.git](https://github.com/Erebuzzz/SimWeaver.git)
- **Render Web Service ID:** `srv-da4tlk740ujc73a1f5vg` (Region: Singapore)

---

## 2. Recent Fixes & Resolutions

1. **WebSocket Route Matching (403 Forbidden Resolved):**
   - Registered both `@app.websocket("/ws/simulation")` and `@app.websocket("/ws/stream")` in `simweaver/server/app.py`.
   - Added immediate status synchronization packet on WebSocket handshake.

2. **Unprocessable Content on run_all (422 Resolved):**
   - Made `PromptRequest` optional in `@app.post("/api/orchestrator/run_all")`.
   - Updated frontend `handleRunAll` in `frontend/src/App.tsx` to pass JSON payload `{ prompt: humanPrompt }`.

3. **Root Health Probe (404 Resolved):**
   - Added `@app.get("/")` and `@app.head("/")` endpoints returning service status and documentation links.

4. **Async Thread Execution & Performance:**
   - Evaluator runs and Critic adversarial stress tests now execute in parallel background threads via `asyncio.to_thread` and `asyncio.gather`.
   - Event loop remains responsive during continuous kinematic ODE physics simulations.

---

## 3. Test Verification

- Phase 1 (EIR Schema and World Model): PASSED [OK]
- Phase 2 (Continuous Physics ODE & Planners): PASSED [OK]
- Phase 3 (Multi-Agent Reasoning Loop): PASSED [OK]
- Phase 4 (FastAPI Endpoints & Adapters): PASSED [OK]
