
# ChatNotes System Design Documentation

Comprehensive system design documentation including High-Level Design (HLD), Low-Level Design (LLD), agent pipeline flows, database schema, and architecture diagrams for the ChatNotes multi-agent note generation system.

# ChatNotes System Design Documentation

## Executive Summary

ChatNotes is a production-ready multi-agent system that ingests conversations (ChatGPT or raw text), processes them through a LangGraph pipeline, and generates structured, exam-ready study notes. The system uses 7 specialized agents orchestrated via LangGraph, with PostgreSQL + pgvector for storage, Redis for rate limiting and background tasks, and Supabase for authentication.

---

## High-Level Design (HLD)

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  (Web/Mobile App - provides ChatGPT URLs or raw text input)      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS + JWT Token
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (FastAPI)                       │
│  - Authentication (Supabase JWT verification)                    │
│  - Rate Limiting (Redis-based)                                   │
│  - Request Validation                                            │
│  - CORS Middleware                                               │
└─────────┬───────────────────────────────┬────────────────────────┘
          │                               │
          ▼                               ▼
┌──────────────────────┐      ┌──────────────────────────┐
│  Synchronous API     │      │  Background Task Queue   │
│  Routes              │      │  (arq + Redis)           │
│  - GET /sources      │      │                          │
│  - GET /progress     │      │  Queue: run_pipeline_task│
│  - GET /topics       │      │                          │
│  - GET /export       │      └──────────┬───────────────┘
│  - POST /ingest      │                   │
└──────────┬───────────┘                   ▼
           │                   ┌──────────────────────┐
           │                   │  Background Worker   │
           │                   │  (arq worker)        │
           │                   │                      │
           │                   │  Executes:           │
           │                   │  - run_pipeline()    │
           │                   └──────────┬───────────┘
           │                              │
           └──────────────┬───────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LangGraph Agent Pipeline                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Patch Builder │─▶│  Extractor   │─▶│Index Keeper  │          │
│  │(non-LLM)     │  │  (LLM)       │  │(LLM+Emb)     │          │
│  └──────────────┘  └──────────────┘  └──────┬───────┘          │
│                                            │                     │
│                              ┌─────────────▼─────────────┐     │
│                              │   Author → Review Loop    │     │
│                              │   (iterative per topic)   │     │
│                              └─────────────┬─────────────┘     │
│                                            │                     │
│                              ┌─────────────▼─────────────┐     │
│                              │Diagram → Format → Next   │     │
│                              └─────────────┬─────────────┘     │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │    Redis     │  │ Supabase     │          │
│  │ + pgvector   │  │  (Rate Limit) │  │ Auth         │          │
│  │              │  │  + Task Queue│  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. API Layer (FastAPI)
- **Purpose**: HTTP API interface for clients
- **Routes**:
  - `POST /api/v1/ingest` - Submit new source for processing
  - `GET /api/v1/sources` - List user's sources
  - `GET /api/v1/progress/{source_id}` - Track pipeline progress
  - `GET /api/v1/topics` - List generated topics
  - `GET /api/v1/export/{topic_id}/pdf` - Export notes as PDF
  - `GET /api/v1/export/{topic_id}/html` - Export notes as HTML
- **Middleware**:
  - CORS
  - Logging
  - Error handling
  - JWT authentication (Supabase)

#### 2. Background Task Queue (arq + Redis)
- **Purpose**: Offload long-running pipeline tasks
- **Implementation**: arq with Redis backend
- **Worker**: Separate process that runs `run_pipeline_task`
- **Task**: Accepts `source_id`, `user_id`, `user_role`

#### 3. LangGraph Agent Pipeline
- **Purpose**: Orchestrate multi-agent AI processing
- **Graph Type**: StateGraph with conditional routing
- **State Management**: Persistent state tracking for retry capability

#### 4. Data Layer
- **PostgreSQL**: Primary data store with pgvector extension
- **Redis**: Rate limiting, task queue, caching
- **Supabase**: Authentication service (JWT verification)

---

## Low-Level Design (LLD)

