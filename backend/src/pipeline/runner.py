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


async def run_pipeline(source_id: str, user_id: str, user_role: str):
    logger.info(f"Starting pipeline for source_id: {source_id}, user_id: {user_id}")

    # Phase 1: Fetch source and extract raw messages if needed
    async with async_session_maker() as session:
        repo = Repository(session)
        source = await repo.get_source(uuid.UUID(source_id), uuid.UUID(user_id))

        if not source:
            logger.error(f"Source {source_id} not found.")
            return

        await repo.update_source_status(uuid.UUID(source_id), "processing")
        await repo.create_progress(uuid.UUID(source_id), uuid.UUID(user_id), user_role)
        await repo.update_progress(
            uuid.UUID(source_id),
            current_agent="patch_builder",
            current_step="Reading conversation...",
            percentage=10,
            message="Reading messages",
        )
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
                await repo.update_progress(
                    uuid.UUID(source_id),
                    current_agent="patch_builder",
                    current_step="Reading conversation...",
                    percentage=20,
                    message=f"Extracted {len(raw_messages)} messages from source",
                )
                await session.commit()
                logger.info(f"Extracted {len(raw_messages)} messages from source")
            except Exception as e:
                logger.error(f"Extraction failed: {e}", exc_info=True)
                await repo.update_source_status(
                    uuid.UUID(source_id), "failed", error_message=str(e)
                )
                await repo.update_progress(
                    uuid.UUID(source_id),
                    current_agent="failed",
                    current_step="failed",
                    percentage=100,
                    message="Extraction failed",
                    error_message=str(e),
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
            await repo.update_progress(
                uuid.UUID(source_id),
                current_agent="failed",
                current_step="failed",
                percentage=100,
                message="No messages extracted",
                error_message="No messages extracted from source",
            )
            await session.commit()
        return

    # Phase 2: Run the LangGraph pipeline
    graph = build_graph()
    initial_state = {
        "source_id": source_id,
        "user_id": user_id,
        "user_role": user_role,
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
        current_state = dict(initial_state)
        async for output in graph.astream(initial_state):
            for node_name, node_state in output.items():
                logger.info(f"Completed node: {node_name}")
                current_state.update(node_state)

                dirty_topics = current_state.get("dirty_topic_ids", [])
                total_topics = max(1, len(dirty_topics))
                idx = current_state.get("current_topic_idx", 0)
                topic_span = 45.0 / total_topics

                agent = "processing"
                step = "Processing..."
                pct = 50
                msg = "Working on notes"

                if node_name == "build_patches":
                    agent = "extractor"
                    step = "Extracting topics and facts..."
                    pct = 30
                    msg = "Extracting knowledge and concepts"
                elif node_name == "extract":
                    agent = "index_keeper"
                    step = "Organising topic index..."
                    pct = 45
                    msg = "Matching topics and structure"
                elif node_name == "index_route":
                    agent = "note_author"
                    step = f"Authoring study notes (1/{total_topics})..."
                    pct = 50
                    msg = "Writing comprehensive study notes"
                elif node_name == "author_note":
                    agent = "reviewer"
                    step = f"Reviewing notes ({min(idx + 1, total_topics)}/{total_topics})..."
                    pct = min(95, int(50 + (idx + 0.3) * topic_span))
                    msg = "Validating note quality and clarity"
                elif node_name == "review":
                    agent = "diagram_agent"
                    step = f"Generating visual diagrams ({min(idx + 1, total_topics)}/{total_topics})..."
                    pct = min(95, int(50 + (idx + 0.6) * topic_span))
                    msg = "Creating visual diagrams"
                elif node_name == "diagram":
                    agent = "formatter"
                    step = f"Formatting and saving note ({min(idx + 1, total_topics)}/{total_topics})..."
                    pct = min(95, int(50 + (idx + 0.8) * topic_span))
                    msg = "Assembling final note"
                elif node_name in ("format", "next_topic"):
                    agent = "next_topic"
                    step = f"Saved note ({min(idx + 1, total_topics)}/{total_topics})"
                    pct = min(95, int(50 + (idx + 1.0) * topic_span))
                    msg = "Note saved"

                async with async_session_maker() as session:
                    repo = Repository(session)
                    await repo.update_progress(
                        uuid.UUID(source_id),
                        current_agent=agent,
                        current_step=step,
                        percentage=pct,
                        message=msg,
                    )
                    await session.commit()

        # Mark source as completed
        async with async_session_maker() as session:
            repo = Repository(session)
            await repo.update_source_status(uuid.UUID(source_id), "completed")
            await repo.update_progress(
                uuid.UUID(source_id),
                current_agent="finish",
                current_step="Done",
                percentage=100,
                message="All notes generated successfully!",
            )
            await session.commit()

        logger.info(f"Pipeline completed successfully for source_id: {source_id}")

    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        async with async_session_maker() as session:
            repo = Repository(session)
            await repo.update_source_status(
                uuid.UUID(source_id), "failed", error_message=str(e)
            )
            await repo.update_progress(
                uuid.UUID(source_id),
                current_agent="failed",
                current_step="failed",
                percentage=100,
                message="Pipeline failed",
                error_message=str(e),
            )
            await session.commit()
