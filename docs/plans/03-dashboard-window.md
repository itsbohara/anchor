# Plan 03: Dashboard Window

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** The "dashboard" is a separate window (opened via "Open Anchor") that shows the full reference list in a table or list. Read-only in this plan: no add/edit/delete yet. Layout: header ("Anchor" / "References") and main area with rows showing name, path (truncated), type, status, tags.

**Architecture:** Tauri: dashboard is a second window (or the main window shown when "Open Anchor" is clicked). Frontend: route or context to show "Dashboard" view when that window is active; reuse same reference types and get_references; render a table or card list.

**Tech Stack:** React 19, Zustand, Tauri 2.

---

## Prerequisites

- [02-menubar-popover.md](02-menubar-popover.md) completed ("Open Anchor" opens dashboard window).
- Reference type and get_references already in place.

---

### Task 1: Dashboard window identity and loading

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/App.tsx` or entry that decides which view to show

**Step 1:** Ensure the dashboard window has a known label (e.g. `"dashboard"`) and that the main/popover window is separate. On "Open Anchor", create the dashboard window if it doesn’t exist, then show and focus it.

**Step 2:** In the frontend, detect which window is running (e.g. Tauri provides window label or a custom URL/query). When the app loads in the dashboard window, render the Dashboard view; when in the popover window, render MenubarPopover. (Alternatively: single frontend that checks window label and switches layout.)

**Step 3:** In the Dashboard view, on mount call `invoke('get_references')` (or use the same Zustand store and call loadReferences()). Display a simple "Loading…" until data is ready.

**Step 4:** Commit.

```bash
git add src-tauri/src/lib.rs src/App.tsx (and any new Dashboard.tsx)
git commit -m "feat: dashboard window loads and shows Dashboard view"
```

---

### Task 2: Reference list table (read-only)

**Files:**
- Create: `src/components/Dashboard.tsx` (or `src/views/Dashboard.tsx`)
- Create: `src/components/ReferenceTable.tsx` (or inline in Dashboard)
- Optional: `src/components/Dashboard.css`

**Step 1:** Implement layout per [../roadmap/phase-1.md](../roadmap/phase-1.md):

- Top: header "Anchor" (or "References") and placeholder for future "Add reference" button.
- Main: table (or list) with columns: Name, Path (truncated, e.g. 40 chars), Type, Status (pill/badge), Tags (comma-separated or pills). Each row is one reference.

**Step 2:** Use the references from store or from get_references. If empty, show "No references yet. Add one to get started."

**Step 3:** No edit/delete yet. Rows can be plain or have a disabled "Edit" placeholder for next plan.

**Step 4:** Commit.

```bash
git add src/components/Dashboard.tsx src/components/ReferenceTable.tsx
git commit -m "feat(dashboard): read-only reference list table"
```

---

### Task 3: Sync between popover and dashboard

**Files:**
- Modify: store that holds references (e.g. load on focus or when window gets focus)
- Optional: Tauri event to notify "data changed" so both windows can reload

**Step 1:** When the dashboard window is focused or when user navigates to it, ensure it loads the latest references (e.g. call loadReferences() on focus). So if data is changed elsewhere (later: from dashboard add/edit), popover will get fresh data when opened again; dashboard gets fresh data when focused.

**Step 2:** For now, "sync" can be: dashboard loads on mount and on window focus (use Tauri window focus event if available). Popover already loads on open. No real-time push required for MVP.

**Step 3:** Commit.

```bash
git add src/ (store or Dashboard focus logic)
git commit -m "chore: reload references on dashboard focus"
```

---

## Verification

- "Open Anchor" opens dashboard window.
- Dashboard shows all references in a table: name, path, type, status, tags.
- Empty state shows when there are no references.
- Re-opening dashboard or focusing it shows up-to-date list (after plan 04/05/06, add/edit/delete will persist and show here).

---

## Handoff

When this plan is done, proceed to [04-dashboard-add-reference.md](04-dashboard-add-reference.md).
