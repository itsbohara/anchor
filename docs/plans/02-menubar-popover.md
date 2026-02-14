# Plan 02: Menu Bar Popover

> **Status: ✅ COMPLETE**

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Clicking the tray icon opens a popover (small window) with: search bar (focus on open), pinned section, references grouped by status (scrollable), quick actions per reference (Finder, Terminal, VSCode), and footer "Open Anchor". Layout and behavior follow [../menubar.md](../menubar.md).

**Architecture:** Tauri: tray click opens a popover window (transparent/decorations off, positioned under the tray). Rust commands: get_references, open_in_finder, open_in_terminal, open_in_vscode, reveal_path. Frontend: React + Zustand; single view with search state and filtered/grouped list; keyboard: Enter, Cmd+Enter, Option+Enter.

**Tech Stack:** React 19, Zustand, Tauri 2, @tauri-apps/plugin-opener (or shell/open for Finder/Terminal/VSCode).

---

## Prerequisites

- [01-storage-and-shell.md](01-storage-and-shell.md) completed (tray + read/write data.json).
- [../menubar.md](../menubar.md) read for layout and keyboard behavior.

---

### Task 1: Tauri commands for opening paths (Finder, Terminal, VSCode)

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Check: `src-tauri/Cargo.toml` (opener/shell plugin)

**Step 1:** Add Tauri commands (or use existing opener plugin):

- `open_in_finder(path: String)` — open path in Finder (e.g. `open` on macOS or opener API).
- `open_in_terminal(path: String)` — open Terminal at path (e.g. `open -a Terminal path` or run `open -a Terminal .` with cwd).
- `open_in_vscode(path: String)` — open in VS Code (e.g. `code <path>` or `open -a "Visual Studio Code" path`).
- `reveal_in_finder(path: String)` — reveal and select in Finder (e.g. `open -R path` on macOS).

**Step 2:** Register commands in `invoke_handler`. Build. Expected: success.

**Step 3:** Commit.

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(tauri): add open_in_finder, open_in_terminal, open_in_vscode, reveal"
```

---

### Task 2: Popover window on tray click

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/tauri.conf.json` (optional: window defaults)

**Step 1:** On tray icon click, create or show a small window (e.g. 320x400) used as the popover. Position it under the tray icon (use Tauri’s tray position APIs if available, or fixed offset). Set window: transparent background if desired, no title bar, focus on show.

**Step 2:** When tray is clicked again while popover is visible, hide or close the popover window (toggle behavior). Ensure only one popover window exists (reuse same window).

**Step 3:** Run app; click tray. Expected: popover window appears near the tray; clicking tray again hides it.

**Step 4:** Commit.

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(tauri): open popover window on tray click"
```

---

### Task 3: Add Zustand and types for references (frontend)

**Files:**
- Modify: `package.json` (add zustand)
- Create: `src/types/references.ts`
- Modify: `src/App.tsx` (or create popover entry)

**Step 1:** Run `bun add zustand`. Add TypeScript types for `Reference` (id, referenceName, absolutePath, type, status, tags, description, createdAt, lastOpenedAt, pinned) matching Rust schema.

**Step 2:** Create a small store (e.g. `useReferencesStore`) that holds `references: Reference[]` and `loadReferences()` that calls `invoke('get_references')` and sets state. No UI yet.

**Step 3:** Commit.

```bash
git add package.json bun.lock src/types/references.ts src/stores/ (or where store lives)
git commit -m "chore(frontend): add Zustand and reference types"
```

---

### Task 4: Popover UI shell (search, sections, footer)

**Files:**
- Create: `src/components/MenubarPopover.tsx` (or similar)
- Modify: `src/App.tsx` (render MenubarPopover when in popover mode)
- Create: `src/components/MenubarPopover.css` (or use existing App.css)

**Step 1:** Build the layout per [../menubar.md](../menubar.md):

- Top: search input, placeholder "Search references…".
- Then: "Pinned" section (list of pinned refs by name).
- Divider.
- Grouped list: group by status (Active, Paused, Idea, Completed, Archived). Only this area scrolls (overflow-y: auto).
- Divider.
- Footer: "Open Anchor" button/link.

**Step 2:** On mount, focus the search input (useEffect + ref). Load references from store (invoke get_references and set in store).

**Step 3:** Search: filter references by `referenceName` (and optionally tags/type) as user types; show only matching in pinned and grouped list.

**Step 4:** Commit.

```bash
git add src/components/MenubarPopover.tsx src/App.tsx
git commit -m "feat(ui): menubar popover layout with search and grouped list"
```

---

### Task 5: Quick actions and keyboard shortcuts

**Files:**
- Modify: `src/components/MenubarPopover.tsx`

**Step 1:** For each reference row, add actions (icons or buttons on hover/selection): Open in Finder (default), Terminal, VSCode, Reveal. Call the Tauri commands with `absolutePath`. Default action (e.g. Enter): open in Finder.

**Step 2:** Keyboard: Arrow keys move selection in the list; Enter = default (Finder); Cmd+Enter = Terminal; Option+Enter = VSCode. Track selected index in state; handle keydown on popover container.

**Step 3:** Optional: update `lastOpenedAt` when user opens a reference (add Tauri command that updates one reference and writes all, or do it in a single write after action).

**Step 4:** Commit.

```bash
git add src/components/MenubarPopover.tsx
git commit -m "feat(ui): quick actions and keyboard shortcuts in popover"
```

---

### Task 6: "Open Anchor" opens dashboard (placeholder)

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/components/MenubarPopover.tsx`

**Step 1:** Add a Tauri command or use existing window API: e.g. `open_dashboard()` that creates and shows the main "dashboard" window (can be the same as the default 800x600 window for now). If using two windows, ensure dashboard has a distinct label.

**Step 2:** In popover footer, "Open Anchor" triggers that command (e.g. `invoke('open_dashboard')`). After opening, optionally hide the popover.

**Step 3:** Test: click "Open Anchor". Expected: dashboard window appears (can show a placeholder "Dashboard" title for now).

**Step 4:** Commit.

```bash
git add src-tauri/src/lib.rs src/components/MenubarPopover.tsx
git commit -m "feat: Open Anchor opens dashboard window"
```

---

## Verification

- Tray click shows popover with search, pinned, grouped list, footer.
- Search filters by name (and optionally tags).
- Enter / Cmd+Enter / Option+Enter perform correct actions.
- "Open Anchor" opens the dashboard window.

---

## Handoff

When this plan is done, proceed to [03-dashboard-window.md](03-dashboard-window.md).
