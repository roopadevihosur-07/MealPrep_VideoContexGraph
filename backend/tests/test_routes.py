"""Tests for the Video Context Graph API."""

import os
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

# Set a placeholder before the Strands agent is imported. Unit tests never
# make an OpenAI request.
os.environ.setdefault("OPENAI_API_KEY", "test-placeholder")

from app.main import app


@pytest.fixture(autouse=True)
def mock_backend():
    """Mock only the video application's actual Neo4j lifecycle."""
    with (
        patch("app.main.connect_neo4j", new_callable=AsyncMock),
        patch("app.main.close_neo4j", new_callable=AsyncMock),
        patch("app.main.is_connected", return_value=True),
        patch("app.routes.is_connected", return_value=True),
    ):
        yield


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["domain"] == "video-context-graph"


def test_scenarios():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "Video Context Graph"
    assert {scenario["name"] for scenario in data["scenarios"]} == {
        "Explore",
        "Find a moment",
        "Cross-video",
    }
