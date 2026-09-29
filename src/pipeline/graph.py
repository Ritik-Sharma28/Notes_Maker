"""
LangGraph Pipeline — the core orchestration graph for ChatNotes.

Flow:
  build_patches → extract → index_route
                                 ↓
                    [if dirty topics] → author_note → review
                                                        ↓
                                         [approved] → diagram → format → next_topic
                                         [rejected] → author_note (rewrite)
                                                        ↓
                                         [more topics] → author_note
                                         [done] → END
"""
from langgraph.graph import StateGraph, END
from src.schemas.pipeline import PipelineState
from src.agents import (
    patch_builder, extractor,
    index_keeper, note_author, reviewer,
    diagram_agent, formatter
)
from src.config.constants import MAX_REVIEWER_RETRIES


def build_graph() -> StateGraph:
    graph = StateGraph(PipelineState)

    # Register nodes (segmenter removed — extractor does it in one pass)
    graph.add_node("build_patches", patch_builder.run)
    graph.add_node("extract", extractor.run)
    graph.add_node("index_route", index_keeper.run)
    graph.add_node("author_note", note_author.run)
    graph.add_node("review", reviewer.run)
    graph.add_node("diagram", diagram_agent.run)
    graph.add_node("format", formatter.run)
    graph.add_node("next_topic", _advance_topic)

    # Entry: build patches from raw messages
    graph.set_entry_point("build_patches")
    graph.add_edge("build_patches", "extract")
    graph.add_edge("extract", "index_route")

    # Routing: are there dirty topics to process?
    graph.add_conditional_edges(
        "index_route",
        _has_dirty_topics,
        {"has_topics": "author_note", "no_topics": END},
    )

    # Author → Review loop
    graph.add_edge("author_note", "review")
    graph.add_conditional_edges(
        "review",
        _review_decision,
        {"rewrite": "author_note", "approved": "diagram"},
    )

    # Diagram → Format → Next topic
    graph.add_edge("diagram", "format")
    graph.add_edge("format", "next_topic")

    # Check if more topics to process
    graph.add_conditional_edges(
        "next_topic",
        _more_topics,
        {"more": "author_note", "done": END},
    )

    return graph.compile()


# ──────────────────────────────────────────────
# Routing functions
# ──────────────────────────────────────────────

def _has_dirty_topics(state: PipelineState) -> str:
    return "has_topics" if state.get("dirty_topic_ids") else "no_topics"


def _review_decision(state: PipelineState) -> str:
    if state.get("needs_rewrite") and state.get("retry_count", 0) <= MAX_REVIEWER_RETRIES:
        return "rewrite"
    return "approved"


def _more_topics(state: PipelineState) -> str:
    idx = state.get("current_topic_idx", 0)
    dirty_topics = state.get("dirty_topic_ids", [])
    if idx < len(dirty_topics):
        return "more"
    return "done"


def _advance_topic(state: PipelineState) -> dict:
    """Reset per-topic state and advance to next topic."""
    return {
        "current_topic_idx": state.get("current_topic_idx", 0) + 1,
        "current_note_md": "",
        "current_raw_facts": [],
        "needs_rewrite": False,
        "retry_count": 0,
        "reviewer_feedback": "",
        "current_diagrams": [],
    }
