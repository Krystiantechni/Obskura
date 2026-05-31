# Faza B2 — Catalog (read-heavy) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** App `catalog` z modelami Season / Genre / Creator / Episode (read-heavy), z optymalnymi zapytaniami (zero N+1), filtrami, cursor-paginacją, cache Redis z inwalidacją sygnałami, indeksami i seedem (16 realnych z frontu + dogenerowane do ~50).

**Architecture:** Cienkie `ReadOnlyModelViewSet`-y delegujące do `selectors.py` (jedyne miejsce optymalnych querysetów). Episode dziedziczy `TimeStampedModel` + `SoftDeleteModel` (tu pierwsze behawioralne testy soft-delete, odłożone z B0). Lookup po `slug`. Katalog publiczny (`AllowAny`). Cache w selektorach (`cache.get_or_set`) + inwalidacja w `signals.py` (post_save/post_delete). Read-serializery rozdzielone.

**Tech Stack:** Django 5.2 · DRF · django-filter · django-redis · PostgreSQL (indeksy composite, JSONB nieużywane tu). Testy: pytest + factory_boy + `django_assert_num_queries` (dowód zero N+1).

> **Konwencje (B0/B1):** commity po ANGIELSKU, bez `Co-Authored-By`. Branch `feat/backend-b2`. Testy w kontenerze (`docker compose run --rm web pytest`). `ruff check` + `ruff format` czyste przed każdym commitem. `conftest.py` ma już autouse `clear_cache` (z B1) — cache izolowany między testami.

## Decyzje projektowe (rozstrzygnięte)

1. **Adresowanie po `slug`** (BACKEND-PLAN §4) — `slug` auto-generowany z tytułu/nazwy w `save()` jeśli pusty; seed/factory ustawiają jawnie. Front migruje `id`→`slug` w B8.
2. **`Episode` dziedziczy `TimeStampedModel` + `SoftDeleteModel`** — `objects` = SoftDeleteManager (żywe). Pozostałe modele (Genre/Season/Creator) tylko `TimeStampedModel` (słowniki, nie kasujemy miękko).
3. **Pola nieobecne w danych frontu** (`premium`, `kind`, `is_true_horror`) — modelowane z sensownymi defaultami; seed wnioskuje z gatunku (genre `true` → `is_true_horror=True`, `kind=DOC`).
4. **`plays_count`/`rating_avg` denormalizowane** (pola na Episode) — front ma display-stringi; seed parsuje (`"847K"`→847000, `4.9`→Decimal). Inkrementacja plays = B3 (playback). Tu tylko pola + wartości z seeda.
5. **Chapters/transcript ODŁOŻONE** — tylko ep-12 ma je we froncie; modelowanie `Chapter`/`TranscriptLine` to osobny task w B3 (player). B2 = czysty katalog.
6. **Katalog publiczny** — wszystkie endpointy `AllowAny`, bez throttle scope (globalny anon throttle wystarcza). `audio_url` zwracane w detalu (gating premium = B3).

## File Structure

```
backend/catalog/
  __init__.py · apps.py · admin.py · migrations/__init__.py
  models.py          # Genre, Season, Creator, Episode
  selectors.py       # episodes_list, episode_by_slug, + simple list selektory (zero N+1, cache)
  serializers.py     # GenreSerializer, SeasonSerializer, CreatorSerializer, EpisodeListSerializer, EpisodeDetailSerializer
  filters.py         # EpisodeFilter (django-filter)
  views.py           # EpisodeViewSet, SeasonViewSet, GenreViewSet, CreatorViewSet
  urls.py            # DefaultRouter
  signals.py         # inwalidacja cache na zmianach katalogu
  management/commands/seed_catalog.py
  tests/
    __init__.py · factories.py
    test_models.py · test_softdelete.py · test_selectors.py
    test_api.py · test_filters.py · test_cache.py · test_seed.py
backend/obskura/settings.py   # catalog w INSTALLED_APPS
backend/obskura/urls.py       # include catalog.urls
```

**Cache keys:** `catalog:episodes:<filters_hash>`, `catalog:genres`, `catalog:seasons`, `catalog:creators`. Inwalidacja: signal kasuje `catalog:*` (django-redis `cache.delete_pattern("catalog:*")`).

---

## Task 1: Genre + Season + Creator models (TDD)

