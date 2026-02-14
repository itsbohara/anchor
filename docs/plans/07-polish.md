# Plan 07: Polish (Phase 1)

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Improve Phase 1 UX and robustness: keyboard shortcuts and focus handling across popover and dashboard, basic validation (e.g. path exists), and any status-change shortcuts in the list. No new features; only refinements so the MVP meets the success criteria in [../roadmap/phase-1.md](../roadmap/phase-1.md).

**Architecture:** Frontend: focus trap in popover, Escape to close; dashboard: focus management in modals. Tauri: optional command `path_exists(path: String) -> bool` for validation. Optional: inline status change (e.g. dropdown in table row) without opening full edit form.

**Tech Stack:** React 19, Tauri 2.

---

## Prerequisites

- [06-dashboard-delete-reference.md](06-dashboard-delete-reference.md) completed (add, edit, delete all working).

---

### Task 1: Popover keyboard and focus

**Files:**
- Modify: `src/components/MenubarPopover.tsx`

**Step 1:** On open: focus search input (already in plan 02); ensure focus is trapped inside popover (Tab cycles through search, list, Open Anchor). Escape: close popover (emit event to backend to hide window or handle in Tauri).

**Step 2:** Arrow keys: move selection in grouped list; Enter / Cmd+Enter / Option+Enter already implemented. Ensure no focus jump to body when using arrows.

**Step 3:** Commit.

```bash
git add src/components/MenubarPopover.tsx
git commit -m "polish: popover focus trap and Escape to close"
```

---

### Task 2: Path existence validation (optional but recommended)

**Files:**
- Modify: `src-tauri/src/lib.rs` (add path_exists or use in add_reference/update_reference)
- Modify: `src/components/ReferenceForm.tsx`

**Step 1:** Add Tauri command `path_exists(path: String) -> bool` that checks `std::path::Path::new(&path).exists()`. Register command.

**Step 2:** In ReferenceForm, on Save (add or update): optionally call path_exists before submitting. If path does not exist, show warning ("Path does not exist. Save anyway?" or block save with message). Or show a non-blocking warning and allow save.

**Step 3:** Commit.

```bash
git add src-tauri/src/lib.rs src/components/ReferenceForm.tsx
git commit -m "polish: path existence check and validation message"
```

---

### Task 3: Dashboard form focus and Escape

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/ReferenceForm.tsx`

**Step 1:** When Add/Edit form (modal or panel) is open: focus first input; Escape closes the form (same as Cancel). Focus returns to "Add reference" button or the table when form closes.

**Step 2:** Commit.

```bash
git add src/components/Dashboard.tsx src/components/ReferenceForm.tsx
git commit -m "polish: dashboard form focus and Escape to cancel"
```

---

### Task 4: Status change shortcut (optional)

**Files:**
- Modify: `src/components/ReferenceTable.tsx`

**Step 1:** In the table, add a small status dropdown or button per row that lets the user change status (active, paused, completed, idea, archived) without opening the full edit form. On change, call update_reference with only the status (and id); refresh list.

**Step 2:** Commit.

```bash
git add src/components/ReferenceTable.tsx
git commit -m "polish: inline status change in reference table"
```

---

### Task 5: Success criteria check

**Files:**
- None (verification only)

**Step 1:** Run through [../roadmap/phase-1.md](../roadmap/phase-1.md) success criteria:

- User can add references (folder or file) from the dashboard with name, path, type, status, tags, description.
- User can edit and delete references and change status from the dashboard.
- Menu bar popover shows all references; search works; quick actions open Finder/Terminal/VSCode correctly.
- "Open Anchor" opens the dashboard; data is consistent between popover and dashboard.
- All data lives in `~/Library/Application Support/Anchor/data.json`.

**Step 2:** Fix any gaps (e.g. missing field, wrong shortcut). Document any known limitations in a short note in docs/plans or in README.

**Step 3:** Commit.

```bash
git add (any last fixes)
git commit -m "chore: Phase 1 polish and success criteria verification"
```

---

## Verification

- Popover: focus and Escape work; keyboard shortcuts work.
- Dashboard: form focus and Escape; path validation; optional inline status change.
- All Phase 1 success criteria pass.

---

## Handoff

Phase 1 implementation is complete. Optionally: create a short "Phase 1 done" checklist in docs or close related issues.