### Agent Pipeline Detailed Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Pipeline Entry Point                          │
│                      run_pipeline(source_id)                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1: Message Extraction                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  1. Fetch Source from DB                                     │  │
│  │  2. If share_url: ChatGPTExtractor (Playwright scraping)    │  │
│  │  3. If raw_text: RawPasteExtractor                          │  │
│  │  4. Persist extracted messages to source.raw_json            │  │
│  │  5. Update source.status = "processing"                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 2: LangGraph Pipeline Execution                             │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Initial State:                                             │  │
│  │  {                                                          │  │
│  │    source_id, raw_messages, patches: [],                    │  │
│  │    extracted_groups: [], reference_index: {},              │  │
│  │    dirty_topic_ids: [], current_topic_idx: 0,              │  │
│  │    current_note_md: "", needs_rewrite: false,              │  │
│  │    retry_count: 0, current_diagrams: [], errors: []         │  │
│  │  }                                                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Node 1:        │   │  Node 2:        │   │  Node 3:        │
│  build_patches  │──▶│  extract       │──▶│  index_route    │
│  (non-LLM)      │   │  (LLM)          │   │  (LLM+Emb)      │
└─────────────────┘   └─────────────────┘   └────────┬────────┘
                                                       │
                                      ┌────────────────┴────────────────┐
                                      │  Conditional: _has_dirty_topics?│
                                      └────────────────┬────────────────┘
                                                       │
                              ┌────────────────────────┴────────────────┐
                              │ NO ──────────────── YES                 │
                              ▼                                        ▼
                        ┌──────────────┐                   ┌─────────────────────┐
                        │    END       │                   │  Node 4: author_note│
                        └──────────────┘                   │  (LLM)              │
                                                           └──────────┬─────────┘
                                                                      │
                                                                      ▼
                                                           ┌─────────────────────┐
                                                           │  Node 5: review     │
                                                           │  (LLM)              │
                                                           └──────────┬─────────┘
                                                                      │
                                      ┌───────────────────────────────┴───────────────────┐
                                      │  Conditional: _review_decision?                    │
                                      │  (approved OR rewrite)                             │
                                      └───────────────────────────────┬───────────────────┘
                                                                            │
                              ┌─────────────────────────────────────────────┼─────────────────┐
                              │ REWRITE                                       │ APPROVED         │
                              ▼                                               ▼
                    ┌──────────────────┐                             ┌─────────────────────┐
                    │  Loop back to     │                             │  Node 6: diagram     │
                    │  author_note      │                             │  (LLM)              │
                    │  (max 3 retries)  │                             └──────────┬─────────┘
                    └──────────────────┘                                        │
                                                                              ▼
                                                                   ┌─────────────────────┐
                                                                   │  Node 7: format     │
                                                                   │  (non-LLM)          │
                                                                   └──────────┬─────────┘
                                                                              │
                                                                              ▼
                                                                   ┌─────────────────────┐
                                                                   │  Node 8: next_topic  │
                                                                   │  (non-LLM)          │
                                                                   └──────────┬─────────┘
                                                                              │
                                      ┌───────────────────────────────────────┴───────────────────┐
                                      │  Conditional: _more_topics?                               │
                                      └───────────────────────────────┬───────────────────┘
                                                                            │
                              ┌─────────────────────────────────────────────┼─────────────────┐
                              │ MORE                                         │ DONE             │
                              ▼                                               ▼
                    ┌──────────────────┐                             ┌─────────────────────┐
                    │  Loop back to     │                             │      END            │
                    │  author_note      │                             └─────────────────────┘
                    └──────────────────┘