**Files:** `catalog/{__init__,apps,models}.py`, `catalog/migrations/__init__.py`, `catalog/tests/{__init__,test_models}.py`, `backend/obskura/settings.py`

- [ ] **Step 1: failing test** `catalog/tests/test_models.py`:
```python
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
```

- [ ] **Step 2: run, expect FAIL** (`catalog` not installed / models missing).

- [ ] **Step 3: models** `catalog/models.py`:
```python
from django.db import models
from django.utils.text import slugify

from core.models import TimeStampedModel


class Genre(TimeStampedModel):
    class Accent(models.TextChoices):
        RED = "red", "Czerwony"
        BLUE = "blue", "Niebieski"
        NONE = "none", "Brak"

    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=90, unique=True)
    accent = models.CharField(max_length=4, choices=Accent.choices, default=Accent.NONE)

    class Meta(TimeStampedModel.Meta):
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Season(TimeStampedModel):
    number = models.PositiveSmallIntegerField(unique=True)
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=130, unique=True)
    cover = models.CharField(max_length=300, blank=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta(TimeStampedModel.Meta):
        ordering = ["-number"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Creator(TimeStampedModel):
    class Role(models.TextChoices):
        NARRATOR = "narrator", "Narrator"
        DIRECTOR = "director", "Reżyseria"
        SOUND = "sound", "Dźwięk"
        WRITER = "writer", "Scenariusz"

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=130, unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.NARRATOR, db_index=True)
    bio = models.TextField(blank=True)
    avatar = models.CharField(max_length=300, blank=True)

    class Meta(TimeStampedModel.Meta):
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
```
`catalog/apps.py`:
```python
from django.apps import AppConfig


class CatalogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "catalog"
```
> `TimeStampedModel.Meta` ma `ordering = ["-created_at"]` i `abstract = True`. Dziedzicząc Meta nadpisujemy `ordering`; `abstract` NIE jest dziedziczone (dziecko jest konkretne). To poprawny wzorzec.

- [ ] **Step 4: settings** — dodaj `"catalog"` do `INSTALLED_APPS` (sekcja `# local`, po `accounts`).

- [ ] **Step 5: migracje**
```bash
docker compose run --rm web python manage.py makemigrations catalog
docker compose run --rm web python manage.py migrate
```
Przeczytaj migrację (sanity check). Brak resetu wolumenu (to addytywna app, nie zmiana AUTH_USER_MODEL).

- [ ] **Step 6: run, expect PASS** (3 passed).

- [ ] **Step 7: lint + commit**
```bash
docker compose run --rm web ruff check catalog/ && docker compose run --rm web ruff format catalog/
# re-check both clean
git add backend/catalog/ backend/obskura/settings.py
git commit -m "feat(catalog): Genre, Season, Creator models with auto-slug (B2)"
```

---

## Task 2: Episode model (FK/M2M/indexes/SoftDelete) + soft-delete behavioral tests (TDD)

**Files:** `catalog/models.py` (add Episode), `catalog/tests/{factories.py,test_models.py,test_softdelete.py}`

- [ ] **Step 1: factories** `catalog/tests/factories.py`:
```python
import factory

from catalog.models import Creator, Episode, Genre, Season


class GenreFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Genre
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Genre {n}")
    slug = factory.Sequence(lambda n: f"genre-{n}")
    accent = Genre.Accent.RED


class SeasonFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Season
        django_get_or_create = ("number",)

    number = factory.Sequence(lambda n: n + 1)
    title = factory.LazyAttribute(lambda o: f"Sezon {o.number:02d}")
    slug = factory.LazyAttribute(lambda o: f"sezon-{o.number:02d}")


class CreatorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Creator
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Creator {n}")
    slug = factory.Sequence(lambda n: f"creator-{n}")
    role = Creator.Role.NARRATOR


class EpisodeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Episode
        skip_postgeneration_save = True

    season = factory.SubFactory(SeasonFactory)
    genre = factory.SubFactory(GenreFactory)
    number = factory.Sequence(lambda n: n + 1)
    title = factory.Sequence(lambda n: f"Odcinek {n}")
    slug = factory.Sequence(lambda n: f"odcinek-{n}")
    duration_s = 2820
    published_at = factory.Faker("date_time_this_decade", tzinfo=__import__("datetime").timezone.utc)

    @factory.post_generation
    def creators(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.creators.set(extracted)
        else:
            self.creators.add(CreatorFactory())
```

