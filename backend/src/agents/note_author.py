"""
Note Author Agent — the "tutor" role that transforms raw facts into
polished, exam-ready study notes.

Key design decision: operates on ALL accumulated facts for a topic
(from all sessions/angles), not just the current chunk. This ensures
the note is comprehensive and properly synthesized, not fragmented.

When a topic gets new facts (new angle or follow-up session),
this agent re-authors the FULL note, merging old and new naturally.
"""
import json
import logging
from langchain_core.messages import HumanMessage
from src.llm.factory import get_llm
from src.schemas.pipeline import PipelineState
from src.config.constants import PROMPTS_DIR
from src.db.session import async_session_maker
from sqlalchemy import select
from src.models.topic import Topic
from src.models.raw_fact import RawFact
from src.models.code_block import CodeBlock
from src.models.comparison_table import ComparisonTable

logger = logging.getLogger(__name__)


async def run(state: PipelineState) -> dict:
    topic_ids = state.get("dirty_topic_ids", [])
    idx = state.get("current_topic_idx", 0)

    if idx >= len(topic_ids):
        return {}

    topic_id = topic_ids[idx]

    prompt_path = PROMPTS_DIR / "note_author.txt"
    prompt_text = prompt_path.read_text(encoding="utf-8")

    async with async_session_maker() as session:
        # Get topic title
        topic = await session.get(Topic, topic_id)
        topic_title = topic.title if topic else "Untitled"

        # Fetch ALL facts for this topic (across all sources and sessions)
        facts_res = await session.execute(
            select(RawFact)
            .where(RawFact.topic_id == topic_id)
            .order_by(RawFact.id)  # preserve insertion order
        )
        code_res = await session.execute(
            select(CodeBlock).where(CodeBlock.topic_id == topic_id)
        )
        tbl_res = await session.execute(
            select(ComparisonTable).where(ComparisonTable.topic_id == topic_id)
        )

        # Group facts by angle for the prompt
        facts_by_angle = {}
        for f in facts_res.scalars().all():
            angle = f.angle or "general"
            if angle not in facts_by_angle:
                facts_by_angle[angle] = []
            facts_by_angle[angle].append(f.fact_text)

        code_blocks = [
            {"label": c.label, "language": c.language, "code": c.code}
            for c in code_res.scalars().all()
        ]
        tables = [
            {"title": t.title, "rows": t.rows}
            for t in tbl_res.scalars().all()
        ]

    # Build structured facts payload for the prompt
    facts_data = {
        "topic_title": topic_title,
        "facts_by_angle": facts_by_angle,
        "code_blocks": code_blocks,
        "comparison_tables": tables,
    }

    # Flatten facts for the reviewer (all facts as a single list)
    all_facts = []
    for angle_facts in facts_by_angle.values():
        all_facts.extend(angle_facts)

    # Build feedback section if this is a rewrite
    feedback_section = ""
    if state.get("needs_rewrite") and state.get("retry_count", 0) > 0:
        feedback = state.get("reviewer_feedback", "")
        feedback_section = (
            f"\n\nREVIEWER FEEDBACK — You MUST fix these issues in your rewrite:\n{feedback}"
        )

    formatted_prompt = prompt_text.format(
        facts=json.dumps(facts_data, indent=2),
        feedback_section=feedback_section,
    )

    llm = get_llm("note_author")
    response = await llm.ainvoke([HumanMessage(content=formatted_prompt)])

    note_content = response.content

    # Strip any markdown code fences the LLM might have wrapped the output in
    if note_content.startswith("```markdown"):
        note_content = note_content[len("```markdown") :].strip()
    if note_content.startswith("```"):
        note_content = note_content[3:].strip()
    if note_content.endswith("```"):
        note_content = note_content[:-3].strip()

    logger.info(
        f"Note authored for topic '{topic_title}' "
        f"({len(all_facts)} facts, {len(code_blocks)} code blocks, {len(tables)} tables)"
    )

    return {
        "current_note_md": note_content,
        "current_raw_facts": all_facts,
    }
