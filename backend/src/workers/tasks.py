import arq
from src.config.settings import settings
from src.pipeline.runner import run_pipeline

async def run_pipeline_task(ctx, source_id: str):
    await run_pipeline(source_id)

class WorkerSettings:
    functions = [run_pipeline_task]
    redis_settings = arq.connections.RedisSettings.from_dsn(settings.REDIS_URL)

if __name__ == '__main__':
    import logging
    logging.basicConfig(level=logging.INFO)
    from arq.worker import run_worker
    run_worker(WorkerSettings)
