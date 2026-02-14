# Plan 06: Dashboard — Delete Reference

> **Status: ✅ COMPLETE**

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** User can delete a reference from the dashboard. Optionally confirm before delete. Data is removed from `data.json` and the list (and popover) updates.

**Architecture:** Tauri command `delete_reference(id: String)` that filters out the reference by id and calls write_references. Frontend: Delete button per row (or in edit view); optional confirm dialog; then invoke and refresh.

**Tech Stack:** React 19, Tauri 2.

---

## Prerequisites

- [05-dashboard-edit-reference.md](05-dashboard-edit-reference.md) completed (edit reference).

---

### Task 1: Tauri command delete_reference

**Files:**
- Modify: `src-tauri/src/lib.rs`

**Step 1:** Add command `delete_reference(id: String)`. Logic: read references, filter out the one with matching id, write_references with the remaining list. If id not found, either no-op or return Err.

**Step 2:** Register in invoke_handler. Build. Test: delete one reference, then get_references; deleted id should be gone.

**Step 3:** Commit.

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(tauri): delete_reference command"
```

---

### Task 2: Delete button and confirmation

**Files:**
- Modify: `src/components/ReferenceTable.tsx` (or Dashboard)
- Optional: create small ConfirmDialog component or use window.confirm

**Step 1:** Add "Delete" button (or icon) per row. On click: show confirmation ("Delete this reference? This cannot be undone." or use native confirm). If user confirms, call `invoke('delete_reference', { id })`, then refresh reference list.

**Step 2:** If backend returns error (e.g. id not found), show error message. On success, close edit form if it was open for that reference.

**Step 3:** Commit.

```bash
git add src/components/ReferenceTable.tsx
git commit -m "feat(dashboard): delete reference with confirmation"
```

---

## Verification

- Delete button on each row; confirm dialog appears; on confirm reference is removed from data.json and from table and popover.
- Cancel in dialog does nothing.

---

## Handoff

When this plan is done, proceed to [07-polish.md](07-polish.md).
