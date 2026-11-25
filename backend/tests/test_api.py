from __future__ import annotations

from fastapi.testclient import TestClient

from tests.conftest import ADMIN_KEY

APPLICATION_PAYLOAD = {
    "name": "Test User",
    "contact": "test@example.com",
    "kind": "job",
    "message": "Hello, I would like to discuss a role.",
}

REVIEW_PAYLOAD = {
    "name": "Reviewer",
    "text": "Great collaboration on the backend work.",
    "rating": 5,
}


def test_create_application(client: TestClient) -> None:
    response = client.post("/api/applications", json=APPLICATION_PAYLOAD)
    assert response.status_code == 201
    assert response.json()["detail"] == "Application received"


def test_create_review(client: TestClient) -> None:
    response = client.post("/api/reviews", json=REVIEW_PAYLOAD)
    assert response.status_code == 201
    assert "moderation" in response.json()["detail"].lower()


def test_application_validation_422(client: TestClient) -> None:
    response = client.post(
        "/api/applications",
        json={**APPLICATION_PAYLOAD, "message": "short"},
    )
    assert response.status_code == 422


def test_review_validation_422(client: TestClient) -> None:
    response = client.post(
        "/api/reviews",
        json={**REVIEW_PAYLOAD, "rating": 9},
    )
    assert response.status_code == 422


def test_list_applications_requires_admin(client: TestClient) -> None:
    assert client.get("/api/applications").status_code == 401
    client.post("/api/applications", json=APPLICATION_PAYLOAD)
    ok = client.get("/api/applications", headers={"X-Admin-Key": ADMIN_KEY})
    assert ok.status_code == 200
    assert len(ok.json()) == 1


def test_public_reviews_only_approved(client: TestClient) -> None:
    created = client.post("/api/reviews", json=REVIEW_PAYLOAD)
    assert created.status_code == 201

    public_before = client.get("/api/reviews")
    assert public_before.status_code == 200
    assert public_before.json() == []

    approved = client.patch(
        "/api/reviews/1/approve",
        headers={"X-Admin-Key": ADMIN_KEY},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"

    public_after = client.get("/api/reviews")
    assert len(public_after.json()) == 1
    assert public_after.json()[0]["name"] == REVIEW_PAYLOAD["name"]
    assert "status" not in public_after.json()[0]


def test_approve_and_delete_review(client: TestClient) -> None:
    assert client.post("/api/reviews", json=REVIEW_PAYLOAD).status_code == 201

    assert client.patch("/api/reviews/1/approve").status_code == 401
    assert client.delete("/api/reviews/1").status_code == 401

    approved = client.patch(
        "/api/reviews/1/approve",
        headers={"X-Admin-Key": ADMIN_KEY},
    )
    assert approved.status_code == 200

    deleted = client.delete(
        "/api/reviews/1",
        headers={"X-Admin-Key": ADMIN_KEY},
    )
    assert deleted.status_code == 200
    assert client.get("/api/reviews").json() == []


def test_rate_limit_returns_429(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr("app.rate_limit.settings.rate_limit_max_requests", 2)
    assert client.post("/api/applications", json=APPLICATION_PAYLOAD).status_code == 201
    assert client.post("/api/applications", json=APPLICATION_PAYLOAD).status_code == 201
    limited = client.post("/api/applications", json=APPLICATION_PAYLOAD)
    assert limited.status_code == 429
