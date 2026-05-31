import pytest
from django.core.management import call_command

from catalog.models import Creator, Episode, Genre, Season


@pytest.mark.django_db
def test_seed_catalog_populates_and_is_idempotent():
    call_command("seed_catalog")
    assert Genre.objects.count() == 8
    assert Season.objects.count() >= 2
    assert Creator.objects.count() == 8
    assert Episode.objects.count() >= 16
    total = Episode.objects.count()
    call_command("seed_catalog")  # idempotent — second run does not duplicate
    assert Episode.objects.count() == total


@pytest.mark.django_db
def test_seed_true_genre_sets_true_horror():
    call_command("seed_catalog")
    true_eps = Episode.objects.filter(genre__slug="true")
    assert all(e.is_true_horror for e in true_eps)