```

### Agent Specifications

#### Agent 1: Patch Builder (Non-LLM)
- **Purpose**: Group raw messages into manageable patches for LLM processing
- **Input**: `raw_messages: list[dict]`
- **Output**: `patches: list[dict]`
- **Logic**:
  - Configurable patch size (default: N message pairs per patch)
  - Each patch includes:
    - `patch_id`: Identifier
    - `start_idx`, `end_idx`: Message indices
    - `text`: Formatted conversation text
    - `context_summary`: Rolling summary from prior messages (cross-patch continuity)
- **LLM Usage**: None (pure Python logic)

#### Agent 2: Extractor (LLM)
- **Purpose**: Extract structured topic groups from conversation patches
- **Input**: `patches: list[dict]`
- **Output**: `extracted_groups: list[dict]`
- **LLM Model**: Configurable (via `EXTRACTOR_MODEL`)
- **Structured Output**: `ExtractorOutput` (Pydantic model)
- **Output Schema**:
  ```python
  TopicGroup:
    - topic_guess: str (title)
    - angle: str (perspective: definition, comparison, deep-dive, etc.)
    - key_question: str (what user was learning)
    - raw_facts: list[str] (lossless extraction)
    - code_blocks: list[CodeBlockExtract]
    - comparison_tables: list[ComparisonTableExtract]
  ```
- **Key Rules**:
  - Extract LOSSLESSLY (no summarization)
  - Group by topic+angle (not just topic)
  - Preserve code exactly
  - Capture user corrections
  - Skip conversational filler

#### Agent 3: Index Keeper (LLM + Embeddings)
- **Purpose**: Route extracted groups to topic buckets using semantic similarity
- **Input**: `extracted_groups: list[dict]`
- **Output**: `dirty_topic_ids: list[str]`, `reference_index: dict`
- **Logic Flow**:
  1. Generate embedding for `topic_guess`
  2. Query pgvector for similar topics (cosine similarity)
  3. Decision logic:
     - **High similarity (> threshold)**: Check if angle is new
       - Same angle → action: "same" (merge)
       - New angle → action: "extend" (mark dirty)
     - **Low similarity (< threshold)**: action: "new" (create new topic)
     - **Ambiguous range**: Call LLM to decide
       - Returns: SAME, EXTEND, SUBTOPIC, or NEW
  4. Create/update Topic records
  5. Insert RawFact, CodeBlock, ComparisonTable records
  6. Mark topic as `is_dirty = True`
  7. Update `reference_index` (topic_id → angles map)
- **LLM Usage**: Only for ambiguous cases (fallback)
- **Embedding Model**: Sentence Transformers (local, no API)

#### Agent 4: Note Author (LLM)
- **Purpose**: Transform raw facts into polished, exam-ready study notes
- **Input**: State with `dirty_topic_ids`, `current_topic_idx`
- **Output**: `current_note_md: str`, `current_raw_facts: list[str]`
- **Key Design**: Operates on ALL accumulated facts for a topic (not just current chunk)
- **Process**:
  1. Fetch Topic record
  2. Fetch ALL RawFacts for topic (grouped by angle)
  3. Fetch ALL CodeBlocks and ComparisonTables
  4. Build structured payload:
     ```json
     {
       "topic_title": "...",
       "facts_by_angle": {
         "definition": ["fact1", "fact2"],
         "comparison": ["fact3", "fact4"]
       },
       "code_blocks": [...],
       "comparison_tables": [...]
     }
     ```
  5. If rewrite: Append reviewer feedback to prompt
  6. Call LLM with note_author prompt
  7. Strip markdown code fences
- **LLM Model**: Configurable (via `NOTE_AUTHOR_MODEL`)

#### Agent 5: Reviewer (LLM)
- **Purpose**: Validate notes against original facts using scoring rubric
- **Input**: `current_note_md: str`, `current_raw_facts: list[str]`
- **Output**: `needs_rewrite: bool`, `reviewer_feedback: str`
- **Structured Output**: `ReviewerOutput` (Pydantic model)
- **Schema**:
  ```python
  ReviewerOutput:
    - approved: bool
    - feedback: str (specific issues if not approved)
  ```
- **Logic**:
  - If approved: Pass to diagram
  - If rejected AND retry_count < MAX_REVIEWER_RETRIES:
    - Set `needs_rewrite = True`
    - Increment `retry_count`
    - Store feedback
    - Loop back to author_note
  - If max retries reached:
    - Append feedback as HTML comment
    - Proceed to diagram
- **LLM Model**: Configurable (via `REVIEWER_MODEL`)

#### Agent 6: Diagram Agent (LLM + Regex)
- **Purpose**: Detect diagram-worthy content and generate Mermaid diagrams
- **Input**: `current_note_md: str`
- **Output**: `current_diagrams: list[dict]`
- **Signal Detection** (Regex-based, no LLM):
  - Sequential process: `step\s+\d|firstly|secondly|workflow|pipeline`
  - Comparison: `\bvs\b|\bversus\b|compared\s+to|difference`
  - State machine: `state|transition|lifecycle|phase|trigger`
  - Architecture: `architecture|component|layer|module|service`
- **Diagram Generation** (LLM):
  - For each detected signal, call LLM with:
    - Signal description
    - Suggested Mermaid type (flowchart TD, flowchart LR, stateDiagram-v2)
    - Note content
  - Extract clean Mermaid code from response
- **Limit**: MAX_DIAGRAMS_PER_NOTE (configurable)
- **LLM Model**: Configurable (via `DIAGRAM_AGENT_MODEL`)

#### Agent 7: Formatter (Non-LLM)
- **Purpose**: Assemble final note with diagrams and persist to database
- **Input**: `current_note_md: str`, `current_diagrams: list[dict]`
- **Output**: `completed_topic_ids: list[str]`
- **Logic**:
  1. Insert diagrams into note at contextually appropriate positions
     - Find related headings
     - Insert after section (before next heading)
     - Fallback: append at end
  2. Check for existing Note record
  3. If exists:
     - Save current version as NoteVersion
     - Update Note with new content + diagrams
     - Increment version
  4. If not exists:
     - Create new Note
  5. Clear `topic.is_dirty = False`
  6. Add topic_id to `completed_topic_ids`
- **Note Versioning**: Preserves history of all note revisions

---

### Database Schema

#### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  auth.users     │       │     sources     │       │     topics      │
│  (Supabase)     │       │                 │       │                 │
│                 │       │  - id (PK)      │       │  - id (PK)      │
│  - id (PK)      │◀──────│  - user_id (FK) │       │  - user_id (FK) │
│  - email        │       │  - platform     │       │  - title        │
│  - ...          │       │  - share_url    │       │  - embedding    │
└─────────────────┘       │  - raw_json     │       │  - parent_id    │
                          │  - status       │       │  - is_dirty     │
                          └────────┬────────┘       └────────┬────────┘
                                   │                          │
                                   │                          │
                                   ▼                          ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │   progress      │       │     notes       │
                          │                 │       │                 │
                          │  - source_id(FK)│       │  - topic_id (FK)│
                          │  - user_id (FK) │       │  - user_id (FK) │
                          │  - current_agent│       │  - content_md   │
                          │  - percentage   │       │  - diagrams     │
                          │  - retry_count  │       │  - version      │
                          │  - agent_state  │       └────────┬────────┘
                          └─────────────────┘                │
                                                                 │
                                                                 ▼
                                                          ┌─────────────────┐
                                                          │  note_versions  │
                                                          │                 │
                                                          │  - note_id (FK)  │
                                                          │  - content_md   │
                                                          │  - diagrams     │
                                                          │  - version      │
                                                          └─────────────────┘

                                   │
                                   │
                          ┌────────┴────────┐
                          │                 │
                          ▼                 ▼
                   ┌──────────────┐  ┌──────────────┐
                   │  raw_facts   │  │ code_blocks  │
                   │              │  │              │
                   │ - topic_id(FK)│ │ - topic_id(FK)│
                   │ - source_id(FK)│ │ - source_id(FK)│
                   │ - angle       │  │ - label       │
                   │ - fact_text   │  │ - language    │
                   └──────────────┘  │ - code        │
                                    └──────────────┘

                          ┌──────────────┐
                          │comparison_tbl│
                          │              │
                          │ - topic_id(FK)│
                          │ - source_id(FK)│
                          │ - title       │
                          │ - rows        │
                          └──────────────┘
```

