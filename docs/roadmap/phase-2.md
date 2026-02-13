# Phase 2: AI-Powered Natural Language Interface

## Overview

Enable users to find and interact with projects using natural language queries.

---

## Technical Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Query                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Intent Classification Layer                    │
│  ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│  │   SEARCH     │    OPEN      │    LIST      │  SUMMARY  │ │
│  │  "find my    │  "open the   │  "show all   │  "what    │ │
│  │   react      │   project    │   paused     │   AI      │ │
│  │   projects"  │   I worked   │   projects"  │   work    │ │
│  │              │   on for     │              │   last    │ │
│  │              │   stocks"    │              │   week"   │ │
│  └──────────────┴──────────────┴──────────────┴───────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Query Understanding Engine                       │
│                                                              │
│  Input: Natural language string                              │
│  Output: Structured Query Object                             │
│  {                                                           │
│    "intent": "search|open|list|summarize",                   │
│    "filters": {                                              │
│      "status": ["active", "paused"],                         │
│      "tags": ["ai", "ml"],                                   │
│      "dateRange": "last_30_days",                            │
│      "semanticQuery": "stock analysis project"               │
│    },                                                        │
│    "action": "reveal|open_finder|open_vscode|open_terminal"  │
│  }                                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌────────────┴────────────┐
           │                         │
           ▼                         ▼
┌─────────────────────┐   ┌─────────────────────────────┐
│   Semantic Search   │   │   Metadata Filters          │
│   (Vector Search)   │   │   (Exact Matching)          │
│                     │   │                             │
│  • Project names    │   │  • Status: active/paused/   │
│  • Descriptions     │   │    completed/idea/archived  │
│  • Tags             │   │  • Tags: exact match        │
│  • Combined text    │   │  • Type: folder/file        │
│    embedding        │   │  • Date: created/lastOpened │
└──────────┬──────────┘   └──────────────┬──────────────┘
           │                             │
           └─────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Result Ranking & Execution                     │
│                                                              │
│  1. Combine semantic scores with filter matches            │
│  2. Apply recency boost (lastOpenedAt)                      │
│  3. Rank and deduplicate results                           │
│  4. Execute intent action                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Components

### 1. Intent Classification

Uses LLM function calling to extract structured intent from natural language.

**Supported Intents:**

| Intent | Description | Example |
|--------|-------------|---------|
| `search` | Find projects matching criteria | "Find my Flutter projects" |
| `open` | Find and open a specific project | "Open the stock analysis project" |
| `list` | Display filtered list | "Show all paused AI projects" |
| `summarize` | Aggregate and report | "What did I work on last week?" |
| `suggest` | Proactive recommendations | "What should I archive?" |

### 2. Semantic Search Layer

**Text Embedding Generation:**

Combine project fields into searchable text:

```javascript
// Document representation for embedding
documentText = `${referenceName} ${description} ${tags.join(' ')} ${type}`
// Example: "NEPSE Watchlist MVP Stock watchlist project for beginners finance react mvp folder"
```

**Similarity Matching:**
- Cosine similarity between query embedding and project embeddings
- Threshold-based matching (exclude low-confidence results)
- Optional: Keyword fallback for exact matches

### 3. Metadata Filtering Engine

Structured filters applied after semantic search:

```typescript
interface QueryFilters {
  status?: ('active' | 'paused' | 'completed' | 'idea' | 'archive')[];
  tags?: string[];
  type?: ('folder' | 'file')[];
  dateRange?: {
    field: 'createdAt' | 'lastOpenedAt';
    start?: Date;
    end?: Date;
    preset?: 'today' | 'week' | 'month' | 'year';
  };
  pinned?: boolean;
  hasDescription?: boolean;
}
```

**Date Interpretation:**
- "last week" → last 7 days
- "recently" → last 30 days
- "this month" → current calendar month
- "stale" → not opened in 90+ days

### 4. Hybrid Ranking Algorithm

```javascript
function calculateRelevance(project, semanticScore, filters, query) {
  let score = 0;

  // Semantic match weight
  score += semanticScore * 0.5;

  // Exact name match bonus
  if (project.referenceName.toLowerCase().includes(query.toLowerCase())) {
    score += 0.3;
  }

  // Filter match bonus
  if (filters.status?.includes(project.status)) score += 0.1;
  if (filters.tags?.some(tag => project.tags.includes(tag))) score += 0.1;

  // Recency boost (exponential decay)
  const daysSinceOpened = (Date.now() - project.lastOpenedAt) / (1000 * 60 * 60 * 24);
  score += Math.exp(-daysSinceOpened / 30) * 0.2;

  // Pinned boost
  if (project.pinned) score += 0.1;

  return score;
}
```