`catalog/tests/test_models.py` — dopisz:
```python
import pytest

from catalog.models import Episode
from catalog.tests.factories import EpisodeFactory


@pytest.mark.django_db
def test_episode_autoslug_and_relations():
    ep = EpisodeFactory(title="Mgła nad Wisłoujściem", slug="")
    assert ep.slug == "mgla-nad-wisloujsciem"
    assert ep.season is not None
    assert ep.genre is not None
    assert ep.creators.count() == 1


@pytest.mark.django_db
def test_episode_kind_defaults_fiction():
    ep = EpisodeFactory()
    assert ep.kind == Episode.Kind.FICTION
    assert ep.premium is False
    assert ep.is_true_horror is False
```

- [ ] **Step 2: run, expect FAIL** (Episode missing).

- [ ] **Step 3: Episode model** — dopisz do `catalog/models.py`:
```python
from core.models import SoftDeleteModel  # dodaj do importów


class Episode(TimeStampedModel, SoftDeleteModel):
    class Kind(models.TextChoices):
        FICTION = "fiction", "Fikcja"
        INSPIRED = "inspired", "Oparte na faktach"
        DOC = "doc", "Dokument"

    season = models.ForeignKey(Season, on_delete=models.PROTECT, related_name="episodes")
    genre = models.ForeignKey(Genre, on_delete=models.PROTECT, related_name="episodes")
    creators = models.ManyToManyField(Creator, related_name="episodes", blank=True)

    number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200)
    title_em = models.CharField(max_length=120, blank=True)
    slug = models.SlugField(max_length=220, unique=True)

    duration_s = models.PositiveIntegerField(default=0)
    audio_url = models.CharField(max_length=400, blank=True)
    poster = models.CharField(max_length=400, blank=True)
    video_preview = models.CharField(max_length=400, blank=True)

    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    plays_count = models.PositiveIntegerField(default=0)

    is_true_horror = models.BooleanField(default=False)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.FICTION)
    premium = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["-published_at", "-number"]
        indexes = [
            models.Index(fields=["genre", "published_at"]),
            models.Index(fields=["premium", "published_at"]),
            models.Index(fields=["season", "number"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["season", "number"], name="uniq_episode_season_number"),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"S{self.season.number:02d}E{self.number:02d} {self.title}"
```
> Episode dziedziczy DWA abstrakcyjne mixiny. `SoftDeleteModel` dostarcza `objects = SoftDeleteManager()` (żywe) + `all_objects`, `is_deleted`, `deleted_at`, oraz `base_manager_name="all_objects"`. `TimeStampedModel` dostarcza `created_at`/`updated_at`. Własna `Meta` (nie dziedziczy po mixinach) — definiujemy `ordering`/`indexes`/`constraints` jawnie.

- [ ] **Step 4: behawioralne testy soft-delete** `catalog/tests/test_softdelete.py` (DŁUG Z B0 — pierwszy konkretny model z SoftDelete):
```python
import pytest

from catalog.models import Episode
from catalog.tests.factories import EpisodeFactory


@pytest.mark.django_db
def test_instance_delete_is_soft():
    ep = EpisodeFactory()
    pk = ep.pk
    ep.delete()
    # nie ma go w domyślnym managerze, jest w all_objects
    assert not Episode.objects.filter(pk=pk).exists()
    obj = Episode.all_objects.get(pk=pk)
    assert obj.is_deleted is True
    assert obj.deleted_at is not None


@pytest.mark.django_db
def test_queryset_bulk_delete_is_soft():
    EpisodeFactory.create_batch(3)
    Episode.objects.all().delete()
    assert Episode.objects.count() == 0
    assert Episode.all_objects.count() == 3
    assert all(o.is_deleted for o in Episode.all_objects.all())


@pytest.mark.django_db
def test_default_manager_excludes_deleted():
    keep = EpisodeFactory()
    gone = EpisodeFactory()
    gone.delete()
    slugs = set(Episode.objects.values_list("slug", flat=True))
    assert keep.slug in slugs
    assert gone.slug not in slugs
```

- [ ] **Step 5: migracje** `makemigrations catalog` + `migrate`. Przeczytaj migrację (indeksy + constraint obecne).

- [ ] **Step 6: run, expect PASS** (test_models Episode + test_softdelete — wszystkie zielone).

