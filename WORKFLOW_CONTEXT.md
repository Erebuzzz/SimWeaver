# SimWeaver Workflow Context

**Project Status:** 100% COMPLETE - INTERACTIVE MERMAID FLOWCHART COMPILATION & DOCS SUITE DEPLOYED
**Date:** 2026-08-22
**Active Working Directory:** `d:\SimWeave`
**Backend Server:** `http://127.0.0.1:8000` (FastAPI / WebSocket)
**Frontend Control Room:** `http://localhost:5173` (Vite / React 18 / Tailwind / Three.js / Mermaid.js)

---

## Mermaid.js Integration & Real-Time Flowchart Rendering

1. **Client-Side Mermaid Compilation Engine (`MermaidRenderer.tsx`)**:
   - Installed `mermaid` v11 in `frontend`.
   - Built a dynamic rendering engine that compiles raw Mermaid markdown strings into crisp, scalable vector SVGs with custom aerospace dark/light theme palettes.
   - Dynamically re-compiles diagrams on theme toggles.

2. **Rendered Architecture & Sequence Flowcharts in Documentation**:
   - **System Architecture Flowchart**: Visualizes Intent $\rightarrow$ 7-Agent Loop $\rightarrow$ Evaluator $\rightarrow$ Critic $\rightarrow$ Convergence $\rightarrow$ Export.
   - **Compile Sequence Diagram**: Visualizes engineer request $\rightarrow$ `RequirementAgent` $\rightarrow$ `SystemsArchitectAgent` $\rightarrow$ `WorldModel`.
   - **Closed-Loop Agent Lifecycle**: Visualizes 4 key stages (Plan, Build, Evaluate, Diagnose).

3. **Solid Button Architecture**:
   - Standardized all action buttons across all views to solid aerospace blue (`bg-blue-600 hover:bg-blue-500 text-white`).

---

## Verification & Commands

- **Run all automated tests:**
  ```bash
  python run_tests.py
  ```
- **Start All-in-One System:**
  ```bash
  python start_simweaver.py
  ```
- **Build Frontend Assets:**
  ```bash
  cd frontend && npm run build
  ```