#### Table Details

**sources**
- `id`: UUID (PK)
- `user_id`: UUID (FK → auth.users)
- `platform`: string (chatgpt, raw_paste)
- `share_url`: string (nullable)
- `raw_json`: JSONB (messages, raw_text)
- `status`: string (pending, processing, completed, failed)
- `error_message`: string (nullable)
- `created_at`, `updated_at`: timestamps

**topics**
- `id`: UUID (PK)
- `user_id`: UUID (FK → auth.users)
- `title`: string
- `parent_topic_id`: UUID (FK → topics.id, nullable, hierarchical)
- `embedding`: vector (pgvector, for similarity search)
- `is_dirty`: boolean (marks topics needing re-authoring)
- `created_at`, `updated_at`: timestamps

**raw_facts**
- `id`: UUID (PK)
- `user_id`: UUID (FK → auth.users)
- `topic_id`: UUID (FK → topics.id)
- `source_id`: UUID (FK → sources.id)
- `angle`: string (perspective: definition, comparison, etc.)
- `fact_text`: text (extracted fact)
- `created_at`, `updated_at`: timestamps

**code_blocks**
- `id`: UUID (PK)
- `topic_id`: UUID (FK → topics.id)
- `source_id`: UUID (FK → sources.id)
- `label`: string (descriptive label)
- `language`: string (python, javascript, etc.)
- `code`: text (source code)
- `created_at`, `updated_at`: timestamps

**comparison_tables**
- `id`: UUID (PK)
- `topic_id`: UUID (FK → topics.id)
- `source_id`: UUID (FK → sources.id)
- `title`: string
- `rows`: JSONB (array of arrays)
- `created_at`, `updated_at`: timestamps

**notes**
- `id`: UUID (PK)
- `user_id`: UUID (FK → auth.users)
- `topic_id`: UUID (FK → topics.id, unique)
- `content_markdown`: text (final note content)
- `diagrams`: JSONB (array of diagram objects)
- `version`: integer (version number)
- `created_at`, `updated_at`: timestamps

**note_versions**
- `id`: UUID (PK)
- `note_id`: UUID (FK → notes.id)
- `content_markdown`: text (snapshot)
- `diagrams`: JSONB (snapshot)
- `version`: integer (version number)
- `created_at`, `updated_at`: timestamps

