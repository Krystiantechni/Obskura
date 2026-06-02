"""Task 3 — FAQ endpoint tests: nested items, cache, filter, N+1 guard."""

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

FAQ_URL = "/api/v1/support/faq"


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_faq_returns_200():
    res = APIClient().get(FAQ_URL)
    assert res.status_code == 200


@pytest.mark.django_db
def test_faq_returns_only_active_categories():
    from support.tests.factories import FaqCategoryFactory

    FaqCategoryFactory(is_active=True, slug="active-cat")
    FaqCategoryFactory(is_active=False, slug="inactive-cat")
    res = APIClient().get(FAQ_URL)
    data = res.json()
    assert len(data) == 1
    assert data[0]["slug"] == "active-cat"


@pytest.mark.django_db
def test_faq_nested_items_only_active():
    from support.tests.factories import FaqCategoryFactory, FaqItemFactory

    cat = FaqCategoryFactory(slug="tech")
    FaqItemFactory(category=cat, is_active=True, order=0)
    FaqItemFactory(category=cat, is_active=False, order=1)
    res = APIClient().get(FAQ_URL)
    data = res.json()
    assert len(data) == 1
    assert len(data[0]["items"]) == 1


@pytest.mark.django_db
def test_faq_items_ordered_by_order():
    from support.tests.factories import FaqCategoryFactory, FaqItemFactory

    cat = FaqCategoryFactory(slug="pay")
    FaqItemFactory(category=cat, is_active=True, order=5, question="Q5")
    FaqItemFactory(category=cat, is_active=True, order=1, question="Q1")
    FaqItemFactory(category=cat, is_active=True, order=3, question="Q3")
    res = APIClient().get(FAQ_URL)
    items = res.json()[0]["items"]
    orders = [i["order"] for i in items]
    assert orders == sorted(orders)


@pytest.mark.django_db
def test_faq_fields_present():
    from support.tests.factories import FaqCategoryFactory, FaqItemFactory

    cat = FaqCategoryFactory(slug="fields-cat")
    FaqItemFactory(category=cat, is_active=True)
    res = APIClient().get(FAQ_URL)
    data = res.json()
    assert len(data) == 1
    cat_data = data[0]
    for field in ["name", "slug", "order", "items"]:
        assert field in cat_data, f"Missing category field: {field}"
    item_data = cat_data["items"][0]
    for field in ["question", "answer", "order"]:
        assert field in item_data, f"Missing item field: {field}"


@pytest.mark.django_db
def test_faq_filter_by_category_slug():
    from support.tests.factories import FaqCategoryFactory, FaqItemFactory

    cat1 = FaqCategoryFactory(slug="tech-filter")
    cat2 = FaqCategoryFactory(slug="pay-filter")
    FaqItemFactory(category=cat1, is_active=True)
    FaqItemFactory(category=cat2, is_active=True)
    res = APIClient().get(FAQ_URL, {"category": "tech-filter"})
    data = res.json()
    assert len(data) == 1
    assert data[0]["slug"] == "tech-filter"


@pytest.mark.django_db
def test_faq_filter_unknown_slug_returns_empty():
    from support.tests.factories import FaqCategoryFactory

    FaqCategoryFactory(slug="some-cat")
    res = APIClient().get(FAQ_URL, {"category": "does-not-exist"})
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.django_db
def test_faq_uses_cache(django_assert_num_queries):
    from support.tests.factories import FaqCategoryFactory, FaqItemFactory

    cat = FaqCategoryFactory(slug="cache-cat")
    FaqItemFactory(category=cat, is_active=True)
    APIClient().get(FAQ_URL)  # populate cache
    with django_assert_num_queries(0):
        APIClient().get(FAQ_URL)


@pytest.mark.django_db
def test_faq_no_n_plus_1(django_assert_num_queries):
    from support.tests.factories import FaqCategoryFactory, FaqItemFactory

    for i in range(3):
        cat = FaqCategoryFactory(slug=f"n1-cat-{i}")
        for j in range(4):
            FaqItemFactory(category=cat, is_active=True, order=j)

    # The selector uses prefetch_related so fetching all categories + items
    # costs exactly 2 queries (1 for categories, 1 for items via prefetch).
    # We bypass cache by clearing it and directly using the selector.
    from support import selectors

    with django_assert_num_queries(2):
        list(selectors.faq())


@pytest.mark.django_db
def test_seed_support_idempotent(django_capsys=None):
    from django.core.management import call_command

    call_command("seed_support", verbosity=0)
    from support.models import FaqCategory, FaqItem

    count_cats = FaqCategory.objects.count()
    count_items = FaqItem.objects.count()
    assert count_cats > 0
    assert count_items > 0

    # Run a second time — counts must not change
    call_command("seed_support", verbosity=0)
    assert FaqCategory.objects.count() == count_cats
    assert FaqItem.objects.count() == count_items
