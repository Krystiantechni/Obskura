import pytest

from catalog.models import Creator, Genre, Season


@pytest.mark.django_db
def test_genre_autoslug_and_str():
    g = Genre.objects.create(name="Psychologiczny", accent=Genre.Accent.RED)
    assert g.slug == "psychologiczny"
    assert str(g) == "Psychologiczny"


@pytest.mark.django_db
def test_season_autoslug_unique_number():
    s = Season.objects.create(number=3, title="Sezon 03")
    assert s.slug == "sezon-03"
    assert s.number == 3


@pytest.mark.django_db
def test_creator_role_choices_and_slug():
    c = Creator.objects.create(name="Katarzyna Wieczorek", role=Creator.Role.NARRATOR)
    assert c.slug == "katarzyna-wieczorek"
    assert c.role == "narrator"
