# Plan 01: Storage and Shell

> **Status: ✅ COMPLETE**

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Tauri app shows a menu bar (tray) icon; reads and writes `~/Library/Application Support/Anchor/data.json`; creates the directory and file if missing. No UI changes yet beyond ensuring the app runs as a tray app.

**Architecture:** Use Tauri’s system tray (macOS menu bar). Define the reference schema in Rust; implement commands to get data path, read JSON, write JSON, and ensure app support dir exists. Frontend can stay placeholder for now.

**Tech Stack:** Tauri 2, Rust (serde_json, std::fs, std::path), React (minimal).

---

## Prerequisites

- [00-phase1-overview.md](00-phase1-overview.md) read.
- App runs with `bun run tauri dev` (or `cargo tauri dev`).

---

### Task 1: Data path and ensure directory

**Files:**
- Create: `src-tauri/src/storage.rs`
- Modify: `src-tauri/src/lib.rs` (register module, call from commands)

**Step 1:** Add `storage.rs` with a function that returns the Anchor data directory path.

- Use `tauri::api::path::app_data_dir(&config)` (or Tauri 2 equivalent: `app_handle.app_data_dir()`) to get the app data dir, then join `"Anchor"`.
- Add a function `ensure_anchor_data_dir() -> Result<PathBuf, std::io::Error>` that creates the dir if it doesn’t exist and returns the path.

**Step 2:** In `lib.rs`, add `mod storage;` and ensure the app has access to the config/app handle so `storage::ensure_anchor_data_dir()` can be called (e.g. from a command that receives `AppHandle`).

**Step 3:** Verify. Run `cargo build -p anchor` (or `bun run tauri build`) from repo root. Expected: build succeeds.

**Step 4:** Commit.

```bash
git add src-tauri/src/storage.rs src-tauri/src/lib.rs
git commit -m "chore(tauri): add storage module and ensure Anchor data dir"
```

---

### Task 2: Define reference schema and storage types in Rust

**Files:**
- Create: `src-tauri/src/models.rs` (or add to `storage.rs`)
- Modify: `src-tauri/Cargo.toml` (add `serde` if not present)

**Step 1:** In `src-tauri/Cargo.toml`, ensure `serde = { version = "1", features = ["derive"] }` and `serde_json` are in `[dependencies]`.

**Step 2:** Create `models.rs` with structs matching the reference schema:

- `Reference` with: `id`, `reference_name`, `absolute_path`, `type_` (enum or string: folder/file), `status` (enum or string), `tags` (Vec<String>), `description` (Option<String>), `created_at`, `last_opened_at`, `pinned`.
- Use serde rename so JSON keys match: `referenceName`, `absolutePath`, `createdAt`, `lastOpenedAt`.
- `StorageFile` or similar: `references: Vec<Reference>` for the root of `data.json`.

**Step 3:** In `lib.rs`, add `mod models;`. Build. Expected: compile success.

**Step 4:** Commit.

```bash
git add src-tauri/src/models.rs src-tauri/Cargo.toml src-tauri/src/lib.rs
git commit -m "chore(tauri): add Reference and storage models"
```

---

### Task 3: Read and write data.json

**Files:**
- Modify: `src-tauri/src/storage.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1:** In `storage.rs`, add:

- `data_file_path() -> PathBuf`: `ensure_anchor_data_dir()` then join `"data.json"`.
- `read_references() -> Result<Vec<Reference>, Error>`: read file, parse JSON, return `references` array (or empty vec if file missing/empty).
- `write_references(refs: &[Reference]) -> Result<(), Error>`: serialize to JSON, write to data file path (create parent dir if needed).

**Step 2:** Expose Tauri commands in `lib.rs`: `get_references` (returns Vec<Reference>), `write_references(refs: Vec<Reference>)` (call `storage::write_references`). Register in `invoke_handler`.

**Step 3:** Build and run. From frontend, call `invoke('get_references')` and log result. Expected: `[]` or existing data; no panic.

**Step 4:** Commit.

```bash
git add src-tauri/src/storage.rs src-tauri/src/lib.rs
git commit -m "feat(tauri): read/write references to data.json"
```

---

### Task 4: System tray (menu bar) icon

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/tauri.conf.json` (if needed for window visibility)
- Icons: use existing `src-tauri/icons/` (e.g. `icon.png` or tray icon)

**Step 1:** In `lib.rs`, create a system tray with an icon (use `tauri::Manager`, tray builder). Set a simple menu item if needed (e.g. "Quit"). On macOS, the app should show in the menu bar.

**Step 2:** Configure the main window so it doesn’t show on startup (e.g. `visible: false` in window config, or create no window until "Open Anchor"). Goal: app runs and only the tray icon is visible by default.

**Step 3:** Run `bun run tauri dev`. Expected: menu bar icon appears; app doesn’t open a window on launch (or opens and you can hide it for now).

**Step 4:** Commit.

```bash
git add src-tauri/src/lib.rs src-tauri/tauri.conf.json
git commit -m "feat(tauri): add system tray (menu bar) icon"
```

---

## Verification

- Tray icon visible in macOS menu bar.
- `get_references` returns `[]` when `data.json` is missing; after writing via `write_references`, `get_references` returns the written data.
- `~/Library/Application Support/Anchor/data.json` exists after first write.

---

## Handoff

When this plan is done, proceed to [02-menubar-popover.md](02-menubar-popover.md).
