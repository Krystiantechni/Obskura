import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory


def _auth_client(user):
    client = APIClient()
    _, token = AuthToken.objects.create(user)
    client.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    return client


@pytest.mark.django_db
def test_me_requires_auth():
    assert APIClient().get("/api/v1/accounts/me").status_code == 401


@pytest.mark.django_db
def test_me_returns_current_user():
    user = UserFactory(email="me@example.com", display_name="Me User")
    res = _auth_client(user).get("/api/v1/accounts/me")
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"
    assert res.json()["display_name"] == "Me User"


@pytest.mark.django_db
def test_me_patch_updates_display_name():
    user = UserFactory(email="patch@example.com", display_name="Old")
    res = _auth_client(user).patch("/api/v1/accounts/me", {"display_name": "New"}, format="json")
    assert res.status_code == 200
    # Odpowiedź = pełny user (jak GET /me), nie samo zmienione pole.
    assert res.json()["email"] == "patch@example.com"
    assert res.json()["display_name"] == "New"
    user.refresh_from_db()
    assert user.display_name == "New"


@pytest.mark.django_db
def test_me_prefs_put_replaces_prefs():
    user = UserFactory(email="prefs@example.com")
    res = _auth_client(user).put(
        "/api/v1/accounts/me/prefs", {"prefs": {"theme": "dark", "lang": "pl"}}, format="json"
    )
    assert res.status_code == 200
    user.refresh_from_db()
    assert user.prefs == {"theme": "dark", "lang": "pl"}
