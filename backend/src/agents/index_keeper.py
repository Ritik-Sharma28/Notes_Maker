"""
Index Keeper Agent — routes extracted topic groups to topic buckets in the database.

Key improvement: tracks topic + angle, not just topic.
- SAME: merge into existing topic (same angle already covered)
- EXTEND: same topic but new angle — append facts, mark for re-authoring
- SUBTOPIC: create as child of existing topic
- UNRELATED: create new top-level topic

Uses embedding similarity for fast matching, falls back to LLM for ambiguous cases.
"""
import uuid
import json
import logging
from langchain_core.messages import HumanMessage
from src.llm.factory import get_llm
from src.schemas.pipeline import PipelineState
from src.config.constants import (
    PROMPTS_DIR,
    SIMILARITY_HIGH_THRESHOLD,
    SIMILARITY_LOW_THRESHOLD,
)
from src.embeddings.service import embedding_service
from src.db.session import async_session_maker
from src.db.repository import Repository
from sqlalchemy import select
from src.models.topic import Topic
from src.models.raw_fact import RawFact
from src.models.code_block import CodeBlock
from src.models.comparison_table import ComparisonTable

logger = logging.getLogger(__name__)


async def run(state: PipelineState) -> dict:
    extracted_groups = state.get("extracted_groups", [])
    source_id = uuid.UUID(state["source_id"])
    dirty_topic_ids = set()
    reference_index = state.get("reference_index", {})

    if not extracted_groups:
        return {"dirty_topic_ids": [], "reference_index": reference_index}

    prompt_path = PROMPTS_DIR / "index_keeper.txt"
    prompt_text = prompt_path.read_text(encoding="utf-8")
    llm = get_llm("index_keeper")

    async with async_session_maker() as session:
        repo = Repository(session)

        for group in extracted_groups:
            topic_guess = group["topic_guess"]
            new_angle = group.get("angle", "general")
            vec = embedding_service.embed(topic_guess)

            user_uuid = uuid.UUID(state["user_id"])

            # Query similar topics by embedding for this user
            result = await session.execute(
                select(Topic, (1 - Topic.embedding.cosine_distance(vec)).label("similarity"))
                .where(Topic.user_id == user_uuid)
                .order_by(Topic.embedding.cosine_distance(vec))
                .limit(3)
            )
            top_matches = result.all()

            resolved_topic_id = None
            action = "new"

            if top_matches:
                best_topic, best_similarity = top_matches[0]

                if best_similarity > SIMILARITY_HIGH_THRESHOLD:
                    # High confidence match — check if angle is new or same
                    existing_angles = reference_index.get(str(best_topic.id), [])
                    if new_angle in existing_angles:
                        action = "same"
                    else:
                        action = "extend"
                    resolved_topic_id = best_topic.id

                elif best_similarity < SIMILARITY_LOW_THRESHOLD:
                    # Clearly different topic
                    action = "new"

                else:
                    # Ambiguous — call LLM to decide
                    existing_angles = reference_index.get(str(best_topic.id), [])
                    formatted_prompt = prompt_text.format(
                        title=best_topic.title,
                        existing_angles=json.dumps(existing_angles) if existing_angles else "[]",
                        topic_guess=topic_guess,
                        new_angle=new_angle,
                    )
                    try:
                        response = await llm.ainvoke(
                            [HumanMessage(content=formatted_prompt)]
                        )
                        decision = response.content.strip().upper()
                        if decision == "SAME":
                            action = "same"
                            resolved_topic_id = best_topic.id
                        elif decision == "EXTEND":
                            action = "extend"
                            resolved_topic_id = best_topic.id
                        elif decision == "SUBTOPIC":
                            action = "subtopic"
                            new_topic = await repo.create_topic(
                                user_id=uuid.UUID(state["user_id"]), title=topic_guess, embedding=vec
                            )
                            new_topic.parent_topic_id = best_topic.id
                            session.add(new_topic)
                            await session.flush()
                            resolved_topic_id = new_topic.id
                        else:
                            action = "new"
                    except Exception as e:
                        logger.warning(f"Index Keeper LLM call failed: {e}. Defaulting to new topic.")
                        action = "new"

            # Create new topic if needed
            if resolved_topic_id is None:
                new_topic = await repo.create_topic(user_id=uuid.UUID(state["user_id"]), title=topic_guess, embedding=vec)
                resolved_topic_id = new_topic.id

            # Mark topic as dirty (needs re-authoring)
            topic = await repo.get_topic(resolved_topic_id, uuid.UUID(state["user_id"]))
            if topic:
                topic.is_dirty = True
                session.add(topic)

            # Update reference index with the new angle
            topic_id_str = str(resolved_topic_id)
            if topic_id_str not in reference_index:
                reference_index[topic_id_str] = []
            if new_angle not in reference_index[topic_id_str]:
                reference_index[topic_id_str].append(new_angle)

            # Insert facts
            for fact in group.get("raw_facts", []):
                session.add(
                    RawFact(
                        topic_id=resolved_topic_id,
                        source_id=source_id,
                        user_id=uuid.UUID(state["user_id"]),
                        angle=new_angle,
                        fact_text=fact,
                    )
                )

            # Insert code blocks
            for cb in group.get("code_blocks", []):
                session.add(
                    CodeBlock(
                        topic_id=resolved_topic_id,
                        source_id=source_id,
                        user_id=uuid.UUID(state["user_id"]),
                        label=cb.get("label"),
                        language=cb.get("language"),
                        code=cb.get("code"),
                    )
                )

            # Insert comparison tables
            for tbl in group.get("comparison_tables", []):
                rows = tbl.get("rows", [])
                headers = tbl.get("headers", [])
                # Store headers as first row if present for backward compat
                if headers and rows and rows[0] != headers:
                    rows = [headers] + rows
                session.add(
                    ComparisonTable(
                        topic_id=resolved_topic_id,
                        source_id=source_id,
                        user_id=uuid.UUID(state["user_id"]),
                        title=tbl.get("title"),
                        rows=rows,
                    )
                )

            await session.commit()
            dirty_topic_ids.add(topic_id_str)

            logger.info(
                f"Topic '{topic_guess}' → action={action}, "
                f"topic_id={topic_id_str}, angle='{new_angle}'"
            )

    return {
        "dirty_topic_ids": list(dirty_topic_ids),
        "current_topic_idx": 0,
        "reference_index": reference_index,
    }