- [ ] **Step 7: lint + commit**
```bash
git add backend/catalog/
git commit -m "feat(catalog): Episode model with FK/M2M, indexes, soft-delete (B2)"
```

---

## Task 3: Selectors (zero N+1) + read serializers (TDD)

**Files:** `catalog/selectors.py`, `catalog/serializers.py`, `catalog/tests/test_selectors.py`

- [ ] **Step 1: failing test** `catalog/tests/test_selectors.py`:
```python
import pytest

from catalog.selectors import episodes_list
from catalog.tests.factories import CreatorFactory, EpisodeFactory, GenreFactory


@pytest.mark.django_db
def test_episodes_list_no_nplus1(django_assert_num_queries):
    g = GenreFactory()
    for _ in range(5):
        ep = EpisodeFactory(genre=g)
        ep.creators.set([CreatorFactory(), CreatorFactory()])
    qs = episodes_list()
    # 1 zapytanie na odcinki+season+genre (select_related) + 1 na prefetch creators = 2, niezależnie od liczby
    with django_assert_num_queries(2):
        data = [(e.season.number, e.genre.name, list(e.creators.all())) for e in qs]
    assert len(data) == 5


@pytest.mark.django_db
def test_episodes_list_filter_by_genre():
    g1 = GenreFactory(slug="psy")
    g2 = GenreFactory(slug="folk")
    EpisodeFactory(genre=g1)
    EpisodeFactory(genre=g2)
    assert episodes_list(genre="psy").count() == 1
```

- [ ] **Step 2: run, expect FAIL** (`catalog.selectors` missing).

- [ ] **Step 3: selectors** `catalog/selectors.py`:
```python
from catalog.models import Creator, Episode, Genre, Season


def episodes_list(*, genre=None, season=None):
    qs = (
        Episode.objects.select_related("season", "genre")
        .prefetch_related("creators")
    )
    if genre:
        qs = qs.filter(genre__slug=genre)
    if season is not None:
        qs = qs.filter(season__number=season)
    return qs


def episode_by_slug(slug):
    return (
        Episode.objects.select_related("season", "genre")
        .prefetch_related("creators")
        .get(slug=slug)
    )


def genres_list():
    return Genre.objects.all()


def seasons_list():
    return Season.objects.all()


def creators_list(*, role=None):
    qs = Creator.objects.all()
    return qs.filter(role=role) if role else qs
```

- [ ] **Step 4: serializers** `catalog/serializers.py`:
```python
from rest_framework import serializers

from catalog.models import Creator, Episode, Genre, Season


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["name", "slug", "accent"]
        read_only_fields = fields


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ["number", "title", "slug", "cover", "published_at"]
        read_only_fields = fields


class CreatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creator
        fields = ["name", "slug", "role", "bio", "avatar"]
        read_only_fields = fields


class EpisodeListSerializer(serializers.ModelSerializer):
    season = serializers.IntegerField(source="season.number", read_only=True)
    genre = serializers.SlugField(source="genre.slug", read_only=True)

    class Meta:
        model = Episode
        fields = [
            "slug", "number", "season", "title", "title_em", "genre",
            "duration_s", "poster", "video_preview", "rating_avg",
            "plays_count", "is_true_horror", "kind", "premium", "published_at",
        ]
        read_only_fields = fields


class EpisodeDetailSerializer(serializers.ModelSerializer):
    season = SeasonSerializer(read_only=True)
    genre = GenreSerializer(read_only=True)
    creators = CreatorSerializer(many=True, read_only=True)

    class Meta:
        model = Episode
        fields = [
            "slug", "number", "season", "title", "title_em", "genre", "creators",
            "duration_s", "audio_url", "poster", "video_preview", "rating_avg",
            "plays_count", "is_true_horror", "kind", "premium", "published_at",
        ]
        read_only_fields = fields
```

- [ ] **Step 5: run, expect PASS** (selektory + query-count test zielone — to dowód zero N+1).

- [ ] **Step 6: lint + commit**
```bash
git add backend/catalog/
git commit -m "feat(catalog): optimized selectors (zero N+1) and read serializers (B2)"
```

---

## Task 4: ViewSets + filtry + pagination + urls (TDD, query-count na API)

**Files:** `catalog/filters.py`, `catalog/views.py`, `catalog/urls.py`, `backend/obskura/urls.py`, `catalog/tests/{test_api.py,test_filters.py}`

