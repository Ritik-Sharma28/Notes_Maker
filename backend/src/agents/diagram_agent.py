"""
Diagram Agent — detects diagram-worthy content in authored notes
and generates Mermaid diagrams.

Signal detection is regex-based (cheap, no LLM needed).
Diagram generation uses the LLM with concrete syntax examples.
"""
import re
import logging
from langchain_core.messages import HumanMessage
from src.llm.factory import get_llm
from src.schemas.pipeline import PipelineState
from src.config.constants import PROMPTS_DIR, MAX_DIAGRAMS_PER_NOTE

logger = logging.getLogger(__name__)

# Diagram signal patterns — each maps a regex to a suggested Mermaid diagram type
SIGNAL_PATTERNS = [
    {
        "pattern": r"(?i)(step\s+\d|firstly|secondly|then|finally|workflow|pipeline|process|sequence|flow)",
        "signal": "Sequential process or workflow",
        "type": "flowchart TD",
    },
    {
        "pattern": r"(?i)(\bvs\b|\bversus\b|compared\s+to|difference\s+between|unlike|whereas|on\s+the\s+other\s+hand)",
        "signal": "Comparison between concepts",
        "type": "flowchart LR",
    },
    {
        "pattern": r"(?i)(state|transition|lifecycle|phase|trigger|pending|active|complete|from\s+\w+\s+to\s+\w+)",
        "signal": "State machine or lifecycle",
        "type": "stateDiagram-v2",
    },
    {
        "pattern": r"(?i)(architecture|component|layer|module|service|client|server|database|api|frontend|backend)",
        "signal": "System architecture or component relationship",
        "type": "flowchart TD",
    },
]


def detect_signals(note_md: str) -> list[dict]:
    """Detect diagram-worthy content patterns in the note."""
    signals = []
    seen_types = set()

    for sp in SIGNAL_PATTERNS:
        if re.search(sp["pattern"], note_md) and sp["type"] not in seen_types:
            signals.append({
                "signal": sp["signal"],
                "type": sp["type"],
            })
            seen_types.add(sp["type"])

    return signals


def clean_mermaid_code(raw: str) -> str:
    """Extract clean Mermaid code from LLM response."""
    # Strip markdown fences
    match = re.search(r"```(?:mermaid)?\s*(.*?)\s*```", raw, re.DOTALL)
    if match:
        return match.group(1).strip()

    # If no fences, check if it starts with a valid Mermaid keyword
    first_line = raw.strip().split("\n")[0].strip().lower()
    valid_starts = ("flowchart", "graph", "sequencediagram", "statediagram", "classDiagram", "erdiagram")
    if any(first_line.startswith(s.lower()) for s in valid_starts):
        return raw.strip()

    return raw.strip()


async def run(state: PipelineState) -> dict:
    note_md = state.get("current_note_md", "")
    if not note_md:
        return {"current_diagrams": []}

    signals = detect_signals(note_md)
    if not signals:
        logger.info("No diagram signals detected in note")
        return {"current_diagrams": []}

    # Limit diagrams per note
    signals = signals[:MAX_DIAGRAMS_PER_NOTE]

    prompt_path = PROMPTS_DIR / "diagram_agent.txt"
    prompt_text = prompt_path.read_text(encoding="utf-8")

    llm = get_llm("diagram_agent")
    diagrams = []

    for sig in signals:
        formatted_prompt = prompt_text.format(
            signal=sig["signal"],
            diagram_type=sig["type"],
            note=note_md,
        )

        try:
            response = await llm.ainvoke([HumanMessage(content=formatted_prompt)])
            code = clean_mermaid_code(response.content)

            if code:
                diagrams.append({
                    "type": sig["type"],
                    "signal": sig["signal"],
                    "mermaid_code": code,
                })
                logger.info(f"Generated {sig['type']} diagram for signal: {sig['signal']}")
        except Exception as e:
            logger.warning(f"Diagram generation failed for '{sig['signal']}': {e}")
            continue

    return {"current_diagrams": diagrams}