**progress**
- `id`: UUID (PK)
- `source_id`: UUID (FK → sources.id)
- `user_id`: UUID (FK → auth.users)
- `current_agent`: string (current agent name)
- `current_step`: string (step description)
- `percentage`: integer (0-100)
- `message`: text (status message)
- `error_message`: text (nullable)
- `retry_count`: integer
- `last_agent_state`: JSONB (state for recovery)
- `user_role`: string (regular, admin)
- `created_at`, `updated_at`: timestamps

---

### API Layer Design

#### Request Flow

```
Client Request
    │
    ▼
┌─────────────────────────────────────┐
│  CORS Middleware                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Logging Middleware                  │
│  - Log request details               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  JWT Authentication (if required)    │
│  - Extract Bearer token              │
│  - Verify with Supabase JWT secret   │
│  - Extract user_id, email            │
│  - Determine user_role (admin/regular)│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Rate Limiting Check (if applicable) │
│  - Check Redis for user action count│
│  - Admin: unlimited                  │
│  - Regular: 2/week for ingest        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Route Handler                       │
│  - Validate request body             │
│  - Execute business logic            │
│  - Return response                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Error Handler Middleware            │
│  - Catch exceptions                  │
│  - Log errors                        │
│  - Return appropriate HTTP status    │
└─────────────────────────────────────┘
```

#### Key Endpoints

**POST /api/v1/ingest**
- Purpose: Submit new source for processing
- Auth: Required (JWT)
- Rate Limit: 2/week (regular), unlimited (admin)
- Request Body:
  ```json
  {
    "share_url": "https://chatgpt.com/share/..." (optional),
    "raw_text": "conversation text..." (optional)
  }
  ```
- Response: 202 Accepted
  ```json
  {
    "source_id": "uuid",
    "status": "processing"
  }
  ```
- Side Effects:
  - Create Source record
  - Enqueue background task via arq
  - Create Progress record

**GET /api/v1/sources**
- Purpose: List user's sources
- Auth: Required (JWT)
- Response: 200 OK
  ```json
  [
    {
      "id": "uuid",
      "platform": "chatgpt",
      "status": "completed",
      "created_at": "2024-01-01T00:00:00Z",
      "share_url": "https://..."
    }
  ]
  ```

**GET /api/v1/progress/{source_id}**
- Purpose: Get detailed progress for a source
- Auth: Required (JWT)
- Response: 200 OK
  ```json
  {
    "source_id": "uuid",
    "current_agent": "note_author",
    "current_step": "authoring note for topic X",
    "percentage": 75,
    "message": "Processing...",
    "error_message": null,
    "retry_count": 0,
    "updated_at": "2024-01-01T00:00:00Z"
  }
  ```

**POST /api/v1/sources/{source_id}/retry**
- Purpose: Retry a failed source
- Auth: Required (JWT)
- Rate Limit: 3 attempts per source
- Preconditions: source.status == "failed"
- Response: 200 OK
  ```json
  {
    "message": "Retry initiated",
    "source_id": "uuid"
  }
  ```

**GET /api/v1/topics**
- Purpose: List user's topics
- Auth: Required (JWT)
- Response: 200 OK
  ```json
  [
    {
      "id": "uuid",
      "title": "Server-Side Rendering",
      "parent_topic_id": null,
      "is_dirty": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
  ```

**GET /api/v1/export/{topic_id}/html**
- Purpose: Export note as HTML
- Auth: Required (JWT)
- Response: 200 OK (HTML)
- Preconditions: Note exists for topic

**GET /api/v1/export/{topic_id}/pdf**
- Purpose: Export note as PDF
- Auth: Required (JWT)
- Response: 200 OK (PDF file)
- Preconditions: Note exists for topic

---

### Security Design

#### Authentication Flow

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │
       │ 1. User logs in via Supabase
       │    (frontend handles this)
       ▼
┌──────────────┐
│  Supabase    │
│  Auth        │
└──────┬───────┘
       │
       │ 2. Returns JWT token
       ▼
┌──────────────┐
│   Client     │
└──────┬───────┘
       │
       │ 3. API request with Authorization: Bearer <token>
       ▼
┌──────────────┐
│  FastAPI     │
│  Middleware  │
└──────┬───────┘
       │
       │ 4. Extract token
       ▼
┌──────────────┐
│ verify_jwt() │
│  - Decode    │
│  - Verify    │
│  - Check exp │
└──────┬───────┘
       │
       │ 5. Extract user_id, email
       ▼
┌──────────────┐
│ get_user_role()│
│  - Check if  │
│    email in  │
│    ADMIN_    │
│    EMAILS    │
└──────┬───────┘
       │
       │ 6. Return user_id, user_role
       ▼