- [ ] **Step 1: failing tests** `catalog/tests/test_api.py`:
```python
import pytest
from rest_framework.test import APIClient

from catalog.tests.factories import CreatorFactory, EpisodeFactory, GenreFactory


@pytest.mark.django_db
def test_episodes_list_public_and_paginated():
    EpisodeFactory.create_batch(3)
    res = APIClient().get("/api/v1/catalog/episodes")
    assert res.status_code == 200
    body = res.json()
    assert "results" in body and len(body["results"]) == 3


@pytest.mark.django_db
def test_episode_detail_by_slug_includes_relations():
    ep = EpisodeFactory(slug="mgla-nad", title="Mgła nad")
    ep.creators.set([CreatorFactory()])
    res = APIClient().get("/api/v1/catalog/episodes/mgla-nad")
    assert res.status_code == 200
    body = res.json()
    assert body["slug"] == "mgla-nad"
    assert isinstance(body["genre"], dict)  # detail zagnieżdża genre
    assert isinstance(body["creators"], list)


@pytest.mark.django_db
def test_episodes_list_constant_queries(django_assert_max_num_queries):
    g = GenreFactory()
    for _ in range(10):
        EpisodeFactory(genre=g).creators.set([CreatorFactory()])
    # paginacja + select_related + prefetch => stała liczba, NIE rośnie z liczbą odcinków
    with django_assert_max_num_queries(6):
        APIClient().get("/api/v1/catalog/episodes")


@pytest.mark.django_db
def test_seasons_genres_creators_endpoints():
    EpisodeFactory()
    c = APIClient()
    assert c.get("/api/v1/catalog/seasons").status_code == 200
    assert c.get("/api/v1/catalog/genres").status_code == 200
    assert c.get("/api/v1/catalog/creators").status_code == 200
```

`catalog/tests/test_filters.py`:
```python
import pytest
from rest_framework.test import APIClient

from catalog.tests.factories import EpisodeFactory, GenreFactory, SeasonFactory


@pytest.mark.django_db
def test_filter_by_genre_and_season():
    psy = GenreFactory(slug="psy")
    folk = GenreFactory(slug="folk")
    s2 = SeasonFactory(number=2)
    s3 = SeasonFactory(number=3)
    EpisodeFactory(genre=psy, season=s2)
    EpisodeFactory(genre=folk, season=s3)
    c = APIClient()
    assert len(c.get("/api/v1/catalog/episodes?genre=psy").json()["results"]) == 1
    assert len(c.get("/api/v1/catalog/episodes?season=2").json()["results"]) == 1


@pytest.mark.django_db
def test_search_by_title():
    EpisodeFactory(title="Mgła nad Wisłoujściem", slug="mgla")
    EpisodeFactory(title="Cisza na Mokotowie", slug="cisza")
    res = APIClient().get("/api/v1/catalog/episodes?search=Mgła")
    assert len(res.json()["results"]) == 1
```

- [ ] **Step 2: run, expect FAIL** (404 — routes missing).

- [ ] **Step 3: filters** `catalog/filters.py`:
```python
from django_filters import rest_framework as filters

from catalog.models import Episode


class EpisodeFilter(filters.FilterSet):
    genre = filters.CharFilter(field_name="genre__slug")
    season = filters.NumberFilter(field_name="season__number")

    class Meta:
        model = Episode
        fields = ["genre", "season", "kind", "is_true_horror", "premium"]
```

- [ ] **Step 4: views** `catalog/views.py`:
```python
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet
from django_filters.rest_framework import DjangoFilterBackend

from catalog import selectors
from catalog.filters import EpisodeFilter
from catalog.pagination import EpisodeCursorPagination
from catalog.serializers import (
    CreatorSerializer,
    EpisodeDetailSerializer,
    EpisodeListSerializer,
    GenreSerializer,
    SeasonSerializer,
)
from core.pagination import DefaultPageNumberPagination


class EpisodeViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = EpisodeCursorPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = EpisodeFilter
    ordering_fields = ["published_at", "rating_avg", "plays_count", "number"]
    ordering = ["-published_at"]
    search_fields = ["title", "title_em"]

    def get_queryset(self):
        return selectors.episodes_list()

    def get_serializer_class(self):
        return EpisodeDetailSerializer if self.action == "retrieve" else EpisodeListSerializer


class SeasonViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = DefaultPageNumberPagination
    serializer_class = SeasonSerializer

    def get_queryset(self):
        return selectors.seasons_list()


class GenreViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = DefaultPageNumberPagination
    serializer_class = GenreSerializer

    def get_queryset(self):
        return selectors.genres_list()


class CreatorViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = DefaultPageNumberPagination
    serializer_class = CreatorSerializer

    def get_queryset(self):
        role = self.request.query_params.get("role")
        return selectors.creators_list(role=role)
```

