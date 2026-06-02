"""Task 2 — failing tests for LegalDoc/PressItem models."""

import pytest
from django.db import IntegrityError

from pages.models import LegalKind


@pytest.mark.django_db
def test_legaldoc_create():
    from pages.tests.factories import LegalDocFactory

    doc = LegalDocFactory(is_current=True)
    assert doc.pk is not None
    assert doc.kind == LegalKind.PRYWATNOSC


@pytest.mark.django_db
def test_legaldoc_partial_unique_blocks_two_current_for_same_kind():
    """Two is_current=True rows for same kind must raise IntegrityError."""
    from pages.tests.factories import LegalDocFactory

    LegalDocFactory(kind=LegalKind.REGULAMIN, is_current=True)
    with pytest.raises(IntegrityError):
        LegalDocFactory(kind=LegalKind.REGULAMIN, is_current=True)


@pytest.mark.django_db
def test_legaldoc_partial_unique_allows_two_non_current_for_same_kind():
    """Two is_current=False rows for same kind are allowed."""
    from pages.tests.factories import LegalDocFactory

    d1 = LegalDocFactory(kind=LegalKind.COOKIES, is_current=False)
    d2 = LegalDocFactory(kind=LegalKind.COOKIES, is_current=False)
    assert d1.pk is not None
    assert d2.pk is not None


@pytest.mark.django_db
def test_legaldoc_partial_unique_allows_current_for_different_kinds():
    """One is_current=True per kind is fine; different kinds don't conflict."""
    from pages.tests.factories import LegalDocFactory

    d1 = LegalDocFactory(kind=LegalKind.PRYWATNOSC, is_current=True)
    d2 = LegalDocFactory(kind=LegalKind.REGULAMIN, is_current=True)
    d3 = LegalDocFactory(kind=LegalKind.COOKIES, is_current=True)
    assert d1.pk is not None
    assert d2.pk is not None
    assert d3.pk is not None


@pytest.mark.django_db
def test_legaldoc_str():
    from pages.tests.factories import LegalDocFactory

    doc = LegalDocFactory(kind=LegalKind.PRYWATNOSC, version="4.2.1")
    assert "prywatnosc" in str(doc)
    assert "4.2.1" in str(doc)


@pytest.mark.django_db
def test_pressitem_create():
    from pages.tests.factories import PressItemFactory

    item = PressItemFactory()
    assert item.pk is not None
    assert item.is_active is True


@pytest.mark.django_db
def test_pressitem_ordering_by_order():
    from pages.tests.factories import PressItemFactory

    p2 = PressItemFactory(order=2)
    p0 = PressItemFactory(order=0)
    p1 = PressItemFactory(order=1)
    from pages.models import PressItem

    items = list(PressItem.objects.all())
    assert items[0].pk == p0.pk
    assert items[1].pk == p1.pk
    assert items[2].pk == p2.pk
