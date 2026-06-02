"""Task 2 — API tests for pages endpoints."""

import pytest
from rest_framework.test import APIClient

from pages.models import LegalKind

LEGAL_LIST_URL = "/api/v1/pages/legal"
PRESS_URL = "/api/v1/pages/press"


@pytest.mark.django_db
def test_legal_list_returns_200():
    res = APIClient().get(LEGAL_LIST_URL)
    assert res.status_code == 200


@pytest.mark.django_db
def test_legal_list_only_returns_current_docs():
    from pages.tests.factories import LegalDocFactory

    LegalDocFactory(kind=LegalKind.PRYWATNOSC, is_current=True)
    LegalDocFactory(kind=LegalKind.REGULAMIN, is_current=False)
    res = APIClient().get(LEGAL_LIST_URL)
    data = res.json()
    assert len(data) == 1
    assert data[0]["kind"] == "prywatnosc"


@pytest.mark.django_db
def test_legal_list_fields_present():
    from pages.tests.factories import LegalDocFactory

    LegalDocFactory(kind=LegalKind.COOKIES, is_current=True, version="4.2.1")
    res = APIClient().get(LEGAL_LIST_URL)
    item = res.json()[0]
    for field in ["kind", "version", "body", "published_at"]:
        assert field in item, f"Missing field: {field}"


@pytest.mark.django_db
def test_legal_detail_returns_current_doc():
    from pages.tests.factories import LegalDocFactory

    LegalDocFactory(kind=LegalKind.REGULAMIN, is_current=True, version="2.0.0")
    res = APIClient().get(f"{LEGAL_LIST_URL}/regulamin")
    assert res.status_code == 200
    assert res.json()["version"] == "2.0.0"
    assert res.json()["kind"] == "regulamin"


@pytest.mark.django_db
def test_legal_detail_404_for_unknown_kind():
    res = APIClient().get(f"{LEGAL_LIST_URL}/nonexistent")
    assert res.status_code == 404


@pytest.mark.django_db
def test_legal_detail_404_when_no_current_doc():
    from pages.tests.factories import LegalDocFactory

    LegalDocFactory(kind=LegalKind.COOKIES, is_current=False)
    res = APIClient().get(f"{LEGAL_LIST_URL}/cookies")
    assert res.status_code == 404


@pytest.mark.django_db
def test_press_returns_200():
    res = APIClient().get(PRESS_URL)
    assert res.status_code == 200


@pytest.mark.django_db
def test_press_only_active_items():
    from pages.tests.factories import PressItemFactory

    PressItemFactory(is_active=True, order=0)
    PressItemFactory(is_active=False, order=1)
    res = APIClient().get(PRESS_URL)
    data = res.json()
    assert len(data) == 1


@pytest.mark.django_db
def test_press_fields_present():
    from pages.tests.factories import PressItemFactory

    PressItemFactory(is_active=True)
    res = APIClient().get(PRESS_URL)
    item = res.json()[0]
    for field in ["source", "quote", "author", "url", "order"]:
        assert field in item, f"Missing field: {field}"


@pytest.mark.django_db
def test_press_ordered_by_order():
    from pages.tests.factories import PressItemFactory

    PressItemFactory(source="B", order=2)
    PressItemFactory(source="A", order=0)
    PressItemFactory(source="C", order=5)
    res = APIClient().get(PRESS_URL)
    data = res.json()
    assert data[0]["source"] == "A"
    assert data[1]["source"] == "B"
    assert data[2]["source"] == "C"


@pytest.mark.django_db
def test_legal_list_uses_cache(django_assert_num_queries):
    from pages.tests.factories import LegalDocFactory

    LegalDocFactory(kind=LegalKind.PRYWATNOSC, is_current=True)
    # First call: hits DB + sets cache
    APIClient().get(LEGAL_LIST_URL)
    # Second call: should hit cache (0 DB queries)
    from django.core.cache import cache

    cache.clear()  # ensure clean slate for the assertion
    LegalDocFactory(kind=LegalKind.REGULAMIN, is_current=True)
    APIClient().get(LEGAL_LIST_URL)  # populates cache
    with django_assert_num_queries(0):
        APIClient().get(LEGAL_LIST_URL)


@pytest.mark.django_db
def test_press_uses_cache(django_assert_num_queries):
    from pages.tests.factories import PressItemFactory

    PressItemFactory(is_active=True)
    APIClient().get(PRESS_URL)  # populate cache
    with django_assert_num_queries(0):
        APIClient().get(PRESS_URL)