`catalog/pagination.py`:
```python
from core.pagination import DefaultCursorPagination


class EpisodeCursorPagination(DefaultCursorPagination):
    ordering = "-published_at"
```
> `DefaultCursorPagination` (B0) ma `ordering="-created_at"`; odcinki sortujemy po `published_at`, więc nadpisujemy `ordering`. Cursor pagination wymaga deterministycznego, indeksowanego pola — `published_at` ma `db_index=True`.

- [ ] **Step 5: urls** `catalog/urls.py`:
```python
from rest_framework.routers import DefaultRouter

from catalog.views import CreatorViewSet, EpisodeViewSet, GenreViewSet, SeasonViewSet

router = DefaultRouter(trailing_slash=False)
router.register("catalog/episodes", EpisodeViewSet, basename="episode")
router.register("catalog/seasons", SeasonViewSet, basename="season")
router.register("catalog/genres", GenreViewSet, basename="genre")
router.register("catalog/creators", CreatorViewSet, basename="creator")

urlpatterns = router.urls
```
> `trailing_slash=False` — spójne z `APPEND_SLASH=False` (B1) i ścieżkami slash-less.

W `backend/obskura/urls.py` dodaj:
```python
    path("api/v1/", include("catalog.urls")),
```

- [ ] **Step 6: run, expect PASS** (test_api + test_filters zielone, w tym `django_assert_max_num_queries(6)` — dowód zero N+1 na poziomie API).

- [ ] **Step 7: lint + commit**
```bash
git add backend/catalog/ backend/obskura/urls.py
git commit -m "feat(catalog): read-only viewsets, filters, cursor pagination, routes (B2)"
```

---

## Task 5: Cache + signal invalidation (TDD)

**Files:** `catalog/selectors.py` (cache w list selektorach), `catalog/signals.py`, `catalog/apps.py` (ready), `catalog/tests/test_cache.py`

- [ ] **Step 1: failing test** `catalog/tests/test_cache.py`:
```python
import pytest
from django.core.cache import cache

from catalog.selectors import genres_list_cached
from catalog.tests.factories import GenreFactory


@pytest.mark.django_db
def test_genres_cached_then_invalidated_on_save():
    GenreFactory(slug="psy", name="Psy")
    first = genres_list_cached()
    assert len(first) == 1
    # dodanie gatunku -> signal czyści cache -> kolejne wywołanie widzi 2
    GenreFactory(slug="folk", name="Folk")
    second = genres_list_cached()
    assert len(second) == 2


@pytest.mark.django_db
def test_genres_cache_hit_uses_cache():
    GenreFactory(slug="psy")
    genres_list_cached()
    assert cache.get("catalog:genres") is not None
```

- [ ] **Step 2: run, expect FAIL** (`genres_list_cached` missing).

- [ ] **Step 3: cached selektory** — dopisz do `catalog/selectors.py`:
```python
from django.core.cache import cache

CACHE_TTL = 60 * 15  # 15 min


def genres_list_cached():
    data = cache.get("catalog:genres")
    if data is None:
        data = list(genres_list())
        cache.set("catalog:genres", data, CACHE_TTL)
    return data


def seasons_list_cached():
    data = cache.get("catalog:seasons")
    if data is None:
        data = list(seasons_list())
        cache.set("catalog:seasons", data, CACHE_TTL)
    return data
```
> Cache'ujemy listy słownikowe (rzadko zmienne: gatunki, sezony). Episodes/Creators (rosnące/filtrowane) NIE cache'ujemy per-lista w B2 — cursor pagination + indeksy wystarczą.

