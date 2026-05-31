"""
Throttle tests for auth endpoints.

Approach: DRF's ScopedRateThrottle reads rates via api_settings (a cached
APISettings object). The pytest-django `settings` fixture overrides Django
settings, but DRF caches the parsed rate at import time — so per-test
overrides via the `settings` fixture do NOT propagate to ScopedRateThrottle.

Fallback approach (per task spec): test against the real production rate
("login": "10/min") using 11 requests. This guarantees the throttle fires
without relying on settings overrides that don't reach DRF's internals.

Cache isolation is handled globally by the autouse `clear_cache` fixture in
the root conftest.py — no manual cache.clear() needed here.
"""

import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_login_throttled_after_limit():
    """
    Send 11 unauthenticated login requests (wrong credentials) and assert
    that at least one response is 429 Too Many Requests.

    The real rate is login="10/min", so request #11 must be throttled.
    """
    client = APIClient()
    payload = {"email": "nobody@example.com", "password": "WrongPass1"}
    codes = [
        client.post("/api/v1/auth/login", payload, format="json").status_code for _ in range(11)
    ]
    assert 429 in codes, f"Expected 429 within 11 requests at 10/min, got: {codes}"
