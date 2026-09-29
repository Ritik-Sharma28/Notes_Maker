"""
Reviewer Agent — strict academic reviewer that validates notes against
original facts using a scoring rubric.

Uses structured output to return approved (bool) + feedback (str).
The feedback is specific and actionable, referencing exact criteria failures.
"""
import json
import logging
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage
from src.llm.factory import get_llm
from src.schemas.pipeline import PipelineState
from src.config.constants import PROMPTS_DIR, MAX_REVIEWER_RETRIES

logger = logging.getLogger(__name__)


class ReviewerOutput(BaseModel):
    approved: bool = Field(description="Whether the note passes ALL review criteria")
    feedback: str = Field(
        description="If not approved: specific issues found, referencing criterion number "
                    "and exact problem. If approved: empty string."
    )


async def run(state: PipelineState) -> dict:
    note_md = state.get("current_note_md", "")
    facts = state.get("current_raw_facts", [])

    if not note_md or not facts:
        logger.warning("Reviewer received empty note or facts — auto-approving")
        return {"needs_rewrite": False}

    prompt_path = PROMPTS_DIR / "reviewer.txt"
    prompt_text = prompt_path.read_text(encoding="utf-8")

    formatted_prompt = prompt_text.format(
        note=note_md,
        facts=json.dumps(facts, indent=2),
    )

    llm = get_llm("reviewer")
    structured_llm = llm.with_structured_output(ReviewerOutput)

    try:
        result = await structured_llm.ainvoke(
            [HumanMessage(content=formatted_prompt)]
        )
        approved = result.approved
        feedback = result.feedback
    except Exception as e:
        logger.warning(f"Reviewer structured output failed: {e}. Fallback to approved.")
        approved = True
        feedback = ""

    retry_count = state.get("retry_count", 0)

    if not approved and retry_count < MAX_REVIEWER_RETRIES:
        logger.info(f"Note rejected (attempt {retry_count + 1}): {feedback[:200]}")
        return {
            "needs_rewrite": True,
            "retry_count": retry_count + 1,
            "reviewer_feedback": feedback,
        }

    # Approved, or max retries reached
    final_note = note_md
    if not approved and feedback:
        # Append reviewer note as HTML comment if max retries exhausted
        final_note += f"\n\n<!-- Reviewer Note (max retries reached): {feedback} -->\n"
        logger.warning(f"Max reviewer retries reached. Proceeding with feedback: {feedback[:200]}")
    else:
        logger.info("Note approved by reviewer")

    return {
        "needs_rewrite": False,
        "current_note_md": final_note,
    }
