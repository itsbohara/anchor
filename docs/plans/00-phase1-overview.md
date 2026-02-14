# Phase 1: MVP — Implementation Overview

> **For Claude:** Use `executing-plans` or `subagent-driven-development` to implement these plans task-by-task after user review.

**Goal:** Deliver the core Anchor experience: a menu bar popover for browse/search/launch and a dashboard window for managing references (add, edit, delete, status). All data in `~/Library/Application Support/Anchor/data.json`.

**Scope:** Phase 1 from [../roadmap/phase-1.md](../roadmap/phase-1.md). No AI; local JSON only.

**Tech Stack:** React 19, Vite, Zustand (add for state), Tauri 2 (Rust), macOS.

---

## Execution Order

Execute plans in this order. Each plan builds on the previous.

| # | Plan | Outcome |
|---|------|--------|
| 1 | [01-storage-and-shell.md](01-storage-and-shell.md) | Tauri app with tray icon; read/write `data.json`; create dir/file if missing |
| 2 | [02-menubar-popover.md](02-menubar-popover.md) | Popover UI: search, pinned, grouped list, quick actions, "Open Anchor" |
| 3 | [03-dashboard-window.md](03-dashboard-window.md) | Dashboard window opens from "Open Anchor"; read-only reference list |
| 4 | [04-dashboard-add-reference.md](04-dashboard-add-reference.md) | Add-reference form + Tauri command; persist to `data.json` |
| 5 | [05-dashboard-edit-reference.md](05-dashboard-edit-reference.md) | Edit reference form; load by id, save updates |
| 6 | [06-dashboard-delete-reference.md](06-dashboard-delete-reference.md) | Delete reference by id; persist |
| 7 | [07-polish.md](07-polish.md) | Keyboard shortcuts, focus, validation (path exists), status shortcuts |

---

## Reference Schema (shared)

Every reference in `data.json`:

```json
{
  "id": "uuid",
  "referenceName": "string",
  "absolutePath": "string",
  "type": "folder" | "file",
  "status": "active" | "paused" | "completed" | "idea" | "archived",
  "tags": ["string"],
  "description": "string | null",
  "createdAt": "ISO8601",
  "lastOpenedAt": "ISO8601",
  "pinned": false
}
```

Storage path: `~/Library/Application Support/Anchor/data.json`.

---

## Key Docs

- [../project.md](../project.md) — Vision, MVP features, storage
- [../roadmap/phase-1.md](../roadmap/phase-1.md) — Phase 1 scope and success criteria
- [../menubar.md](../menubar.md) — Popover layout, wireframe, keyboard behavior

---

## After Review

1. You review each plan file in `docs/plans/`.
2. We execute **01-storage-and-shell** first, then 02 → 07 in order.
3. After each plan, we verify the outcome before moving to the next.
