"""
Formatter Agent — assembles the final note with diagrams and persists to database.

Handles:
- Intelligent diagram placement (after relevant headings, not just appended at end)
- Note versioning (saves previous version before overwriting)
- Clearing the dirty flag on the topic
"""
import logging
from src.schemas.pipeline import PipelineState
from src.db.session import async_session_maker
from src.db.repository import Repository
from src.models.note import Note
from src.models.note_version import NoteVersion
from sqlalchemy import select

logger = logging.getLogger(__name__)


def insert_diagrams(note_md: str, diagrams: list[dict]) -> str:
    """Insert Mermaid diagrams into the note at contextually appropriate positions."""
    if not diagrams:
        return note_md

    lines = note_md.split("\n")
    insertions = []  # list of (line_index, mermaid_block)

    for diag in diagrams:
        mermaid_block = f"\n```mermaid\n{diag['mermaid_code']}\n```\n"
        signal_lower = diag.get("signal", "").lower()

        # Try to find a heading that relates to this diagram's signal
        best_idx = None
        for i, line in enumerate(lines):
            if line.startswith("#"):
                heading_text = line.lstrip("#").strip().lower()
                # Check if the heading is related to the diagram's signal
                signal_words = set(signal_lower.split())
                heading_words = set(heading_text.split())
                overlap = signal_words & heading_words
                if overlap:
                    # Find the end of this section (next heading or end of file)
                    next_heading = len(lines)
                    for j in range(i + 1, len(lines)):
                        if lines[j].startswith("#"):
                            next_heading = j
                            break
                    best_idx = next_heading
                    break

        if best_idx is not None:
            insertions.append((best_idx, mermaid_block))
        else:
            # Fallback: append at end
            insertions.append((len(lines), mermaid_block))

    # Insert from bottom to top to preserve indices
    insertions.sort(key=lambda x: x[0], reverse=True)
    for idx, block in insertions:
        lines.insert(idx, block)

    return "\n".join(lines)


async def run(state: PipelineState) -> dict:
    topic_ids = state.get("dirty_topic_ids", [])
    idx = state.get("current_topic_idx", 0)

    if idx >= len(topic_ids):
        return {}

    topic_id = topic_ids[idx]
    note_md = state.get("current_note_md", "")
    diagrams = state.get("current_diagrams", [])

    # Insert diagrams into the note at appropriate positions
    final_note_md = insert_diagrams(note_md, diagrams)

    async with async_session_maker() as session:
        repo = Repository(session)
        topic = await repo.get_topic(topic_id)

        if topic:
            # Check for existing note
            result = await session.execute(
                select(Note).where(Note.topic_id == topic_id)
            )
            existing_note = result.scalar_one_or_none()

            if existing_note:
                # Save current version as a NoteVersion before overwriting
                version_snapshot = NoteVersion(
                    note_id=existing_note.id,
                    content_markdown=existing_note.content_markdown,
                    diagrams=existing_note.diagrams or [],
                    version=existing_note.version,
                )
                session.add(version_snapshot)

                # Update existing note
                existing_note.content_markdown = final_note_md
                existing_note.diagrams = diagrams
                existing_note.version += 1
                session.add(existing_note)
                logger.info(
                    f"Updated note for '{topic.title}' (v{existing_note.version})"
                )
            else:
                # Create new note
                new_note = Note(
                    topic_id=topic_id,
                    content_markdown=final_note_md,
                    diagrams=diagrams,
                    version=1,
                )
                session.add(new_note)
                logger.info(f"Created new note for '{topic.title}'")

            # Clear dirty flag
            topic.is_dirty = False
            session.add(topic)
            await session.commit()

    completed = list(state.get("completed_topic_ids", []))
    completed.append(topic_id)

    return {"completed_topic_ids": completed}
