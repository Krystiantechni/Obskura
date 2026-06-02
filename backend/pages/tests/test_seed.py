"""Task 2 — idempotency tests for seed_pages command."""

import pytest
from django.core.management import call_command

from pages.models import LegalDoc, LegalKind, PressItem


@pytest.mark.django_db
def test_seed_creates_legal_docs():
    call_command("seed_pages", verbosity=0)
    assert LegalDoc.objects.filter(is_current=True).count() == 3


@pytest.mark.django_db
def test_seed_creates_all_kinds():
    call_command("seed_pages", verbosity=0)
    kinds = set(LegalDoc.objects.filter(is_current=True).values_list("kind", flat=True))
    assert LegalKind.PRYWATNOSC in kinds
    assert LegalKind.REGULAMIN in kinds
    assert LegalKind.COOKIES in kinds


@pytest.mark.django_db
def test_seed_creates_press_items():
    call_command("seed_pages", verbosity=0)
    assert PressItem.objects.count() > 0


@pytest.mark.django_db
def test_seed_is_idempotent():
    call_command("seed_pages", verbosity=0)
    legal_count_1 = LegalDoc.objects.count()
    press_count_1 = PressItem.objects.count()

    call_command("seed_pages", verbosity=0)
    legal_count_2 = LegalDoc.objects.count()
    press_count_2 = PressItem.objects.count()

    assert legal_count_1 == legal_count_2
    assert press_count_1 == press_count_2


@pytest.mark.django_db
def test_seed_legal_version():
    call_command("seed_pages", verbosity=0)
    docs = LegalDoc.objects.filter(is_current=True)
    for doc in docs:
        assert doc.version == "4.2.1"


@pytest.mark.django_db
def test_seed_press_items_active():
    call_command("seed_pages", verbosity=0)
    inactive = PressItem.objects.filter(is_active=False)
    assert inactive.count() == 0
