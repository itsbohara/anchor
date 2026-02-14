Love it. Let's formalize **Anchor** properly.

Below is a complete PROJECT.md you can directly use in your repo.

---

# **Anchor**

**Anchor** is a lightweight macOS menu bar app that helps you organize, remember, and instantly access your local projects, folders, and files.

It adds a structured memory layer over your filesystem — so you never lose track of what you were working on, where it lives, or what state it's in.

---

## **🚀 Vision**

Finder shows files.

Anchor shows meaning.

Anchor is a curated, searchable, metadata-driven reference index for your local machine — enhanced with optional AI-powered natural language querying.

---

## **🎯 Problem Statement**

Developers and creators often:
- Create many projects across different directories
- Experiment frequently
- Pause and resume work
- Forget where projects are located
- Lose context after a few days

Finder does not store:
- Project intent
- Status (active, paused, completed)
- Notes
- Tags
- Quick workflow actions

Anchor solves this by acting as a **personal project registry**.

---

## **🧠 Core Concept**

Anchor does not replace Finder.

Instead, it provides:
- A curated reference list
- Metadata (status, tags, notes)
- Search by name or intent
- Quick actions (Finder, Terminal, VSCode)
- Optional AI-based natural language recall

It is fully local and designed to be open source.

---

## **🖥 Platform**

- macOS
- Menu bar application
- Local-only (no cloud dependency by default)
- Data stored locally (JSON / SQLite)

---

## **📦 MVP Feature Set (Version 1)**

### **1. Add Reference**

Users can manually add:
- Folder
- File

With:
- Reference name (custom)
- Absolute path
- Type (folder / file)
- Status
- Tags
- Optional description

No automatic system-wide indexing.

---

### **2. Search & Filter**

- Search by reference name
- Filter by:
  - Status
  - Tags
  - Type
- Instant results (keyboard-first experience)

---

### **3. Quick Actions**

For each reference:
- Open in Finder
- Open in Terminal
- Open in VSCode
- Reveal file location

Keyboard shortcuts supported:
- Enter → default action
- Cmd + Enter → open in Terminal
- Option + Enter → open in VSCode

---

### **4. Menu Bar Interface**

Clicking the Anchor icon shows:
- Search bar
- Pinned items
- Grouped by status
- Minimal, fast UI

---

### **5. Local Storage**

Data stored in:

```
~/Library/Application Support/Anchor/data.json
```

Structure example:

```json
{
  "id": "uuid",
  "referenceName": "NEPSE Watchlist MVP",
  "absolutePath": "/Users/mahesh/Projects/nepse-watchlist",
  "type": "folder",
  "status": "active",
  "tags": ["finance", "react", "mvp"],
  "description": "Stock watchlist project for beginners",
  "createdAt": "2026-02-10T12:00:00Z",
  "lastOpenedAt": "2026-02-12T08:00:00Z",
  "pinned": true
}
```

---

## **📊 Status Types**

- active
- paused
- completed
- idea
- archived

---

## **🧩 Use Cases**

### **Developer Use Cases**

- "Where is my Flutter game project?"
- "Which Go project was I working on?"
- "List my paused AI experiments."
- Open last active project instantly.
- Quickly jump into Terminal at project root.

---

### **Research / Document Use Cases**

- Track research folders
- Track PDFs and academic papers
- Organize writing drafts
- Manage business documents

---

### **Memory Recall Use Cases**

- "Which project did I work on last week?"
- "Show projects I haven't opened in 30 days."
- Identify stale projects.

---

## **🤖 AI Integration (Phase 2)**

Anchor will include optional AI-powered querying.

AI is a feature — not the brand.

---

### **Example Queries**

- "Which project was I working on for stock analysis?"
- "Show me paused AI projects."
- "List all completed research documents."
- "Open the Flutter game project."

---

### **AI Workflow**

1. User enters natural language query.
2. Anchor sends query + metadata context to LLM.
3. LLM returns structured response.
4. User selects result.
5. Anchor executes action.

---

### **AI Capabilities**

- Intent-based search
- Category reasoning
- Status filtering via natural language
- Suggest archiving stale projects
- Summarize projects by tag

---

### **AI Modes**

- Local model (optional)
- Cloud API (optional)
- Fully offline mode available (AI disabled)

---

## **🔒 Privacy Philosophy**

- Local-first
- No automatic indexing
- No background scanning
- AI optional
- User data remains local unless explicitly configured

---

## **🧱 Architecture Overview**

**Frontend:**
- React + Zustand

**Backend:**
- Tauri (Rust) for:
  - File system access
  - Terminal launching
  - Finder integration

**Storage:**
- JSON (MVP)
- SQLite (future)

---

## **🛣 Future Roadmap**

### **Phase 2**

- AI natural language search
- Stale project detection
- Broken path detection
- Import / Export JSON

### **Phase 3**

- Git detection (.git)
- Auto tag suggestions
- Activity history
- Spotlight integration

### **Phase 4**

- Multi-device sync (optional)
- Plugin system
- Finder right-click "Add to Anchor"

---

## **🧭 Non-Goals**

- Not a cloud SaaS
- Not a file manager replacement
- Not automatic OS-wide indexer
- Not a Git client
- Not a code editor

---

## **🎨 Design Principles**

- Minimal
- Keyboard-first
- Fast
- No clutter
- Developer-friendly
- Lightweight

---

## **🪝 Why the Name "Anchor"**

An anchor holds something steady.

Anchor:
- Anchors your scattered projects
- Anchors your ideas
- Anchors your memory to real paths
- Anchors context to folders

---

## **🏁 Final Goal**

Anchor becomes:

> The personal memory layer for your macOS filesystem.

A simple, open-source tool that reduces cognitive load and makes switching between projects effortless.
