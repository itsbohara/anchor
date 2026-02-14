# Plan 05: Dashboard — Edit Reference

> **Status: ✅ COMPLETE**

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** User can select a reference in the dashboard and edit it: name, path, type, status, tags, description, pinned. Changes are persisted via a Tauri command. List and popover show updated data after refresh.

**Architecture:** Tauri command `update_reference(id, reference)` that finds by id, replaces fields, then write_references. Frontend: reuse ReferenceForm; "Edit" on a row opens form with current values; on Save call update_reference and refresh.

**Tech Stack:** React 19, Zustand, Tauri 2.

---

## Prerequisites

- [04-dashboard-add-reference.md](04-dashboard-add-reference.md) completed (add reference form and command).

---

### Task 1: Tauri command update_reference

**Files:**
- Modify: `src-tauri/src/lib.rs`

**Step 1:** Add command `update_reference(id: String, reference: Reference)` (or accept full Reference with id). Logic: read references, find index by id, replace that element with the updated one (preserve id; update timestamps if desired, e.g. leave created_at, set updated_at or leave last_opened_at). Write back via write_references.

**Step 2:** Register in invoke_handler. Build. Test: update one reference and confirm get_references returns new values.

**Step 3:** Commit.

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(tauri): update_reference command"
```

---

### Task 2: Edit flow in dashboard

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/ReferenceTable.tsx` (add Edit button per row)
- Modify: `src/components/ReferenceForm.tsx` (support edit mode: initial values, title "Edit reference")

**Step 1:** In ReferenceForm, add an optional prop `initialReference?: Reference | null`. When set, prefill all fields and set form title to "Edit reference". On Save, call `invoke('update_reference', { id: initialReference.id, reference: formData })` instead of add_reference.

**Step 2:** In ReferenceTable, add an "Edit" button (or click row) that sets selected reference and opens the form with that reference. Pass selected reference into ReferenceForm as initialReference.

**Step 3:** After successful update: close form, clear selection, refresh reference list.

**Step 4:** Commit.

```bash
git add src/components/Dashboard.tsx src/components/ReferenceTable.tsx src/components/ReferenceForm.tsx
git commit -m "feat(dashboard): edit reference with form and update_reference"
```

---

### Task 3: Pinned and status in edit form

**Files:**
- Modify: `src/components/ReferenceForm.tsx`

**Step 1:** Ensure form includes: Pinned (checkbox). Status already in form. When editing, user can toggle pinned and change status; both are persisted via update_reference.

**Step 2:** Commit.

```bash
git add src/components/ReferenceForm.tsx
git commit -m "feat: pinned and status editable in reference form"
```

---

## Verification

- Click Edit on a row opens form with current name, path, type, status, tags, description, pinned.
- Save updates data.json; table and popover show new values after refresh.
- Cancel closes without saving.

---

## Handoff

When this plan is done, proceed to [06-dashboard-delete-reference.md](06-dashboard-delete-reference.md).
