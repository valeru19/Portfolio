from __future__ import annotations

import os

# Must run before any app.* import so Settings picks up test values.
os.environ["ADMIN_KEY"] = "test-admin-key-for-pytest"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["TRUST_PROXY"] = "false"
os.environ["RATE_LIMIT_WINDOW_SECONDS"] = "60"
os.environ["RATE_LIMIT_MAX_REQUESTS"] = "10"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.rate_limit import reset_rate_limit_state

ADMIN_KEY = os.environ["ADMIN_KEY"]


@pytest.fixture()
def client() -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    reset_rate_limit_state()

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    reset_rate_limit_state()
