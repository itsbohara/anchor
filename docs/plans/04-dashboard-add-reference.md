# Plan 04: Dashboard — Add Reference

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** User can add a new reference from the dashboard: form with reference name, absolute path, type (folder/file), status, tags, optional description. Data is persisted to `data.json` via a Tauri command. New reference appears in the list and in the menu bar popover.

**Architecture:** Tauri command `add_reference(reference: Reference)` that appends to the list, generates `id` (UUID) and timestamps if not set, then calls existing write_references. Frontend: "Add reference" button opens a form (modal or side panel); on submit, invoke add_reference and refresh the list.

**Tech Stack:** React 19, Zustand, Tauri 2, uuid (or Rust-generated UUID).

---

## Prerequisites

- [03-dashboard-window.md](03-dashboard-window.md) completed (dashboard with read-only list).

---

### Task 1: Tauri command add_reference

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/storage.rs` (if needed)
- Modify: `src-tauri/src/models.rs` (ensure Reference is serializable from frontend)

**Step 1:** Add command `add_reference` that accepts a JSON object (or struct) for the new reference. In Rust: generate `id` (uuid), set `created_at` and `last_opened_at` to now, then read current references, push the new one, call write_references. Validate required fields: reference_name, absolute_path, type, status.

**Step 2:** Register `add_reference` in invoke_handler. Build. Test from frontend: invoke with minimal payload; then get_references and confirm new item exists.

**Step 3:** Commit.

```bash
git add src-tauri/src/lib.rs src-tauri/src/storage.rs src-tauri/src/models.rs
git commit -m "feat(tauri): add_reference command with uuid and timestamps"
```

---

### Task 2: Add Reference form UI

**Files:**
- Create: `src/components/ReferenceForm.tsx` (reusable for add and edit)
- Create or modify: `src/components/Dashboard.tsx`
- Optional: `src/components/ReferenceForm.css`

**Step 1:** Build a form with fields: Reference name (text), Absolute path (text), Type (select: folder / file), Status (select: active, paused, completed, idea, archived), Tags (text input or tag chips, e.g. comma-separated), Description (optional textarea). Buttons: Save, Cancel.

**Step 2:** For "Add reference": initial values empty (or defaults: type folder, status active). On Save: build Reference object (id can be empty; backend will set it), call `invoke('add_reference', { reference })`. On success: close form, refresh reference list (loadReferences or get_references). On Cancel: close without saving.

**Step 3:** In Dashboard, add "Add reference" button that opens this form in a modal or side panel. After add, modal closes and table updates.

**Step 4:** Commit.

```bash
git add src/components/ReferenceForm.tsx src/components/Dashboard.tsx
git commit -m "feat(dashboard): Add reference form and modal"
```

---

### Task 3: Validation and error handling

**Files:**
- Modify: `src/components/ReferenceForm.tsx`
- Optional: `src-tauri/src/lib.rs` (return Result with error message)

**Step 1:** Frontend: require reference name and absolute path; show inline error if empty. Optionally: path existence check via a Tauri command (can be added in plan 07).

**Step 2:** Backend: if validation fails (e.g. missing required field), return Err with message. Frontend: display error message near the form (e.g. toast or inline).

**Step 3:** Commit.

```bash
git add src/components/ReferenceForm.tsx src-tauri/src/lib.rs
git commit -m "feat: add reference validation and error display"
```

---

## Verification

- "Add reference" opens form; user fills name, path, type, status, tags, description.
- Save persists to data.json; new row appears in dashboard table and in menu bar popover after reopen.
- Cancel closes without saving. Validation errors prevent submit and show message.

---

## Handoff

When this plan is done, proceed to [05-dashboard-edit-reference.md](05-dashboard-edit-reference.md).
