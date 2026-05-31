import pytest
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory


@pytest.mark.django_db
def test_register_creates_user_and_returns_201():
    res = APIClient().post(
        "/api/v1/auth/register",
        {
            "email": "reg@example.com",
            "password": "Secret123",
            "name": "Reg User",
            "terms": True,
        },
        format="json",
    )
    assert res.status_code == 201
    assert res.json()["user"]["email"] == "reg@example.com"
    assert res.json()["user"]["display_name"] == "Reg User"
    assert "token" in res.json()


@pytest.mark.django_db
def test_register_duplicate_email_rejected():
    UserFactory(email="dup@example.com")
    res = APIClient().post(
        "/api/v1/auth/register",
        {
            "email": "dup@example.com",
            "password": "Secret123",
            "name": "Dup User",
            "terms": True,
        },
        format="json",
    )
    assert res.status_code == 400
    assert "email" in res.json()


@pytest.mark.django_db
def test_login_returns_token():
    UserFactory(email="log@example.com", password="Secret123")
    res = APIClient().post(
        "/api/v1/auth/login",
        {
            "email": "log@example.com",
            "password": "Secret123",
        },
        format="json",
    )
    assert res.status_code == 200
    assert "token" in res.json()
    assert res.json()["user"]["email"] == "log@example.com"


@pytest.mark.django_db
def test_login_wrong_password_401():
    UserFactory(email="log2@example.com", password="Secret123")
    res = APIClient().post(
        "/api/v1/auth/login",
        {
            "email": "log2@example.com",
            "password": "WrongPass1",
        },
        format="json",
    )
    assert res.status_code == 401


@pytest.mark.django_db
def test_logout_invalidates_token():
    UserFactory(email="out@example.com", password="Secret123")
    client = APIClient()
    token = client.post(
        "/api/v1/auth/login",
        {
            "email": "out@example.com",
            "password": "Secret123",
        },
        format="json",
    ).json()["token"]
    client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    assert client.post("/api/v1/auth/logout").status_code == 204
    # after logout the token must no longer authenticate
    assert client.get("/api/v1/accounts/me").status_code == 401
