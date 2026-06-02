"""Task 3 — model tests for FaqCategory and FaqItem."""

import pytest

from support.tests.factories import FaqCategoryFactory, FaqItemFactory


@pytest.mark.django_db
def test_faq_category_str():
    cat = FaqCategoryFactory(name="Technical")
    assert str(cat) == "Technical"


@pytest.mark.django_db
def test_faq_item_str():
    item = FaqItemFactory(question="How do I login?")
    assert "How do I login?" in str(item)


@pytest.mark.django_db
def test_faq_category_default_active():
    cat = FaqCategoryFactory()
    assert cat.is_active is True


@pytest.mark.django_db
def test_faq_item_default_active():
    item = FaqItemFactory()
    assert item.is_active is True


@pytest.mark.django_db
def test_faq_item_protect_on_category_delete():
    from django.db import IntegrityError

    cat = FaqCategoryFactory()
    FaqItemFactory(category=cat)
    with pytest.raises((IntegrityError, Exception)):
        cat.delete()


@pytest.mark.django_db
def test_faq_category_ordering():
    FaqCategoryFactory(order=2, slug="b")
    FaqCategoryFactory(order=0, slug="a")
    FaqCategoryFactory(order=5, slug="c")
    from support.models import FaqCategory

    qs = list(FaqCategory.objects.filter(is_active=True))
    orders = [c.order for c in qs]
    assert orders == sorted(orders)
