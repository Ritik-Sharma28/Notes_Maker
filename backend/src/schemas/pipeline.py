from typing import TypedDict

class PipelineState(TypedDict):
    # Context
    user_id: str
    user_role: str

    # Ingestion
    source_id: str
    raw_messages: list[dict]

    # Patch Builder output
    patches: list[dict]

    # Extractor output
    extracted_groups: list[dict]

    # Reference index — topic→angles map carried across extraction loops
    reference_index: dict[str, list[str]]

    # Index Keeper output
    dirty_topic_ids: list[str]

    # Per-topic authoring loop
    current_topic_idx: int
    current_note_md: str
    current_raw_facts: list[str]
    needs_rewrite: bool
    retry_count: int
    reviewer_feedback: str

    # Diagram output
    current_diagrams: list[dict]

    # Tracking
    completed_topic_ids: list[str]
    errors: list[dict]
