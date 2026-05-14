# Phase 1 Dummy Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add presentation-safe shared dummy JSON data for the Dajeong MVP without adding backend database or API behavior.

**Architecture:** `shared/dummy-data` is the source for later seed loading. Each concern lives in a separate JSON file so Phase 2 can consume users and menus first, while later phases can consume payments, points, and order history without parsing one large blob.

**Tech Stack:** JSON data files, Python stdlib validation, existing repo TODO and README documentation.

---

### Task 1: Dummy Data Contract Verification

**Files:**
- Create: `scripts/verify_dummy_data.py`

- [x] **Step 1: Write the failing verifier**

The verifier checks required files, parses JSON, validates unique IDs, validates references across users/brands/stores/menus/preferences/order history/payment profiles/point memberships, confirms the demo order path has removable cucumber pickle, and rejects sensitive card-number fields.

- [x] **Step 2: Run verifier before data exists**

Run: `python scripts/verify_dummy_data.py`
Expected: FAIL with missing files under `shared/dummy-data`.

### Task 2: Shared Dummy Data Files

**Files:**
- Create: `shared/dummy-data/README.md`
- Create: `shared/dummy-data/users.json`
- Create: `shared/dummy-data/brands.json`
- Create: `shared/dummy-data/stores.json`
- Create: `shared/dummy-data/menus.json`
- Create: `shared/dummy-data/preferences.json`
- Create: `shared/dummy-data/order_history.json`
- Create: `shared/dummy-data/payment_profiles.json`
- Create: `shared/dummy-data/point_memberships.json`

- [x] **Step 1: Add presentation-safe demo users**

Include `user1 / user1234` and `admin / dajeong` as demo credentials only. Do not add real phone numbers, real addresses, or real payment data.

- [x] **Step 2: Add A/B/C brand and store data**

A기업 is the live demo target. B/C기업 are mock kiosk targets only.

- [x] **Step 3: Add menu, preference, payment, point, and order-history data**

Include an A기업 burger set with removable `ingredient_pickle_cucumber` and a recent order for `user1` so the sentence `늘 먹던 햄버거 하나 주문해줘. 오이는 빼줘.` has deterministic demo data.

### Task 3: Documentation and TODO Alignment

**Files:**
- Modify: `README.md`
- Modify: `todo.md`

- [x] **Step 1: Document dummy-data purpose**

Add a short README section that names the dummy-data folder and clarifies it is fake demo data.

- [x] **Step 2: Mark only the Phase 1 dummy-data item complete**

Mark `shared/dummy-data` seed JSON complete in `todo.md`.

- [x] **Step 3: Run final verification**

Run:

```powershell
python scripts/verify_dummy_data.py
python scripts/verify_phase1_scaffold.py
git diff --check
```

Expected: all commands exit 0.