┌──────────────┐
│  Route       │
│  Handler     │
└──────────────┘
```

#### Row Level Security (RLS)

**Database-Level Protection**:
- All tables have `user_id` foreign key to `auth.users`
- CASCADE deletes on user deletion
- Application-level filtering in Repository methods:
  ```python
  async def get_user_topics(user_id: uuid.UUID):
    select(Topic).where(Topic.user_id == user_id)
  ```
- Supabase RLS policies enabled on auth schema

#### Rate Limiting

**Implementation**: Redis-based sliding window

**Rules**:
- Regular users: 2 ingestions per week
- Admin users: Unlimited
- Retry: 3 attempts per source per day

**Algorithm**:
```python
key = f"rate_limit:{user_id}:{action}"
current_count = redis.get(key)
if current_count >= max_requests:
    return False, "Rate limit exceeded"
redis.incr(key)
redis.expire(key, window_seconds)
return True, None
```

**Redis Keys**:
- `rate_limit:{user_id}:ingest` - ingestion count
- `rate_limit:{user_id}:retry` - retry count

---

### Background Task Design

#### arq Worker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     API Server                            │
│  POST /api/v1/ingest                                      │
│    → create_source()                                      │
│    → redis.enqueue_job("run_pipeline_task", source_id)   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ Redis Queue
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   arq Worker Process                      │
│  - Polls Redis for jobs                                  │
│  - Executes run_pipeline_task()                          │
│  - Handles retries and errors                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              run_pipeline(source_id)                      │
│  1. Extract messages (if needed)                         │
│  2. Build LangGraph                                      │
│  3. Execute pipeline                                     │
│  4. Update source status                                 │
└─────────────────────────────────────────────────────────┘
```

#### Task Definition

```python
async def run_pipeline_task(ctx, source_id: str, user_id: str, user_role: str):
    await run_pipeline(source_id, user_id, user_role)

class WorkerSettings:
    functions = [run_pipeline_task]
    redis_settings = arq.connections.RedisSettings.from_dsn(settings.REDIS_URL)
```

#### Error Handling

- Pipeline errors caught and logged
- Source status updated to "failed" with error_message
- State saved to Progress.last_agent_state for recovery
- Retry capability via `/retry` endpoint

---

### State Management

#### Pipeline State Persistence

**Purpose**: Enable retry from failed state without reprocessing everything

**Implementation**:
```python
class StateManager:
    async def save_state(source_id, user_id, agent_name, state):
        # Save to Progress.last_agent_state
        await repo.update_progress(
            source_id=source_id,
            current_agent=agent_name,
            agent_state=state
        )
    
    async def load_state(source_id, user_id):
        # Load from Progress.last_agent_state
        progress = await repo.get_progress(source_id, user_id)
        return progress.last_agent_state
    
    async def can_retry(source_id, user_id):
        # Check retry_count < MAX
        progress = await repo.get_progress(source_id, user_id)
        return progress.retry_count < settings.RATE_LIMIT_RETRY_MAX_PER_SOURCE
```

**Retry Flow**:
1. User calls `/retry` endpoint
2. Check if can_retry (retry_count < max)
3. Increment retry_count
4. Re-enqueue pipeline task
5. Agent loads previous state if retry > 0
6. Continue from last successful state

---

### Export System Design

#### HTML Export

**Process**:
1. Fetch Note from database
2. Convert Markdown to HTML using markdown-it-py
3. Apply syntax highlighting with Pygments
4. Render with Jinja2 template
5. Include custom CSS for dark-mode styling
6. Return HTMLResponse

**Components**:
- `markdown-it-py`: Markdown parsing
- `Pygments`: Code syntax highlighting
- `Jinja2`: Template rendering
- Custom CSS: Premium dark-mode styling

#### PDF Export

**Process**:
1. Fetch Note from database
2. Render HTML (same as HTML export)
3. Convert HTML to PDF using WeasyPrint
4. Return FileResponse with PDF

**Library**: WeasyPrint (CSS-to-PDF renderer)

---

### Configuration Management

#### Settings Structure

```python
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_PASSWORD: str
    
    # LLM Configurations (per agent)
    EXTRACTOR_MODEL: str
    EXTRACTOR_BASE_URL: str
    EXTRACTOR_API_KEY: str
    EXTRACTOR_TEMPERATURE: float
    EXTRACTOR_MAX_TOKENS: int
    # ... (similar for other agents)
    
    # Embedding
    EMBEDDING_MODEL_NAME: str
    EMBEDDING_DIMENSION: int
    
    # Thresholds
    SIMILARITY_HIGH_THRESHOLD: float  # 0.85
    SIMILARITY_LOW_THRESHOLD: float   # 0.70
    
    # Pipeline Config
    PATCH_SIZE: int                   # 10 message pairs
    MAX_REVIEWER_RETRIES: int         # 3
    MAX_DIAGRAMS_PER_NOTE: int        # 5
    
    # Supabase Auth
    SUPABASE_URL: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_ANON_KEY: str
    
    # Rate Limiting
    RATE_LIMIT_USER_MAX_PER_WEEK: int = 2
    RATE_LIMIT_ADMIN_MAX_PER_WEEK: int = -1  # unlimited
    RATE_LIMIT_RETRY_MAX_PER_SOURCE: int = 3
    
    # Admin
    ADMIN_EMAILS: list[str] = []
```