- [ ] **Step 3b: wepnij cache w widoki (żeby realnie działał w flow)** — zmodyfikuj `catalog/views.py` (plik z Task 4): `GenreViewSet` i `SeasonViewSet` dostają `pagination_class = None` (słowniki skończone) i override `list()` zwracający zserializowaną, cache'owaną odpowiedź:
```python
from rest_framework.response import Response  # dodaj do importów views.py


class GenreViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = None
    serializer_class = GenreSerializer

    def get_queryset(self):
        return selectors.genres_list()

    def list(self, request, *args, **kwargs):
        return Response(GenreSerializer(selectors.genres_list_cached(), many=True).data)


class SeasonViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    lookup_field = "slug"
    pagination_class = None
    serializer_class = SeasonSerializer

    def get_queryset(self):
        return selectors.seasons_list()

    def list(self, request, *args, **kwargs):
        return Response(SeasonSerializer(selectors.seasons_list_cached(), many=True).data)
```
> `retrieve` (detal po slug) nadal działa przez `get_queryset`. Tylko `list` korzysta z cache. `CreatorViewSet`/`EpisodeViewSet` bez zmian (paginowane). Test API poniżej potwierdza, że lista gatunków trafia do cache i jest inwalidowana sygnałem.

- [ ] **Step 4: signals** `catalog/signals.py`:
```python
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from catalog.models import Creator, Episode, Genre, Season


@receiver([post_save, post_delete], sender=Genre)
@receiver([post_save, post_delete], sender=Season)
@receiver([post_save, post_delete], sender=Creator)
@receiver([post_save, post_delete], sender=Episode)
def invalidate_catalog_cache(sender, **kwargs):
    try:
        cache.delete_pattern("catalog:*")
    except AttributeError:
        # backend bez delete_pattern (np. LocMemCache) — czyść znane klucze
        cache.delete_many(["catalog:genres", "catalog:seasons", "catalog:creators"])
```

`catalog/apps.py` — podłącz signals w `ready()`:
```python
    def ready(self):
        from catalog import signals  # noqa: F401
```

- [ ] **Step 5: run, expect PASS** (cache hit + inwalidacja zielone). Uwaga: `conftest.py` autouse `clear_cache` zapewnia izolację — test invalidacji opiera się na signalu, nie na resztkach.

- [ ] **Step 6: lint + commit**
```bash
git add backend/catalog/
git commit -m "feat(catalog): redis cache for genres/seasons with signal invalidation (B2)"
```

---

## Task 6: Seed management command (16 realnych z frontu + dogenerowane do ~50)

**Files:** `catalog/management/__init__.py`, `catalog/management/commands/__init__.py`, `catalog/management/commands/seed_catalog.py`, `catalog/tests/test_seed.py`

- [ ] **Step 1: failing test** `catalog/tests/test_seed.py`:
```python
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
    # idempotencja — drugie uruchomienie nie duplikuje
    call_command("seed_catalog")
    assert Episode.objects.count() == total


@pytest.mark.django_db
def test_seed_true_genre_sets_true_horror():
    call_command("seed_catalog")
    true_eps = Episode.objects.filter(genre__slug="true")
    assert all(e.is_true_horror for e in true_eps)
```

- [ ] **Step 2: run, expect FAIL** (command missing).

- [ ] **Step 3: command** `catalog/management/commands/seed_catalog.py`. Wymagania:
  - `__init__.py` w `management/` i `management/commands/`.
  - 8 gatunków (slug→name→accent): `psy`/Psychologiczny/red, `true`/True horror/red, `body`/Body horror/red, `folk`/Folk horror/blue, `cosmic`/Cosmic dread/blue, `cyber`/Cyber horror/blue, `noir`/Noir/none, `myth`/Mitologia/none.
  - 8 twórców (z `Creators.jsx`): Katarzyna Wieczorek/narrator, + 7 wg `role` (narrator×5, director×3 itd. — przypisz role wg tagów; nazwy z frontu lub reprezentatywne).
  - Sezony 2 i 3 (title `"Sezon 02"`/`"Sezon 03"`).
  - **16 realnych odcinków** z `Archive.jsx` `STORIES` (num, season, title, titleEm→title_em, genre slug, dur→duration_s=dur*60, year→published_at, rating→rating_avg, plays string→plays_count int). `is_true_horror=True` + `kind=DOC` dla genre `true`. Audio dla tych, które są w `tracks.js` (ep-2..7, ep-12) → `audio_url=/audio/ep-{n}.mp3`.
  - **Dogenerowanie do ~50**: `EpisodeFactory`-podobna logika W KOMENDZIE (nie import z tests/) — utwórz dodatkowe odcinki z losowym (deterministycznym, seed) przypisaniem gatunku/sezonu, oznaczone w tytule jako wygenerowane (np. `"Echo {i}"`), aż łączna liczba = 50.
  - **Idempotencja:** `get_or_create`/`update_or_create` po `slug`/`number` — ponowne uruchomienie nie duplikuje.
  - Użyj `transaction.atomic`. Loguj podsumowanie (`self.stdout.write`).
  - **NIE importuj z `catalog.tests`** (testy nie są w ścieżce produkcyjnej). Dane wpisz w komendzie.

  > Engineer: napisz kompletny `Command(BaseCommand)` z `handle()`. Realne 16 rekordów wpisz jako listę krotek/dictów w pliku komendy (źródło: `src/pages/Archive.jsx` STORIES — odwzoruj num/season/title/titleEm/genre/dur/year/rating/plays). Dla nazw twórców użyj tych z `src/pages/Creators.jsx` (name+nameEm → `name`). Brakujące pola (slug) generuj `slugify`. Determinizm generacji: użyj `random.Random(42)` (NIE globalnego random) by seed był powtarzalny.

