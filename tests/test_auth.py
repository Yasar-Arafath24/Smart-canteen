import uuid

import pytest
from fastapi.testclient import TestClient

from app.db.database import SessionLocal
from app.main import app
from app.repositories.user_repository import UserRepository

client = TestClient(app)


@pytest.fixture(scope="module")
def unique_email():
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


def cleanup_user(email: str):
    db = SessionLocal()
    try:
        user = UserRepository.get_by_email(db, email)
        if user:
            db.delete(user)
            db.commit()
    finally:
        db.close()


class TestAuth:
    def test_register(self, unique_email):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Test User",
                "email": unique_email,
                "password": "StrongPass123!",
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == unique_email
        assert body["role"] == "customer"
        assert "password" not in body
        assert "hashed_password" not in body

    def test_register_duplicate_email(self, unique_email):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Test User",
                "email": unique_email,
                "password": "StrongPass123!",
            },
        )
        assert resp.status_code == 409

    def test_register_invalid_email(self):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Test User",
                "email": "not-an-email",
                "password": "StrongPass123!",
            },
        )
        assert resp.status_code == 422

    def test_register_short_password(self, unique_email):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Test User",
                "email": f"x_{unique_email}",
                "password": "short",
            },
        )
        assert resp.status_code == 422

    def test_login_success(self, unique_email):
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": unique_email, "password": "StrongPass123!"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["token_type"] == "bearer"
        assert body["role"] == "customer"
        assert body["access_token"]

    def test_login_wrong_password(self, unique_email):
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": unique_email, "password": "WrongPass123!"},
        )
        assert resp.status_code == 401

    def test_me_with_token(self, unique_email):
        token = client.post(
            "/api/v1/auth/login",
            data={"username": unique_email, "password": "StrongPass123!"},
        ).json()["access_token"]
        resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["email"] == unique_email

    def test_me_without_token(self):
        resp = client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    def test_me_with_invalid_token(self):
        resp = client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer invalid.token.here"}
        )
        assert resp.status_code == 401

    def test_users_admin_required(self, unique_email):
        token = client.post(
            "/api/v1/auth/login",
            data={"username": unique_email, "password": "StrongPass123!"},
        ).json()["access_token"]
        resp = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 403

    def test_cleanup(self, unique_email):
        cleanup_user(unique_email)
