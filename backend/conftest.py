# Root conftest — shared pytest fixtures go here.
# debug_toolbar is disabled during pytest via _TESTING check in settings.py.
import pytest


@pytest.fixture(autouse=True)
def clear_cache():
    """
    Clear the Redis cache before every test.

    DRF's ScopedRateThrottle stores hit counts in the cache (Redis in this
    project). Without this fixture, throttle state accumulated in one test
    bleeds into subsequent tests and causes spurious 429s. This is especially
    important now that login/register have real rate limits (10/min, 10/hour).
    """
    from django.core.cache import cache

    cache.clear()
    yield
    # No teardown needed — next test's setup clears anyway.
