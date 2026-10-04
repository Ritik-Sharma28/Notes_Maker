import arq
from src.config.settings import settings
from src.pipeline.runner import run_pipeline

async def run_pipeline_task(ctx, source_id: str, user_id: str, user_role: str):
    """Background task to run pipeline with user context."""
    await run_pipeline(source_id, user_id, user_role)

class WorkerSettings:
    functions = [run_pipeline_task]
    redis_settings = arq.connections.RedisSettings.from_dsn(settings.REDIS_URL)

if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.INFO)
    from arq.worker import run_worker
    run_worker(WorkerSettings)
