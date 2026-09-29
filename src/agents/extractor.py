"""
Extractor Agent — the single extraction pass that replaces the old Segmenter + Extractor.

Takes each patch of conversation and extracts structured topic groups with:
- topic_guess (what topic this covers)
- angle (the perspective: definition, comparison, deep-dive, etc.)
- key_question (what the user was trying to learn)
- raw_facts (losslessly extracted knowledge)
- code_blocks and comparison_tables
"""
import logging
from langchain_core.messages import HumanMessage
from src.llm.factory import get_llm
from src.schemas.pipeline import PipelineState
from src.schemas.extractor import ExtractorOutput
from src.config.constants import PROMPTS_DIR

logger = logging.getLogger(__name__)


async def run(state: PipelineState) -> dict:
    patches = state.get("patches", [])
    if not patches:
        return {"extracted_groups": []}

    prompt_path = PROMPTS_DIR / "extractor.txt"
    prompt_text = prompt_path.read_text(encoding="utf-8")

    llm = get_llm("extractor")
    structured_llm = llm.with_structured_output(ExtractorOutput)

    extracted_groups = []
    errors = state.get("errors", [])

    for patch in patches:
        formatted_prompt = prompt_text.format(text=patch["text"])
        try:
            result = await structured_llm.ainvoke(
                [HumanMessage(content=formatted_prompt)]
            )
            if result and hasattr(result, "groups"):
                for group in result.groups:
                    group_dict = group.model_dump()
                    group_dict["_patch_id"] = patch["patch_id"]
                    extracted_groups.append(group_dict)
                logger.info(
                    f"Patch {patch['patch_id']}: extracted {len(result.groups)} topic groups"
                )
        except Exception as e:
            logger.error(f"Extractor failed for {patch['patch_id']}: {e}")
            errors.append({
                "agent": "extractor",
                "patch_id": patch["patch_id"],
                "error": str(e),
            })

    logger.info(f"Total extracted groups: {len(extracted_groups)}")
    return {"extracted_groups": extracted_groups, "errors": errors}