- [ ] **Step 4: run, expect PASS** + uruchom realnie:
```bash
docker compose run --rm web python manage.py migrate
docker compose run --rm web python manage.py seed_catalog
docker compose run --rm web python manage.py shell -c "from catalog.models import Episode; print(Episode.objects.count())"
```
Expected: ~50 odcinków, test idempotencji zielony.

- [ ] **Step 5: lint + commit**
```bash
git add backend/catalog/
git commit -m "feat(catalog): seed_catalog command (16 real + generated to ~50) (B2)"
```

---

## Task 7: Admin + final verification

**Files:** `catalog/admin.py`

- [ ] **Step 1: admin** `catalog/admin.py`:
```python
from django.contrib import admin

from catalog.models import Creator, Episode, Genre, Season


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "accent"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name", "slug"]


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ["number", "title", "slug", "published_at"]
    prepopulated_fields = {"slug": ("title",)}
    ordering = ["-number"]


@admin.register(Creator)
class CreatorAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "slug"]
    list_filter = ["role"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ["title", "season", "number", "genre", "premium", "is_true_horror", "published_at"]
    list_filter = ["premium", "is_true_horror", "kind", "genre", "season"]
    search_fields = ["title", "title_em", "slug"]
    list_select_related = ["season", "genre"]
    autocomplete_fields = ["season", "genre", "creators"]
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "published_at"
```
> `list_select_related` + `autocomplete_fields` chronią admin przed N+1. `autocomplete_fields` wymaga `search_fields` na powiązanych adminach (Genre/Season/Creator je mają; Season dodaj `search_fields = ["title"]` jeśli brak).

- [ ] **Step 2: final verify**
```bash
docker compose run --rm web python manage.py check
docker compose run --rm web ruff check .
docker compose run --rm web ruff format --check .
docker compose run --rm web pytest
```
Expected: check 0 issues (admin bez E0xx); ruff clean; cały pytest zielony (B0 + B1 + B2).

- [ ] **Step 3: commit**
```bash
git add backend/catalog/admin.py
git commit -m "feat(catalog): Django admin for catalog models (B2)"
```

---

## Definition of Done (B2)

- [ ] Modele Genre/Season/Creator/Episode z auto-slug, indeksami composite, FK/M2M; Episode soft-delete.
- [ ] Behawioralne testy soft-delete (instance + bulk + default manager) — DŁUG Z B0 spłacony.
- [ ] `GET /api/v1/catalog/episodes` (cursor, filtry genre/season/kind/premium, search, ordering), `/episodes/{slug}` (zagnieżdżone relacje), `/seasons` `/genres` `/creators` — publiczne.
- [ ] **Zero N+1** udowodnione `django_assert_num_queries`/`max_num_queries` (selektor + API).
- [ ] Cache Redis na gatunki/sezony + inwalidacja sygnałami.
- [ ] `seed_catalog`: 8 gatunków, ≥2 sezony, 8 twórców, ~50 odcinków (16 realnych), idempotentny.
- [ ] Admin (z `list_select_related`/autocomplete — bez N+1).
- [ ] `manage.py check` 0; ruff clean; cały pytest zielony. Commity EN, bez `Co-Authored-By`.

**Następna faza:** B3 — Playback (progress/favorites/queue/history, gating premium na `audio_url`, inkrementacja `plays_count`, modele Chapter/TranscriptLine z tracks.js).
