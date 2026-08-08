# Legacy Data Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe JSON export in the legacy MyLife Training settings that preserves all migration-relevant local data without exporting authentication credentials.

**Architecture:** A focused browser-side utility reads an explicit allowlist of Zustand persistence keys, unwraps their persisted `state`, builds a normalized migration object plus a safe legacy backup, and triggers a JSON download. Settings only calls this utility and reports success/failure.

**Tech Stack:** Next.js 14, React 18, TypeScript strict mode, Zustand persistence, browser `localStorage` and Blob download APIs.

## Global Constraints

- No Supabase auth/session credentials in the export.
- No full `localStorage` dump; only the documented allowlist.
- No new runtime dependency.
- Existing local data must never be mutated by export.
- UI copy remains German.

---

### Task 1: Migration export utility

**Files:**
- Create: `utils/dataExport.ts`

**Interfaces:**
- Produces: `buildMigrationExport(storage, exportedAt?)` and `downloadMigrationExport()`.
- Consumes: browser `Storage`-compatible `getItem` access only.

- [ ] **Step 1: Define the allowlisted persistence keys and safe JSON helper types.**
- [ ] **Step 2: Implement parsing that unwraps Zustand `{ state, version }` payloads while retaining original allowlisted payloads for `legacyBackup`.**
- [ ] **Step 3: Build schema `mylife.training.migration` version `1` with normalized training/profile/achievement/auxiliary sections and summary counts.**
- [ ] **Step 4: Implement browser download as `mylife-training-export-YYYY-MM-DD.json` with `application/json`.**
- [ ] **Step 5: Run the project type checker after the utility is added.**

### Task 2: Settings migration action

**Files:**
- Modify: `app/settings/page.tsx`

**Interfaces:**
- Consumes: `downloadMigrationExport()` from `@/utils/dataExport`.
- Produces: `Daten & Migration` settings section with one export action.

- [ ] **Step 1: Import the Download icon and export utility.**
- [ ] **Step 2: Add a small handler that invokes export, reports exported session count, and catches failures.**
- [ ] **Step 3: Add the new settings section before the dangerous reset area, with copy explaining what is and is not exported.**
- [ ] **Step 4: Run TypeScript validation and a production build.**

### Task 3: Review and delivery

**Files:**
- Review all branch changes.

- [ ] **Step 1: Compare `feature/legacy-data-export` against `main` and verify only intended files changed.**
- [ ] **Step 2: Open a pull request with migration scope and security notes.**
- [ ] **Step 3: Confirm CI/Vercel build state where available before merging to `main`.**