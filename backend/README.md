# ChatNotes API

ChatNotes API is a production-ready system for ingesting, processing, and generating notes from various data sources (like ChatGPT conversations or raw text). It utilizes a multi-agent LangGraph pipeline to segment, extract, author, review, and diagram notes, saving everything to a secure PostgreSQL database.

## Features

- **Authentication & Authorization**: Integrated with Supabase Auth for seamless user isolation and secure JWT verification.
- **Row Level Security (RLS)**: Enforced at the database level to guarantee that users can only access their own data.
- **Rate Limiting**: Redis-based rate limiting to prevent abuse. Regular users are limited to 2 ingestions per week, while admins have unlimited access.
- **Progress Tracking**: Granular tracking for long-running agentic tasks. Real-time status updates are exposed via the `/api/v1/progress` routes.
- **Robust Error Handling & Retries**: Pipeline states are saved continuously, allowing the system to retry failed extractions without starting over.
- **Background Task Processing**: Heavy tasks run asynchronously via `arq` and Redis to keep the API responsive.

## Prerequisites

- Python 3.11+
- PostgreSQL (with pgvector extension enabled)
- Redis Server
- Supabase Project (for Authentication)

## Environment Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Your Redis connection details.
   - `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`: Your Supabase configuration.

## Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment** — you must do this every time before running the app:

   | Platform | Command |
   |---|---|
   | **Windows (PowerShell)** | `.\venv\Scripts\Activate.ps1` |
   | **Windows (CMD)** | `venv\Scripts\activate.bat` |
   | **macOS / Linux** | `source venv/bin/activate` |

   You'll see `(venv)` in your prompt when it's active.

3. Install the required dependencies (inside the activated venv):
   ```bash
   pip install -e .
   ```

> **Tip:** If the `venv` folder already exists (e.g. after cloning), just activate it and re-run `pip install -e .` to make sure everything is up to date. Running `python` without activating the venv will use the system Python, which doesn't have the project's packages installed.

## Running the Application

> ⚠️ **Always activate the virtual environment first** before running any command below.
> - Windows: `.\venv\Scripts\Activate.ps1`
> - macOS/Linux: `source venv/bin/activate`

1. **Apply Database Migrations**:
   ```bash
   alembic upgrade head
   ```

2. **Start the API Server**:
   ```bash
   python -m uvicorn src.api.app:create_app --host 0.0.0.0 --port 8000 --factory --reload
   ```

3. **Start the Background Worker** (open a second terminal, activate the venv there too):
   ```bash
   python -m arq src.workers.tasks.WorkerSettings
   ```

## Running Tests

To run the test suite (which includes tests for API endpoints, Authentication, and Rate Limiting), use `pytest`:

```bash
pip install -e .[dev]
pytest tests/
```

## API Endpoints

- `POST /api/v1/ingest`: Ingest a new source (requires Auth, subject to rate limits)
- `GET /api/v1/sources`: List all sources for the authenticated user
- `GET /api/v1/progress/{source_id}`: Check the progress of a processing source
- `GET /api/v1/topics`: Get generated topics
- `GET /api/v1/export/{topic_id}/pdf`: Export notes as PDF

## Architecture overview

The system uses `FastAPI` for the web layer, `SQLAlchemy` (asyncio) for database interactions, `arq` and `Redis` for background task queues, and `LangGraph` for the generative AI pipelines. Security dependencies verify Supabase JWTs locally on each request to prevent latency overhead.
