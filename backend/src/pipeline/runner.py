"""
Pipeline Runner — orchestrates the full ingestion-to-notes pipeline.

Takes a source_id, fetches/extracts raw messages, then runs
the LangGraph pipeline to produce structured notes.
"""
import uuid
import logging
from src.pipeline.graph import build_graph
from src.db.session import async_session_maker
from src.db.repository import Repository

logger = logging.getLogger(__name__)


async def run_pipeline(source_id: str):
    logger.info(f"Starting pipeline for source_id: {source_id}")

    # Phase 1: Fetch source and extract raw messages if needed
    async with async_session_maker() as session:
        repo = Repository(session)
        source = await repo.get_source(uuid.UUID(source_id))

        if not source:
            logger.error(f"Source {source_id} not found.")
            return

        await repo.update_source_status(uuid.UUID(source_id), "processing")
        await session.commit()

        raw_messages = source.raw_json.get("messages", [])

        if not raw_messages:
            try:
                if source.share_url:
                    from src.ingestion.chatgpt import ChatGPTExtractor
                    extractor = ChatGPTExtractor()
                    raw_messages = await extractor.extract(source.share_url)
                elif "raw_text" in source.raw_json:
                    from src.ingestion.raw_paste import RawPasteExtractor
                    extractor = RawPasteExtractor()
                    raw_messages = await extractor.extract(
                        source.raw_json["raw_text"]
                    )

                # Persist extracted messages back to source
                source.raw_json = {"messages": raw_messages}
                session.add(source)
                await session.commit()
                logger.info(f"Extracted {len(raw_messages)} messages from source")
            except Exception as e:
                logger.error(f"Extraction failed: {e}")
                await repo.update_source_status(
                    uuid.UUID(source_id), "failed", error_message=str(e)
                )
                await session.commit()
                return

    if not raw_messages:
        async with async_session_maker() as session:
            repo = Repository(session)
            await repo.update_source_status(
                uuid.UUID(source_id),
                "failed",
                error_message="No messages extracted",
            )
            await session.commit()
        return

    # Phase 2: Run the LangGraph pipeline
    graph = build_graph()
    initial_state = {
        "source_id": source_id,
        "raw_messages": raw_messages,
        "patches": [],
        "extracted_groups": [],
        "reference_index": {},
        "dirty_topic_ids": [],
        "current_topic_idx": 0,
        "current_note_md": "",
        "current_raw_facts": [],
        "needs_rewrite": False,
        "retry_count": 0,
        "reviewer_feedback": "",
        "current_diagrams": [],
        "completed_topic_ids": [],
        "errors": [],
    }

    try:
        async for output in graph.astream(initial_state):
            for node_name, node_state in output.items():
                logger.info(f"Completed node: {node_name}")

        # Mark source as completed
        async with async_session_maker() as session:
            repo = Repository(session)
            await repo.update_source_status(uuid.UUID(source_id), "completed")
            await session.commit()

        logger.info(f"Pipeline completed successfully for source_id: {source_id}")

    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        async with async_session_maker() as session:
            repo = Repository(session)
            await repo.update_source_status(
                uuid.UUID(source_id), "failed", error_message=str(e)
            )
            await session.commit()