---

## Data Storage Updates

### Enhanced Project Schema

```typescript
interface Project {
  // Existing fields
  id: string;
  referenceName: string;
  absolutePath: string;
  type: 'folder' | 'file';
  status: 'active' | 'paused' | 'completed' | 'idea' | 'archived';
  tags: string[];
  description?: string;
  createdAt: string;
  lastOpenedAt: string;
  pinned: boolean;

  // Phase 2 additions
  embedding?: number[];        // 384-dim vector (all-MiniLM-L6-v2)
  lastModifiedAt: string;      // For stale detection
  openCount: number;          // Usage analytics
  aiSuggestedTags?: string[];  // Auto-generated tags
}
```

### Vector Storage Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| SQLite + sqlite-vss | Single file, no external deps | Rust extension required | **Primary choice** |
| ChromaDB | Native embedding support | Additional binary | Large datasets |
| In-memory + HNSW | Fast, simple | Lost on restart | Dev/testing only |
| FAISS (via ONNX) | Industry standard | Complex build | Advanced use |

---

## AI Provider Integration

### Supported Providers

| Provider | Use Case | Model |
|----------|----------|-------|
| OpenAI | Cloud-based intent classification | gpt-4o-mini |
| Anthropic | Cloud-based intent classification | claude-3-haiku |
| Ollama | Local inference | llama3.1 / mistral |
| None | Offline mode | Disabled |

### Configuration

```typescript
interface AIConfig {
  provider: 'openai' | 'anthropic' | 'ollama' | 'none';
  apiKey?: string;
  baseUrl?: string;          // For Ollama: http://localhost:11434
  embeddingModel: string;     // 'all-MiniLM-L6-v2' (local) or 'text-embedding-3-small'
  intentModel: string;        // Provider-specific
  temperature: 0.1;           // Low for deterministic extraction
}
```

---

## Query Examples & System Behavior

### Search Queries

| User Query | Extracted Filters | Action |
|------------|-------------------|--------|
| "Find my React projects" | `{ tags: ['react'] }` | List matches |
| "Show paused AI experiments" | `{ status: ['paused'], tags: ['ai'] }` | List matches |
| "What was I working on for stocks?" | `{ semanticQuery: 'stock analysis trading finance' }` | Search + summarize |
| "Projects from last month" | `{ dateRange: { preset: 'month' } }` | List by date |

### Action Queries

| User Query | Intent | Execution |
|------------|--------|-----------|
| "Open the Flutter game" | `open` | Find project → Open in VSCode |
| "Open my portfolio folder in Finder" | `open` | Find project → Reveal in Finder |
| "Show the NEPSE project" | `search` | Highlight + display details |

### Summary Queries

| User Query | Aggregation |
|------------|-------------|
| "What did I work on this week?" | Group by day, count opens |
| "List all completed projects" | Filter status, sort by date |
| "Which projects are stale?" | Filter lastOpenedAt > 90 days |
| "What tags do I use most?" | Aggregate and count tags |

---

## Proactive Features

### Stale Project Detection

Automatic identification of neglected projects:

```typescript
function detectStaleProjects(projects: Project[]): StaleSuggestion[] {
  const now = Date.now();
  const STALE_THRESHOLD = 90 * 24 * 60 * 60 * 1000; // 90 days

  return projects
    .filter(p => !p.pinned) // Exclude pinned
    .filter(p => {
      const lastOpened = new Date(p.lastOpenedAt).getTime();
      return (now - lastOpened) > STALE_THRESHOLD;
    })
    .map(p => ({
      project: p,
      suggestion: p.status === 'completed' ? 'archive' : 'review',
      daysSinceOpened: Math.floor((now - new Date(p.lastOpenedAt).getTime()) / (24 * 60 * 60 * 1000))
    }));
}
```

**User Interface:**
- Badge on menu bar icon when stale projects detected
- Weekly summary notification (optional)
- One-click archive action

### Broken Path Detection

