import pytest
from unittest.mock import patch, AsyncMock
from src.schemas.ingest import IngestResponse
import uuid

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "0.1.0"}

@patch("src.rate_limit.limiter.rate_limiter.check_rate_limit", new_callable=AsyncMock)
@patch("src.api.routes.ingest.arq.create_pool", new_callable=AsyncMock)
def test_ingest_route_success(mock_create_pool, mock_check_rate_limit, client, mock_repo):
    # Setup mock returns
    mock_check_rate_limit.return_value = (True, None)
    
    # Mock redis pool for background task
    mock_redis = AsyncMock()
    mock_create_pool.return_value = mock_redis
    
    # Mock source creation
    mock_source = AsyncMock()
    mock_source.id = uuid.uuid4()
    mock_repo.create_source.return_value = mock_source

    response = client.post(
        "/api/v1/ingest",
        json={"raw_text": "This is some test data."}
    )

    assert response.status_code == 202
    data = response.json()
    assert "source_id" in data
    assert data["status"] == "processing"
    
    # Verify the background task was enqueued
    mock_redis.enqueue_job.assert_called_once()
    assert mock_redis.enqueue_job.call_args[0][0] == "run_pipeline_task"
    
@patch("src.rate_limit.limiter.rate_limiter.check_rate_limit", new_callable=AsyncMock)
def test_ingest_route_rate_limit_exceeded(mock_check_rate_limit, client):
    # Setup mock returns
    mock_check_rate_limit.return_value = (False, "Rate limit exceeded.")
    
    response = client.post(
        "/api/v1/ingest",
        json={"raw_text": "This is some test data."}
    )

    assert response.status_code == 429
    assert "Rate limit exceeded." in response.json()["detail"]

def test_list_sources(client, mock_repo):
    # Mock return values for repo
    mock_source = AsyncMock()
    mock_source.id = uuid.uuid4()
    mock_source.platform = "chatgpt"
    mock_source.status = "completed"
    mock_source.created_at = "2023-01-01T00:00:00Z"
    mock_source.share_url = "https://chat.openai.com/..."
    
    mock_repo.get_user_sources.return_value = [mock_source]

    response = client.get("/api/v1/sources")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["platform"] == "chatgpt"
    assert data[0]["status"] == "completed"

def test_get_progress(client, mock_repo):
    # Mock progress
    mock_progress = AsyncMock()
    mock_progress.source_id = uuid.uuid4()
    mock_progress.current_agent = "extractor"
    mock_progress.current_step = "extracting"
    mock_progress.percentage = 15
    mock_progress.message = "Extracting messages"
    mock_progress.error_message = None
    mock_progress.retry_count = 0
    mock_progress.updated_at = "2023-01-01T00:00:00Z"
    
    mock_repo.get_progress.return_value = mock_progress
    
    source_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/progress/{source_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["current_agent"] == "extractor"
    assert data["percentage"] == 15

def test_get_progress_not_found(client, mock_repo):
    mock_repo.get_progress.return_value = None
    
    source_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/progress/{source_id}")
    
    assert response.status_code == 404
