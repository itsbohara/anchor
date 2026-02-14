# Agent Rules for Anchor

## Package Manager
- **Preferred**: `bun` (has bun.lock)
- **Fallback**: `npm` (has package-lock.json as backup)
- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bunx` instead of `npx`

## Project Structure
- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **State Management**: Zustand
- **Storage**: Local JSON file at `~/Library/Application Support/com.itsbohara.anchor/Anchor/data.json`

## Build Commands
```bash
# Development
bun run tauri dev

# Build
bun run tauri build

# Type checking
bunx tsc --noEmit

# Rust checking
cd src-tauri && cargo check
```

## Code Conventions
- TypeScript with strict mode
- React functional components with hooks
- snake_case for Rust, camelCase for TypeScript
- Events: `references_changed` for data sync across windows

## Architecture Notes
- Menu bar popover and Dashboard are separate windows
- Use Tauri events (`app.emit()`) to sync state between windows
- Both windows listen for `references_changed` events
