# Phase 1 Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable scaffold for the Dajeong MVP without adding business logic.

**Architecture:** The repository is split into independent app folders: kiosk React app, admin React app, backend FastAPI app, MCP FastAPI adapter, and Streamlit agent placeholder. Each app exposes only a minimal shell or health endpoint so later phases can add behavior without changing the folder contract.

**Tech Stack:** React + Vite + TypeScript for frontend apps, FastAPI + Uvicorn for backend and MCP app, Streamlit for the agent placeholder, Python stdlib verification for scaffold contracts.

---

### Task 1: Scaffold Contract Verification

**Files:**
- Create: `scripts/verify_phase1_scaffold.py`

- [x] **Step 1: Write the failing scaffold verifier**

Create a Python verifier that checks the exact app scaffold file structure, package scripts, health endpoint markers, README run commands, and app scaffold `todo.md` Phase 1 checkboxes. The later dummy-data completion check is owned by `scripts/verify_dummy_data.py`.

- [x] **Step 2: Run verifier to confirm it fails before scaffold files exist**

Run: `python scripts/verify_phase1_scaffold.py`
Expected: FAIL with missing files such as `frontend/kiosk/package.json`.

### Task 2: Frontend App Scaffolds

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `pnpm-workspace.yaml`
- Create: `frontend/kiosk/package.json`
- Create: `frontend/kiosk/index.html`
- Create: `frontend/kiosk/tsconfig.json`
- Create: `frontend/kiosk/vite.config.ts`
- Create: `frontend/kiosk/src/main.tsx`
- Create: `frontend/kiosk/src/App.tsx`
- Create: `frontend/kiosk/src/styles.css`
- Create: `frontend/kiosk/src/vite-env.d.ts`
- Create: `frontend/admin/package.json`
- Create: `frontend/admin/index.html`
- Create: `frontend/admin/tsconfig.json`
- Create: `frontend/admin/vite.config.ts`
- Create: `frontend/admin/src/main.tsx`
- Create: `frontend/admin/src/App.tsx`
- Create: `frontend/admin/src/styles.css`
- Create: `frontend/admin/src/vite-env.d.ts`

- [x] **Step 1: Add minimal Vite React TypeScript apps**

Both apps must expose `dev`, `build`, `preview`, and `typecheck` scripts. The visible UI is only a scaffold status screen.

- [x] **Step 2: Verify package structure**

Run: `python scripts/verify_phase1_scaffold.py`
Expected: backend/MCP/agent files still missing, frontend package checks passing.

### Task 3: Python App Scaffolds

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/requirements.txt`
- Create: `backend/app/README.md`
- Create: `mcp-server/app/main.py`
- Create: `mcp-server/app/requirements.txt`
- Create: `mcp-server/app/README.md`
- Create: `ai-agent/app/app.py`
- Create: `ai-agent/app/requirements.txt`
- Create: `ai-agent/app/README.md`

- [x] **Step 1: Add backend and MCP health endpoints**

`backend/app/main.py` exposes `GET /health` returning `{"status": "ok", "service": "backend"}`.

`mcp-server/app/main.py` exposes `GET /health` returning `{"status": "ok", "service": "mcp-server"}`.

- [x] **Step 2: Add Streamlit placeholder**

`ai-agent/app/app.py` renders only the Dajeong AI Agent scaffold title and phase status.

- [x] **Step 3: Compile Python files**

Run: `python -m py_compile backend/app/main.py mcp-server/app/main.py ai-agent/app/app.py`
Expected: PASS with exit code 0.

### Task 4: Documentation and TODO Alignment

**Files:**
- Modify: `README.md`
- Modify: `todo.md`
- Create: `.gitignore`

- [x] **Step 1: Update README run commands**

Document `pnpm.cmd --dir frontend/kiosk dev`, `pnpm.cmd --dir frontend/admin dev`, `python -m uvicorn main:app --reload`, and `streamlit run app.py`.

- [x] **Step 2: Mark only completed Phase 1 scaffold items**

Mark kiosk, admin, backend, MCP, AI Agent, and minimum health checks complete. Keep `shared/dummy-data` unchecked for the next process.

- [x] **Step 3: Run final verification**

Run:

```powershell
python scripts/verify_phase1_scaffold.py
python -m py_compile backend/app/main.py mcp-server/app/main.py ai-agent/app/app.py
git diff --check
```

Expected: all commands exit 0.
