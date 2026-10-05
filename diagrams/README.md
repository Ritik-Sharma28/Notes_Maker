# ChatNotes System Architecture Diagrams

This directory contains Mermaid diagrams visualizing the ChatNotes system architecture, agent flows, and data structures.

## Diagrams

### 1. High-Level Architecture (`01-high-level-architecture.mmd`)
**Overview**: Complete system architecture showing all layers and components

**Shows**:
- Client layer (Web/Mobile apps)
- API Gateway (FastAPI with auth, rate limiting, CORS)
- Synchronous API routes (sources, progress, topics, export)
- Asynchronous API (ingest)
- Background task queue (Redis + arq)
- LangGraph agent pipeline (7 agents)
- Data layer (PostgreSQL, Redis, Supabase)

**View**: Open in [Mermaid Live Editor](https://mermaid.live/) or use `mermaid-cli` to render

---

### 2. Agent Pipeline Flow (`02-agent-pipeline-flow.mmd`)
**Overview**: Detailed flow of the LangGraph agent pipeline from start to finish

**Shows**:
- Phase 1: Message extraction (ChatGPT/Raw paste)
- Phase 2: LangGraph execution
- All 8 nodes in the pipeline:
  - build_patches (non-LLM)
  - extract (LLM)
  - index_route (LLM+Embeddings)
  - author_note (LLM)
  - review (LLM)
  - diagram (LLM+Regex)
  - format (non-LLM)
  - next_topic (non-LLM)
- Conditional routing logic
- Retry loops (reviewer, more topics)
- Success/failure paths

**View**: Open in [Mermaid Live Editor](https://mermaid.live/)

---

### 3. Database Schema (`03-database-schema.mmd`)
**Overview**: Entity-Relationship diagram of the entire database schema

**Shows**:
- auth.users (Supabase)
- sources
- topics (with self-referencing parent-child)
- raw_facts
- code_blocks
- comparison_tables
- notes
- note_versions
- progress
- All relationships and foreign keys
- Key fields for each table

**View**: Open in [Mermaid Live Editor](https://mermaid.live/)

---

### 4. Authentication Flow (`04-authentication-flow.mmd`)
**Overview**: Sequence diagram showing the JWT authentication and request flow

**Shows**:
- User login via Supabase
- JWT token generation
- API request with Bearer token
- JWT verification (decode, signature, expiration)
- User role determination (admin vs regular)
- Rate limit checking
- Database query with user_id filtering
- Response flow

**View**: Open in [Mermaid Live Editor](https://mermaid.live/)

---

### 5. Note Authoring Flow (`05-note-authoring-flow.mmd`)
**Overview**: Detailed flow of the note authoring process per topic

**Shows**:
- Index Keeper marking topic dirty
- Fetching all related data (facts, code, tables)
- Note Author agent (LLM call)
- Reviewer agent with retry loop
- Diagram Agent (signal detection + generation)
- Formatter agent (diagram insertion + persistence)
- Note versioning
- Next topic iteration

**View**: Open in [Mermaid Live Editor](https://mermaid.live/)

---

### 6. Complete Ingestion Flow (`06-complete-ingestion-flow.mmd`)
**Overview**: Sequence diagram showing the end-to-end ingestion process

**Shows**:
- Client POST /ingest request
- JWT verification and rate limiting
- Source and Progress record creation
- Task enqueue to Redis
- Worker job execution
- Message extraction (Playwright)
- LangGraph pipeline execution
- Database updates (topics, facts, notes)
- Source status updates
- Progress polling

**View**: Open in [Mermaid Live Editor](https://mermaid.live/)

---

### 7. Deployment Architecture (`07-deployment-architecture.mmd`)
**Overview**: Production deployment architecture with horizontal scaling

**Shows**:
- Load balancer (Nginx/ALB)
- API server cluster (multiple instances)
- Worker cluster (multiple instances)
- PostgreSQL with read replicas
- Redis Cluster (3 masters + 3 replicas)
- Supabase Auth service
- Client connections and data flow

**View**: Open in [Mermaid Live Editor](https://mermaid.live/)

---

## How to View Diagrams

### Option 1: Mermaid Live Editor (Easiest)
1. Go to [https://mermaid.live/](https://mermaid.live/)
2. Copy the contents of any `.mmd` file
3. Paste into the editor
4. Diagram will render automatically
5. Export as PNG/SVG if needed

### Option 2: VS Code Extension
1. Install "Markdown Preview Mermaid Support" extension
2. Open the `.mmd` file in VS Code
3. Right-click → "Open Preview"
4. Diagram will render in the preview pane

### Option 3: mermaid-cli (Command Line)
```bash
# Install mermaid-cli
npm install -g @mermaid-js/mermaid-cli

# Render a diagram to PNG
mmdc -i 01-high-level-architecture.mmd -o architecture.png

# Render to SVG
mmdc -i 01-high-level-architecture.mmd -o architecture.svg
```

### Option 4: GitHub / GitLab
- Mermaid diagrams render automatically in `.md` files on GitHub and GitLab
- You can embed diagrams in your README using code blocks with `mermaid` language

---

## Color Legend

**Consistent color scheme across diagrams**:
- 🔵 Blue: Client/User layer
- 🟡 Yellow: API/Gateway layer
- 🟣 Purple: AI/LLM agents
- 🟢 Green: Data layer
- 🔴 Red: Start/End/Error states
- ⚪ White: Logic/Processing nodes

---

## Related Documentation

- **System Design**: See `SYSTEM_DESIGN.md` in project root for detailed HLD/LLD
- **API Documentation**: See `/docs` directory for API specs
- **Database Migrations**: See `/backend/migrations` for schema evolution

---

## Contributing

When adding new diagrams:
1. Use consistent naming: `NN-description.mmd` (NN = number)
2. Follow the color scheme above
3. Update this README with description
4. Keep diagrams focused on single aspect (don't overcomplicate)
5. Test rendering in Mermaid Live Editor before committing