#### Environment Variables

Loaded from `.env` file:
```env
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=...
EXTRACTOR_MODEL=gpt-4
EXTRACTOR_BASE_URL=https://api.openai.com/v1
EXTRACTOR_API_KEY=sk-...
# ... (similar for other agents)
SUPABASE_URL=https://...
SUPABASE_JWT_SECRET=...
SUPABASE_ANON_KEY=...
ADMIN_EMAILS=admin@example.com
```

---

## Data Flow Diagrams

### Complete Ingestion Flow

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ POST /api/v1/ingest
       │ {share_url: "..."}
       ▼
┌─────────────────────────────────────┐
│  FastAPI - ingest route             │
│  1. Verify JWT                      │
│  2. Check rate limit                │
│  3. Create Source record            │
│  4. Create Progress record          │
│  5. Enqueue task to Redis           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  arq Worker                         │
│  run_pipeline_task(source_id)      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Pipeline Runner                    │
│  1. Fetch Source                    │
│  2. Extract messages (Playwright)   │
│  3. Update source.status=processing │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  LangGraph Pipeline                  │
│  ┌──────────────────────────────┐  │
│  │ build_patches → extract      │  │
│  │ → index_route → author_note  │  │
│  │ → review → diagram → format  │  │
│  │ → next_topic (loop)          │  │
│  └──────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Database Updates                   │
│  - Create/Update Topics             │
│  - Insert RawFacts, CodeBlocks      │
│  - Create/Update Notes              │
│  - Create NoteVersions              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Update source.status=completed     │
└─────────────────────────────────────┘
```

### Note Authoring Flow (Per Topic)

```
┌─────────────────────────────────────┐
│  Index Keeper marks topic dirty     │
│  dirty_topic_ids = [topic_id]       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  author_note agent                  │
│  1. Fetch Topic                     │
│  2. Fetch ALL RawFacts (by angle)   │
│  3. Fetch ALL CodeBlocks            │
│  4. Fetch ALL ComparisonTables      │
│  5. Build structured payload        │
│  6. Call LLM (note_author)          │
│  7. Return current_note_md          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  reviewer agent                     │
│  1. Call LLM (reviewer)             │
│  2. Get approved + feedback         │
│  3. If rejected:                    │
│     - needs_rewrite = True          │
│     - Increment retry_count         │
│     - Loop back to author_note      │
│  4. If approved:                    │
│     - Proceed to diagram            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  diagram agent                      │
│  1. Detect signals (regex)          │
│  2. For each signal:                │
│     - Call LLM (diagram_agent)      │
│     - Generate Mermaid code         │
│  3. Return current_diagrams         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  formatter agent                    │
│  1. Insert diagrams into note       │
│  2. Check existing Note             │
│  3. If exists:                      │
│     - Save as NoteVersion           │
│     - Update Note                   │
│  4. If not exists:                  │
│     - Create new Note               │
│  5. Clear topic.is_dirty            │
│  6. Add to completed_topic_ids      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  next_topic agent                   │
│  1. Increment current_topic_idx     │
│  2. Reset per-topic state           │
│  3. If more topics: loop back       │
│  4. If done: END                    │
└─────────────────────────────────────┘
```

---

## Error Handling & Resilience

### Agent Retry Logic

```python
class BaseAgent:
    async def run_with_retry(state, source_id, user_id, max_retries=3):
        retry_count = 0
        while retry_count < max_retries:
            try:
                if retry_count > 0:
                    saved_state = await state_manager.load_state(...)
                    state.update(saved_state)
                
                result = await self.execute(state)
                await state_manager.save_state(...)
                return result
            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    await state_manager.save_state(..., error=str(e))
                    raise AgentExecutionError(...)