```typescript
async function detectBrokenPaths(projects: Project[]): Promise<Project[]> {
  const broken = [];
  for (const project of projects) {
    const exists = await checkPathExists(project.absolutePath);
    if (!exists) {
      broken.push(project);
    }
  }
  return broken;
}
```

---

## API Design

### Rust Commands (Tauri)

```rust
// Query interface
#[tauri::command]
async fn natural_language_query(
    query: String,
    app_state: State<'_, AppState>,
) -> Result<QueryResult, Error> {
    // 1. Parse intent
    let intent = classify_intent(&query, &app_state.ai_config).await?;

    // 2. Build filters
    let filters = build_filters(&intent)?;

    // 3. Execute search
    let results = match intent.intent_type {
        IntentType::Search => semantic_search(&filters, &app_state).await?,
        IntentType::List => metadata_filter(&filters, &app_state).await?,
        IntentType::Open => {
            let project = find_best_match(&filters, &app_state).await?;
            execute_action(&project, intent.action).await?;
            vec![project]
        }
        IntentType::Summarize => generate_summary(&filters, &app_state).await?,
    };

    Ok(QueryResult {
        intent,
        results,
        execution_time_ms: timer.elapsed(),
    })
}

// Suggestions
#[tauri::command]
async fn get_suggestions(
    app_state: State<'_, AppState>,
) -> Result<Suggestions, Error> {
    Ok(Suggestions {
        stale: detect_stale_projects(&app_state.db).await?,
        broken_paths: detect_broken_paths(&app_state.db).await?,
        recent: get_recently_opened(&app_state.db, 5).await?,
    })
}
```

### TypeScript Types

```typescript
// Query types
interface NaturalLanguageQuery {
  query: string;
  context?: {
    recentProjects?: string[];
    currentStatus?: ProjectStatus;
  };
}

interface QueryResult {
  intent: ParsedIntent;
  results: Project[];
  totalCount: number;
  executionTimeMs: number;
  suggestedAction?: Action;
}

interface ParsedIntent {
  type: 'search' | 'open' | 'list' | 'summarize';
  confidence: number;
  filters: QueryFilters;
  action?: Action;
  naturalLanguageResponse?: string; // For summarize intent
}

type Action =
  | { type: 'reveal_in_finder'; projectId: string }
  | { type: 'open_in_vscode'; projectId: string }
  | { type: 'open_in_terminal'; projectId: string }
  | { type: 'display'; projectIds: string[] };
```

---

## UI/UX Considerations

### Natural Language Input

- Dedicated search mode (toggle from regular search)
- `/` prefix to activate natural language mode
- Visual indicator showing query interpretation
- Confidence threshold for ambiguous queries

### Query Feedback

```
[User types]: "show me paused react projects"

[UI shows interpretation]:
  Intent: List projects
  Filters: status = paused, tags = react
  Found: 3 projects

[Results displayed with option to refine]
```

### Ambiguity Handling

When confidence < 0.7:
- Display multiple interpretations
- Let user select intended meaning
- Learn from selection for future queries

---

## Implementation Phases

### Phase 2.1: Intent Classification
- Implement function calling with OpenAI/Anthropic
- Build query parsing layer
- Add structured filter extraction

### Phase 2.2: Semantic Search
- Integrate embedding generation
- Set up vector storage (sqlite-vss)
- Implement similarity search
- Build hybrid ranking

### Phase 2.3: Proactive Features
- Stale project detection
- Broken path detection
- Weekly summary reports
- Smart suggestions

### Phase 2.4: Local AI Support
- Ollama integration
- Local embedding models
- Fully offline mode

---

## Privacy & Security

- Embeddings generated locally (transformers.js or Ollama)
- Intent classification can use local models
- Cloud AI is optional and user-configurable
- No project content sent to external services
- Only metadata (names, tags, descriptions) may be processed by LLM

---

## Success Metrics

- Query accuracy: >85% correct intent classification
- Search relevance: Top result is user intent in >80% of queries
- Latency: <500ms for local queries, <2s for cloud-assisted
- Feature adoption: >50% of users enable AI features

---

## Dependencies

```toml
# Cargo.toml additions
[dependencies]
sqlite-vss = "0.1"           # Vector similarity search
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
chrono = "0.4"
```

```json
// package.json additions
{
  "dependencies": {
    "@xenova/transformers": "^2.17.2"  // For local embeddings
  }
}
```
