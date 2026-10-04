import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock
import uuid

from src.api.app import create_app
from src.api.deps import get_repository, get_current_user_id, get_current_user_role, require_admin
from src.db.repository import Repository

@pytest.fixture
def app():
    app = create_app()
    return app

@pytest.fixture
def mock_repo():
    repo = MagicMock(spec=Repository)
    # Make methods async since they are awaited
    repo.get_user_topics = AsyncMock()
    repo.get_user_sources = AsyncMock()
    repo.create_source = AsyncMock()
    repo.get_source = AsyncMock()
    repo.update_source_status = AsyncMock()
    repo.get_progress = AsyncMock()
    repo.create_progress = AsyncMock()
    repo.increment_retry_count = AsyncMock()
    
    # Mock the session for commit/rollback
    repo.session = AsyncMock()
    return repo

@pytest.fixture
def mock_user_id():
    return uuid.uuid4()

@pytest.fixture
def client(app, mock_repo, mock_user_id):
    def override_get_repository():
        return mock_repo

    def override_get_current_user_id():
        return mock_user_id
        
    def override_get_current_user_role():
        return "regular"

    def override_require_admin():
        return "admin"

    app.dependency_overrides[get_repository] = override_get_repository
    app.dependency_overrides[get_current_user_id] = override_get_current_user_id
    app.dependency_overrides[get_current_user_role] = override_get_current_user_role
    
    with TestClient(app) as test_client:
        yield test_client
