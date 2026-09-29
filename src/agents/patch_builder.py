"""
Patch Builder — groups raw messages into manageable patches for the Extractor.

This is pure Python logic, NOT an LLM agent. It groups messages into patches
of configurable size to stay within token limits. Each patch preserves
conversational context by including a rolling summary of prior context.
"""
import json
from src.schemas.pipeline import PipelineState
from src.config.settings import settings


async def run(state: PipelineState) -> dict:
    raw_messages = state.get("raw_messages", [])
    if not raw_messages:
        return {"patches": []}

    patch_size = settings.PATCH_SIZE  # number of message-pairs per patch
    messages_per_patch = patch_size * 2  # user+assistant pairs

    patches = []
    total = len(raw_messages)

    for i in range(0, total, messages_per_patch):
        batch = raw_messages[i : i + messages_per_patch]

        # Build text representation
        text_lines = []
        for msg in batch:
            role = msg.get("role", "unknown").capitalize()
            content = msg.get("content", "")
            text_lines.append(f"**{role}**: {content}")

        patch_text = "\n\n".join(text_lines)

        # Build a brief context summary from earlier messages (for cross-patch continuity)
        context_summary = ""
        if i > 0:
            prior = raw_messages[max(0, i - 4) : i]  # last 2 pairs before this patch
            context_lines = []
            for msg in prior:
                role = msg.get("role", "unknown").capitalize()
                # Truncate to first 150 chars for context
                snippet = msg.get("content", "")[:150]
                if len(msg.get("content", "")) > 150:
                    snippet += "..."
                context_lines.append(f"{role}: {snippet}")
            context_summary = (
                "PRIOR CONTEXT (from previous messages in the conversation):\n"
                + "\n".join(context_lines)
                + "\n\n---\n\n"
            )

        patches.append({
            "patch_id": f"patch_{i // messages_per_patch}",
            "start_idx": i,
            "end_idx": min(i + messages_per_patch, total),
            "text": context_summary + patch_text,
        })

    return {"patches": patches}
