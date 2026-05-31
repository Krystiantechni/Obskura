from unittest.mock import patch

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_returns_ok():
    client = APIClient()
    res = client.get("/api/v1/health/")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert body["cache"] == "ok"


@pytest.mark.django_db
def test_health_is_public():
    # Health musi być dostępny bez tokenu (monitoring/deploy smoke test).
    # Asercja pozytywna (== 200) — silniejsza niż "!= 401/403", które przeszłoby też na 500.
    client = APIClient()
    res = client.get("/api/v1/health/")
    assert res.status_code == 200


@pytest.mark.django_db
def test_health_returns_503_when_cache_down():
    # Gałąź degraded: gdy cache pada, status=503 + cache="error", reszta bez zmian.
    with patch("core.views.cache.set", side_effect=Exception("redis down")):
        res = APIClient().get("/api/v1/health/")
    assert res.status_code == 503
    body = res.json()
    assert body["status"] == "degraded"
    assert body["cache"] == "error"
    assert body["database"] == "ok"
