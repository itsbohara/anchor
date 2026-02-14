# Phase 1: MVP — Menu Bar and Dashboard

## Overview

Phase 1 delivers the core Anchor experience: a **menu bar popover** for quick access and launch, and a **simple dashboard** for managing the reference list (add, edit, change status, and metadata). No AI; local storage only (JSON).

---

## Scope in Two Parts

| Part | Focus | Outcome |
|------|--------|---------|
| **1.1 Menu bar** | Basic popover with search, pinned, grouped list, quick actions | User can browse references, type to search, and open in Finder / Terminal / VSCode from the menu bar. "Open Anchor" opens the dashboard. |
| **1.2 Dashboard** | Simple layout to manage references | User can view the full reference list, add references, edit existing ones, and change status (and tags, description, etc.). |

---

## Part 1.1: Menu Bar MVP

### Purpose

The dropdown shown when the user clicks the Anchor icon. Browse, search, and launch only — no add/edit in the popover.

### Features

- **Search bar** — Placeholder: "Search references…". Sticky at top; focus on open. Type to filter by reference name (and optionally tags/type).
- **Pinned section** — Short list of pinned references.
- **Grouped list** — References grouped by status (Active, Paused, Idea, Completed, Archived). Only this area scrolls.
- **Quick actions per reference** — Open in Finder (default), Open in Terminal, Open in VSCode, Reveal file location. Keyboard: Enter (default), Cmd+Enter (Terminal), Option+Enter (VSCode).
- **Footer** — "Open Anchor" to open the dashboard.

### Layout and behavior

Full layout, wireframe, and keyboard behavior are defined in [../menubar.md](../menubar.md). Implementation should follow that doc.

### Technical notes

- React + Zustand for UI and client state.
- Tauri (Rust) for: reading/writing `data.json`, resolving paths, launching Finder/Terminal/VSCode.
- Data path: `~/Library/Application Support/Anchor/data.json`.

---

## Part 1.2: Simple Dashboard

### Purpose

A separate window (opened via "Open Anchor" from the menu bar) where the user manages the reference list: view all, add, edit, change status, and update metadata.

### Features (for now)

- **Reference list** — Single view of all references (table or list). Show: reference name, path, type, status, tags, pinned. Sort/filter by status or type optional for MVP.
- **Add reference** — Form or flow to add a new reference: reference name, absolute path, type (folder / file), status, tags, optional description. Persist to `data.json`.
- **Edit reference** — Select a reference and edit: name, path, type, status, tags, description, pinned. Save updates storage.
- **Change status** — Inline or in the edit form: set status to active, paused, completed, idea, or archived.
- **Delete reference** — Remove a reference from the list (confirm optional).

No automatic indexing, no AI, no sync. Single local JSON file.

### Dashboard layout (simple)

- **Top:** Optional title/header ("Anchor" or "References").
- **Main area:** Reference list (rows or cards). Each row: name, path (truncated), type, status pill, tags. Actions: Edit, Delete (and optionally quick-launch).
- **Add / Edit:** Either a side panel, modal, or dedicated form view for "Add reference" and "Edit reference" using the same fields. Buttons: Save, Cancel.

```
┌─────────────────────────────────────────────────────────────┐
│  Anchor                                    [Add reference]  │
├─────────────────────────────────────────────────────────────┤
│  Name              │ Path              │ Type   │ Status   │
├────────────────────┼───────────────────┼────────┼──────────┤
│  NEPSE Watchlist   │ ~/Projects/nepse… │ folder │ active   │
│  Flutter game      │ ~/Dev/flutter…     │ folder │ paused   │
│  notes-app         │ ~/Notes/notes     │ file   │ idea     │
│  …                 │ …                 │ …      │ …        │
└─────────────────────────────────────────────────────────────┘

[Click row or "Edit" → open edit form: name, path, type, status, tags, description, pinned. Save / Cancel.]
```

### Data (reference schema)

Same as [project.md](../../project.md) MVP storage. Each reference:

- `id` (uuid)
- `referenceName`
- `absolutePath`
- `type` (folder | file)
- `status` (active | paused | completed | idea | archived)
- `tags` (array of strings)
- `description` (optional)
- `createdAt`, `lastOpenedAt` (ISO strings)
- `pinned` (boolean)

Dashboard reads and writes this structure via Tauri commands; menu bar reads the same file so list and popover stay in sync.

---

## Implementation Order

1. **Storage and shell** — Tauri app with menu bar icon; read/write `data.json`; create file and directory if missing.
2. **Menu bar popover** — Implement layout and behavior from [../menubar.md](../menubar.md): search, pinned, grouped list, quick actions, "Open Anchor" (can initially show a placeholder window).
3. **Dashboard window** — Open from "Open Anchor". Reference list only (read-only) first.
4. **Dashboard: add reference** — Form + Tauri command to append to `data.json`.
5. **Dashboard: edit reference** — Select row, open form with current values, save updates.
6. **Dashboard: delete reference** — Remove by id and persist.
7. **Polish** — Keyboard shortcuts, focus handling, validation (e.g. path exists), and any status-change shortcuts in the list.

---

## Out of Scope in Phase 1

- AI or natural language search (Phase 2).
- Stale/broken path detection, Spotlight, Git detection (later phases).
- Multiple windows, sync, or plugins.
- Automatic indexing; all references are added/edited manually in the dashboard.

---

## Success Criteria

- User can add references (folder or file) from the dashboard with name, path, type, status, tags, description.
- User can edit and delete references and change status from the dashboard.
- Menu bar popover shows all references, search works, quick actions open Finder/Terminal/VSCode correctly.
- "Open Anchor" opens the dashboard; data is consistent between popover and dashboard.
- All data lives in `~/Library/Application Support/Anchor/data.json`.