```

### Pipeline-Level Error Handling

- Try-catch around entire graph execution
- Update source.status = "failed" on error
- Save error_message to Source record
- State preserved in Progress.last_agent_state
- Manual retry via `/retry` endpoint

### Fallback Strategies

- Reviewer: If structured output fails, auto-approve
- Index Keeper: If LLM decision fails, default to "new topic"
- Rate Limiting: If Redis fails, fail-open (allow request)
- Diagram Generation: If generation fails, skip diagram

---

## Scalability Considerations

### Horizontal Scaling

- **API Servers**: Stateless, can run multiple instances behind load balancer
- **arq Workers**: Can run multiple worker processes
- **Redis**: Single point (use Redis Cluster for production)
- **PostgreSQL**: Use read replicas for scaling reads

### Performance Optimizations

- **Embedding Similarity**: pgvector index on topics.embedding
- **Database Queries**: Async SQLAlchemy with connection pooling
- **Background Tasks**: arq for non-blocking pipeline execution
- **Rate Limiting**: Redis in-memory (fast checks)
- **Batch Processing**: Patch builder limits LLM context size

### Resource Management

- **LLM API Calls**: Configurable temperature and max_tokens per agent
- **Playwright**: Headless browser, auto-closed after extraction
- **Database**: Connection pooling via async_session_maker
- **Memory**: State limited to essential data (not full conversation in memory)

---

## Monitoring & Observability

### Logging

- Structured logging via structlog
- Log levels: INFO, WARNING, ERROR
- Key events logged:
  - Pipeline start/completion
  - Agent execution
  - Rate limit violations
  - Authentication failures
  - Database errors

### Progress Tracking

- Real-time progress via `/progress` endpoint
- Per-agent tracking:
  - current_agent
  - current_step
  - percentage
  - message
- Retry count tracking

### Error Tracking

- Optional Sentry integration
- Error context:
  - Agent name
  - Source ID
  - User ID
  - State snapshot

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────┐
│  Docker Compose (optional)      │
│  - PostgreSQL + pgvector        │
│  - Redis                        │
│  - API Server (uvicorn)         │
│  - arq Worker                   │
└─────────────────────────────────┘
```

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                          │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ API Server 1 │ │ API Server 2 │ │ API Server N │
│ (uvicorn)    │ │ (uvicorn)    │ │ (uvicorn)    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ arq Worker 1 │ │ arq Worker 2 │ │ arq Worker N │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌──────────────┐              ┌──────────────┐
│ PostgreSQL    │              │ Redis        │
│ + pgvector    │              │ (Cluster)    │
└──────────────┘              └──────────────┘
        │
        ▼
┌──────────────┐
│ Supabase     │
│ (Auth)       │
└──────────────┘
```

---

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Framework | FastAPI | Web server, routing, middleware |
| Database | PostgreSQL + pgvector | Primary data store, vector similarity |
| Cache/Queue | Redis | Rate limiting, task queue |
| Background Tasks | arq | Async job processing |
| AI Orchestration | LangGraph | Multi-agent pipeline |
| LLM Integration | LangChain + OpenAI | LLM API calls |
| Embeddings | Sentence Transformers | Local embedding generation |
| Web Scraping | Playwright | ChatGPT conversation extraction |
| Authentication | Supabase Auth | JWT verification |
| Markdown | markdown-it-py | Markdown parsing |
| Syntax Highlighting | Pygments | Code highlighting |
| PDF Generation | WeasyPrint | HTML to PDF |
| Template Engine | Jinja2 | HTML templating |
| ORM | SQLAlchemy (async) | Database abstraction |
| Migrations | Alembic | Database schema management |
| Logging | structlog | Structured logging |
| Error Tracking | Sentry (optional) | Error monitoring |

---

## Future Enhancement Opportunities

1. **Multi-source Merging**: Integrate facts from multiple sources into single topics
2. **Collaborative Features**: Share notes between users
3. **Advanced Search**: Full-text search on notes using pgvector
4. **Real-time Updates**: WebSocket for live progress updates
5. **Topic Graph Visualization**: Visualize topic hierarchy
6. **Custom Prompts**: Allow users to customize agent prompts
7. **Export Formats**: Add DOCX, EPUB export options
8. **Analytics**: Track learning progress, topic coverage
9. **Mobile App**: React Native mobile client
10. **Offline Mode**: PWA with offline note viewing

---

## Conclusion

ChatNotes represents a sophisticated multi-agent system that demonstrates:
- **LangGraph Orchestration**: Complex conditional routing between agents
- **State Management**: Persistent state for retry capability
- **Data Modeling**: Hierarchical topics with versioned notes
- **Security**: JWT auth, RLS, rate limiting
- **Scalability**: Background tasks, async operations
- **User Experience**: Real-time progress tracking, retry mechanism

The system transforms unstructured conversations into structured, exam-ready study notes through a carefully designed pipeline of specialized agents, each with a specific responsibility in the knowledge extraction and synthesis process.
