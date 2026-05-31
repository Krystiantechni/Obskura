# Faza B3 — Playback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** App `playback` (Progress / Favorite / QueueItem / Rating) + treść odcinka (Chapter / TranscriptLine w `catalog`) + gating audio premium (auth-only) + inkrementacja `plays_count` + przeliczanie `rating_avg`. Wszystkie endpointy użytkownika wymagają auth (Knox).

**Architecture:** Nowa app `playback` dla aktywności użytkownika (progress/favorites/queue/ratings) — cienkie viewsety → `selectors`/`services`. `Chapter`/`TranscriptLine` to treść odcinka → dodane do `catalog` (FK Episode), serwowane w detalu odcinka. Premium gating: `audio_url` przez `SerializerMethodField` w `EpisodeDetailSerializer` (premium + anon → null). `plays_count` inkrementowany atomowo (`F()`) przy pierwszym progressie. `rating_avg` denormalizowany — przeliczany agregatem `Avg` w signalu po zapisie/usunięciu Rating (zero pętli Pythona).

**Tech Stack:** Django 5.2 · DRF · Knox · PostgreSQL. Testy: pytest + factory_boy + `django_assert_num_queries`.

> **Konwencje:** commity po ANGIELSKU, bez `Co-Authored-By`. Branch `feat/backend-b3`. Testy w kontenerze. ruff czysty przed commitem. `docker compose`/git są już na allowliście. Permisje user-specific → `IsAuthenticated` (globalny default DRF), więc viewsety NIE potrzebują jawnego `permission_classes` poza miejscami publicznymi.

## Decyzje projektowe (rozstrzygnięte)

1. **Premium gating = auth-only.** `audio_url` premium odcinka zwracany tylko zalogowanym; anon → `null`. Pełny tier-gating (free 20/mc vs solo/klan) dochodzi w B4 (membership).
2. **Ratings: pełny backend.** `Rating(user, episode, value 1-5)` + endpoint upsert + przeliczanie `Episode.rating_avg` agregatem w signalu. Front doda widget później.
3. **Chapter/TranscriptLine w `catalog`** (treść odcinka, nie aktywność usera). Seed ep12 z `src/data/tracks.js` (9 rozdziałów, 12 linii transkryptu).
4. **`plays_count`** inkrementowany przy PIERWSZYM progressie usera dla odcinka (`F()`-atomic), nie per-request.
5. **Adresowanie po `episode slug`** w endpointach playback (`/playback/progress/<slug>`), spójnie z B2.
6. **Queue** — `position` (int) jako kolejność; brak reorder UI we froncie, ale pole gotowe. Bez paginacji (kolejka krótka).

## File Structure

```
backend/playback/
  __init__.py · apps.py · admin.py · migrations/__init__.py
  models.py          # Progress, Favorite, QueueItem, Rating
  selectors.py       # history(), favorites(), queue_items(), user_rating()
  services.py        # upsert_progress (+plays_count), set_rating, recalc_rating_avg
  serializers.py     # read/write per zasób
  views.py           # ProgressView, HistoryView, FavoriteViewSet, QueueViewSet, RatingView
  urls.py
  signals.py         # Rating post_save/post_delete → recalc Episode.rating_avg
  tests/ (__init__, factories, test_models, test_progress, test_favorites_queue, test_ratings, test_history)
backend/catalog/
  models.py          # + Chapter, TranscriptLine
  serializers.py     # + ChapterSerializer, TranscriptLineSerializer; EpisodeDetailSerializer: audio_url gated + chapters/transcript nested
  management/commands/seed_catalog.py  # + seed ep12 chapters/transcript
backend/obskura/{settings,urls}.py   # playback w INSTALLED_APPS, include playback.urls
```

---

## Task 1: Catalog content (Chapter + TranscriptLine) + seed + nested serializers (TDD)

**Files:** `catalog/models.py` (+2), `catalog/serializers.py` (+2, modify EpisodeDetailSerializer), `catalog/management/commands/seed_catalog.py` (modify), `catalog/migrations`, `catalog/tests/test_content.py`

- [ ] **Step 1: failing test** `catalog/tests/test_content.py`:
```python
import pytest

from catalog.models import Chapter, Episode, TranscriptLine
from catalog.tests.factories import EpisodeFactory


@pytest.mark.django_db
def test_chapter_belongs_to_episode_ordered():
    ep = EpisodeFactory()
    Chapter.objects.create(episode=ep, n=2, key="ch2", title="B", sec=100)
    Chapter.objects.create(episode=ep, n=1, key="ch1", title="A", sec=0)
    chapters = list(ep.chapters.all())
    assert [c.n for c in chapters] == [1, 2]  # ordered by n


@pytest.mark.django_db
def test_transcript_spoken_and_marker_variants():
    ep = EpisodeFactory()
    spoken = TranscriptLine.objects.create(episode=ep, key="t1", order=0, sec=10, speaker="narratorka", text="...")
    marker = TranscriptLine.objects.create(episode=ep, key="m1", order=1, marker=TranscriptLine.Marker.SFX, text="SFX ...")
    assert spoken.sec == 10 and spoken.marker == ""
    assert marker.sec is None and marker.marker == "sfx"
```

- [ ] **Step 2: run, expect FAIL** (models missing).

- [ ] **Step 3: models** — append to `catalog/models.py`:
```python
class Chapter(TimeStampedModel):
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="chapters")
    n = models.PositiveSmallIntegerField()
    key = models.CharField(max_length=40)
    title = models.CharField(max_length=200, blank=True)
    time_str = models.CharField(max_length=12, blank=True)  # "04:18"
    sec = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["n"]
        constraints = [models.UniqueConstraint(fields=["episode", "n"], name="uniq_chapter_episode_n")]

    def __str__(self):
        return f"{self.episode.slug} ch{self.n}"


class TranscriptLine(TimeStampedModel):
    class Marker(models.TextChoices):
        NONE = "", "—"
        SFX = "sfx", "SFX"
        CHAPTER = "chapter", "Rozdział"

    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="transcript")
    key = models.CharField(max_length=40)
    order = models.PositiveSmallIntegerField()
    sec = models.PositiveIntegerField(null=True, blank=True)
    speaker = models.CharField(max_length=40, blank=True)
    marker = models.CharField(max_length=10, choices=Marker.choices, blank=True, default=Marker.NONE)
    text = models.TextField()

    class Meta:
        ordering = ["order"]
        constraints = [models.UniqueConstraint(fields=["episode", "order"], name="uniq_transcript_episode_order")]

    def __str__(self):
        return f"{self.episode.slug} #{self.order}"
```
> `on_delete=CASCADE`: rozdziały/transkrypt to treść odcinka — usunięcie odcinka usuwa je. (Episode jest soft-delete, więc to rzadkie; CASCADE dotyczy twardego usunięcia.)

- [ ] **Step 4: serializers** — add to `catalog/serializers.py`:
```python
class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ["n", "key", "title", "time_str", "sec"]
        read_only_fields = ["n", "key", "title", "time_str", "sec"]


class TranscriptLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscriptLine
        fields = ["key", "order", "sec", "speaker", "marker", "text"]
        read_only_fields = ["key", "order", "sec", "speaker", "marker", "text"]
```
Add to `EpisodeDetailSerializer` fields: `chapters` + `transcript` (nested), as `ChapterSerializer(many=True, read_only=True)` / `TranscriptLineSerializer(many=True, read_only=True)`. (audio_url gating is Task 6 — leave audio_url as-is here.)

- [ ] **Step 5: selector prefetch** — `episode_by_slug` (catalog/selectors.py) must `prefetch_related("creators", "chapters", "transcript")` so detail stays N+1-free.

- [ ] **Step 6: seed** — in `seed_catalog.py`, after creating ep12 (the episode with num==12), create its 9 chapters + 12 transcript lines from `src/data/tracks.js` (READ that file for exact data: chapters sec=[0,258,662,1183,1634,1908,2182,2465,2670]; transcript t1-t9 spoken + m1-m3 markers). Idempotent (`update_or_create` keyed on `(episode, n)` / `(episode, order)`).

- [ ] **Step 7: migrations + run + verify** (`makemigrations catalog` + `migrate` + pytest catalog). Read migration (2 models + constraints).

- [ ] **Step 8: lint + commit** — `feat(catalog): Chapter + TranscriptLine content models + seed ep12 (B3)`

---

## Task 2: playback app — models (Progress/Favorite/QueueItem/Rating) (TDD)

**Files:** `playback/{__init__,apps,models}.py`, `playback/migrations/__init__.py`, `playback/tests/{__init__,factories,test_models}.py`, `obskura/settings.py` (INSTALLED_APPS)

- [ ] **Step 1: failing test** `playback/tests/test_models.py`:
```python
import pytest
from django.db import IntegrityError

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from playback.models import Favorite, Progress, QueueItem, Rating


@pytest.mark.django_db
def test_progress_unique_user_episode():
    u, e = UserFactory(), EpisodeFactory()
    Progress.objects.create(user=u, episode=e, position_s=10)
    with pytest.raises(IntegrityError):
        Progress.objects.create(user=u, episode=e, position_s=20)


@pytest.mark.django_db
def test_favorite_and_queue_and_rating_create():
    u, e = UserFactory(), EpisodeFactory()
    assert Favorite.objects.create(user=u, episode=e).pk
    assert QueueItem.objects.create(user=u, episode=e, position=0).pk
    r = Rating.objects.create(user=u, episode=e, value=5)
    assert r.value == 5


@pytest.mark.django_db
def test_rating_value_bounds():
    u, e = UserFactory(), EpisodeFactory()
    r = Rating(user=u, episode=e, value=9)
    with pytest.raises(Exception):  # validators / constraint
        r.full_clean()
```

- [ ] **Step 2: run, expect FAIL.**

- [ ] **Step 3: models** `playback/models.py`:
```python
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from catalog.models import Episode
from core.models import TimeStampedModel


class Progress(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="progress")
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="progress")
    position_s = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [models.UniqueConstraint(fields=["user", "episode"], name="uniq_progress_user_episode")]
        indexes = [models.Index(fields=["user", "-updated_at"])]


class Favorite(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="favorited_by")

    class Meta:
        ordering = ["-created_at"]
        constraints = [models.UniqueConstraint(fields=["user", "episode"], name="uniq_favorite_user_episode")]


class QueueItem(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="queue_items")
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="queued_by")
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position"]
        constraints = [models.UniqueConstraint(fields=["user", "episode"], name="uniq_queue_user_episode")]


class Rating(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ratings")
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="ratings")
    value = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "episode"], name="uniq_rating_user_episode"),
            models.CheckConstraint(check=models.Q(value__gte=1) & models.Q(value__lte=5), name="rating_value_1_5"),
        ]
```
`playback/apps.py` (with `ready()` importing signals — signals added Task 5):
```python
from django.apps import AppConfig


class PlaybackConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "playback"

    def ready(self):
        from playback import signals  # noqa: F401
```
> `signals.py` must exist before `ready()` runs — create a stub `playback/signals.py` (empty, with a comment) in this task; fill it in Task 5.

`playback/tests/factories.py`: `ProgressFactory`, `FavoriteFactory`, `QueueItemFactory`, `RatingFactory` (SubFactory user=UserFactory from accounts, episode=EpisodeFactory from catalog).

- [ ] **Step 4: settings** — add `"playback"` to INSTALLED_APPS.

- [ ] **Step 5: migrations + run + verify** (read migration: 4 models, unique constraints, check constraint, index).

- [ ] **Step 6: lint + commit** — `feat(playback): Progress/Favorite/QueueItem/Rating models (B3)`

---

## Task 3: Progress endpoint (upsert + plays_count) + history (TDD)

**Files:** `playback/{selectors,services,serializers,views,urls}.py`, `obskura/urls.py`, `playback/tests/{test_progress,test_history}.py`

- [ ] **Step 1: failing tests** `playback/tests/test_progress.py`:
```python
import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.models import Episode
from catalog.tests.factories import EpisodeFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


@pytest.mark.django_db
def test_progress_requires_auth():
    ep = EpisodeFactory()
    assert APIClient().get(f"/api/v1/playback/progress/{ep.slug}").status_code == 401


@pytest.mark.django_db
def test_progress_upsert_and_increments_plays_once():
    user, ep = UserFactory(), EpisodeFactory(plays_count=0)
    c = _client(user)
    r1 = c.put(f"/api/v1/playback/progress/{ep.slug}", {"position_s": 30, "completed": False}, format="json")
    assert r1.status_code in (200, 201)
    ep.refresh_from_db()
    assert ep.plays_count == 1  # first progress -> +1
    c.put(f"/api/v1/playback/progress/{ep.slug}", {"position_s": 60}, format="json")
    ep.refresh_from_db()
    assert ep.plays_count == 1  # second update -> no extra increment
    r = c.get(f"/api/v1/playback/progress/{ep.slug}")
    assert r.json()["position_s"] == 60
```
`playback/tests/test_history.py`:
```python
@pytest.mark.django_db
def test_history_lists_user_progress_desc():
    user = UserFactory()
    c = _client(user)
    e1, e2 = EpisodeFactory(), EpisodeFactory()
    c.put(f"/api/v1/playback/progress/{e1.slug}", {"position_s": 10}, format="json")
    c.put(f"/api/v1/playback/progress/{e2.slug}", {"position_s": 20}, format="json")
    res = c.get("/api/v1/playback/history")
    assert res.status_code == 200
    assert len(res.json()["results"]) == 2
```
(reuse `_client` helper — put it in a shared conftest or duplicate per file.)

- [ ] **Step 2: run, expect FAIL** (404/no route).

- [ ] **Step 3: services** `playback/services.py`:
```python
from django.db.models import F

from catalog.models import Episode
from playback.models import Progress


def upsert_progress(*, user, episode, position_s, completed=False):
    progress, created = Progress.objects.update_or_create(
        user=user, episode=episode,
        defaults={"position_s": position_s, "completed": completed},
    )
    if created:
        Episode.objects.filter(pk=episode.pk).update(plays_count=F("plays_count") + 1)
    return progress
```

- [ ] **Step 4: serializers + selectors + views + urls.** ProgressView (`APIView` or generics) handles GET (retrieve user's progress for episode slug, 404 if none) + PUT (validate ProgressWriteSerializer {position_s, completed}, resolve episode by slug, call `upsert_progress`, return ProgressReadSerializer). HistoryView: `ListAPIView` over `Progress.objects.filter(user=request.user).select_related("episode", "episode__season", "episode__genre")`, cursor pagination (DefaultCursorPagination — note its ordering is `-created_at`; for history use a Progress-specific pagination ordered `-updated_at`, OR just PageNumber). All `IsAuthenticated` (global default). Episode lookup uses `catalog.selectors` or `get_object_or_404(Episode, slug=...)`.

> Routes (under `/api/v1/`): `playback/progress/<slug:episode_slug>` (GET/PUT), `playback/history` (GET). Add `path("api/v1/", include("playback.urls"))` to obskura/urls.py.

- [ ] **Step 5: run, expect PASS.** Verify plays_count increments exactly once.

- [ ] **Step 6: lint + commit** — `feat(playback): progress upsert (+plays_count) and history endpoints (B3)`

---

## Task 4: Favorites + Queue endpoints (TDD)

**Files:** `playback/{serializers,views,urls}.py` (extend), `playback/tests/test_favorites_queue.py`

- [ ] **Step 1: failing tests** — favorites: GET list, POST {episode_slug} creates, DELETE /<slug> removes, duplicate POST idempotent/400. queue: GET list ordered by position, POST {episode_slug, position}, DELETE /<id>. All auth-required (401 without token). Each user sees only their own.
```python
@pytest.mark.django_db
def test_favorites_crud_scoped_to_user():
    user, ep = UserFactory(), EpisodeFactory()
    c = _client(user)
    assert c.post("/api/v1/playback/favorites", {"episode_slug": ep.slug}, format="json").status_code == 201
    assert len(c.get("/api/v1/playback/favorites").json()["results"]) == 1
    assert c.delete(f"/api/v1/playback/favorites/{ep.slug}").status_code == 204
    assert len(c.get("/api/v1/playback/favorites").json()["results"]) == 0

@pytest.mark.django_db
def test_favorites_isolated_between_users():
    u1, u2, ep = UserFactory(), UserFactory(), EpisodeFactory()
    _client(u1).post("/api/v1/playback/favorites", {"episode_slug": ep.slug}, format="json")
    assert len(_client(u2).get("/api/v1/playback/favorites").json()["results"]) == 0
```
(analogous queue tests: create with position, list ordered, delete by id.)

- [ ] **Step 2: run, expect FAIL.**

- [ ] **Step 3: implement** FavoriteViewSet + QueueViewSet (or APIViews). Favorites: list = `Favorite.objects.filter(user=request.user).select_related("episode")`; create resolves episode by `episode_slug`, `get_or_create` (idempotent); destroy by episode slug. Queue: list filtered by user ordered by position; create with episode_slug + position; destroy by pk. `get_queryset` ALWAYS filters `user=self.request.user` (no IDOR). Serializers nest minimal episode info (slug, title, poster) — use a lightweight `EpisodeMiniSerializer` (reuse `EpisodeListSerializer` or a subset). select_related to avoid N+1.

- [ ] **Step 4: run, expect PASS** (incl. user-isolation tests).

- [ ] **Step 5: lint + commit** — `feat(playback): favorites and queue endpoints (user-scoped) (B3)`

---

## Task 5: Ratings endpoint + rating_avg recalculation (signal/aggregate) (TDD)

**Files:** `playback/{serializers,views,urls,signals}.py` (fill signals stub), `playback/tests/test_ratings.py`

- [ ] **Step 1: failing tests** `playback/tests/test_ratings.py`:
```python
@pytest.mark.django_db
def test_rating_upsert_updates_episode_avg():
    u1, u2, ep = UserFactory(), UserFactory(), EpisodeFactory(rating_avg=0)
    _client(u1).put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 4}, format="json")
    _client(u2).put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 2}, format="json")
    ep.refresh_from_db()
    assert float(ep.rating_avg) == 3.0  # (4+2)/2

@pytest.mark.django_db
def test_rating_rejects_out_of_range():
    user, ep = UserFactory(), EpisodeFactory()
    assert _client(user).put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 9}, format="json").status_code == 400

@pytest.mark.django_db
def test_rating_change_recomputes_avg():
    u, ep = UserFactory(), EpisodeFactory()
    c = _client(u)
    c.put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 5}, format="json")
    c.put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 1}, format="json")  # same user updates
    ep.refresh_from_db()
    assert float(ep.rating_avg) == 1.0
```

- [ ] **Step 2: run, expect FAIL.**

- [ ] **Step 3: services + signals.** `services.set_rating(user, episode, value)` → `Rating.objects.update_or_create(user, episode, defaults={"value": value})`. `playback/signals.py`:
```python
from django.db.models import Avg
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from playback.models import Rating


@receiver([post_save, post_delete], sender=Rating)
def recalc_episode_rating_avg(sender, instance, **kwargs):
    from catalog.models import Episode
    agg = Rating.objects.filter(episode=instance.episode).aggregate(avg=Avg("value"))
    Episode.all_objects.filter(pk=instance.episode_id).update(rating_avg=round(agg["avg"] or 0, 2))
```
> Use `Avg` aggregate (zero Python loops). `Episode.all_objects` so a soft-deleted episode still recalcs (defensive). `round(...,2)` matches DecimalField(2).

- [ ] **Step 4: views + urls.** RatingView: PUT `/playback/ratings/<slug>` (validate {value 1-5}, resolve episode, `set_rating`, 200 + serialized). Optional GET own rating. Auth-required.

- [ ] **Step 5: run, expect PASS** (avg recomputed on create + update; out-of-range 400). Note: the CheckConstraint + serializer validators both guard range — serializer returns 400 (clean), constraint is the DB safety net.

- [ ] **Step 6: lint + commit** — `feat(playback): ratings endpoint with rating_avg recomputation (B3)`

---

## Task 6: Premium audio gating (auth-only) in catalog detail (TDD)

**Files:** `catalog/serializers.py` (EpisodeDetailSerializer.audio_url → method field), `catalog/tests/test_premium_gating.py`

- [ ] **Step 1: failing tests** `catalog/tests/test_premium_gating.py`:
```python
import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory


@pytest.mark.django_db
def test_premium_audio_hidden_for_anonymous():
    ep = EpisodeFactory(premium=True, audio_url="/audio/ep-12.mp3", slug="prem")
    res = APIClient().get("/api/v1/catalog/episodes/prem")
    assert res.status_code == 200
    assert res.json()["audio_url"] is None  # gated


@pytest.mark.django_db
def test_premium_audio_visible_for_authenticated():
    ep = EpisodeFactory(premium=True, audio_url="/audio/ep-12.mp3", slug="prem2")
    user = UserFactory()
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    assert c.get("/api/v1/catalog/episodes/prem2").json()["audio_url"] == "/audio/ep-12.mp3"


@pytest.mark.django_db
def test_nonpremium_audio_always_visible():
    EpisodeFactory(premium=False, audio_url="/audio/ep-2.mp3", slug="free2")
    assert APIClient().get("/api/v1/catalog/episodes/free2").json()["audio_url"] == "/audio/ep-2.mp3"
```

- [ ] **Step 2: run, expect FAIL** (audio_url currently always shown).

- [ ] **Step 3: implement** — in `EpisodeDetailSerializer`, replace the plain `audio_url` field with:
```python
    audio_url = serializers.SerializerMethodField()

    def get_audio_url(self, obj):
        if obj.premium:
            request = self.context.get("request")
            if not (request and request.user and request.user.is_authenticated):
                return None
        return obj.audio_url
```
> `EpisodeViewSet` already passes `request` in serializer context (DRF default). The catalog endpoint is `AllowAny` (public) — only the `audio_url` FIELD is gated, the rest of the episode stays public. EpisodeListSerializer never exposed audio_url (unchanged).

- [ ] **Step 4: run, expect PASS.** Confirm anon→null, auth→url, non-premium→url.

- [ ] **Step 5: lint + commit** — `feat(catalog): gate premium audio_url to authenticated users (B3)`

---

## Task 7: Admin (playback) + seed verify + final verification

**Files:** `playback/admin.py`, (verify) all.

- [ ] **Step 1: admin** `playback/admin.py` — register Progress/Favorite/QueueItem/Rating with `list_display`, `list_select_related = ["user", "episode"]` (avoid N+1), `raw_id_fields`/`autocomplete_fields` for user+episode, `list_filter` where useful. Chapter/TranscriptLine: register in `catalog/admin.py` (inline on EpisodeAdmin OR standalone with `list_select_related=["episode"]`).

- [ ] **Step 2: final verify**
```bash
docker compose run --rm web python manage.py check
docker compose run --rm web python manage.py seed_catalog   # ep12 now seeds chapters/transcript
docker compose run --rm web ruff check .
docker compose run --rm web ruff format --check .
docker compose run --rm web pytest
```
Expected: check 0 issues; seed ok (ep12 has 9 chapters + 12 transcript lines); ruff clean; full pytest green (B0+B1+B2+B3).

- [ ] **Step 3: commit** — `feat(playback): admin for playback models + chapters/transcript (B3)`

---

## Definition of Done (B3)

- [ ] `playback`: Progress/Favorite/QueueItem/Rating, unique(user,episode), Rating 1-5 check constraint.
- [ ] `GET/PUT /playback/progress/<slug>` (upsert, +plays_count once), `GET /playback/history` (user, desc) — auth-required.
- [ ] `/playback/favorites` (GET/POST/DELETE), `/playback/queue` (GET/POST/DELETE) — user-scoped, isolated between users.
- [ ] `PUT /playback/ratings/<slug>` → `Episode.rating_avg` recomputed via `Avg` aggregate in signal (zero Python loops).
- [ ] Premium `audio_url` gated auth-only (anon→null, auth→url, non-premium→always); rest of episode public.
- [ ] Chapter/TranscriptLine in catalog, nested in episode detail (N+1-free via prefetch), seeded for ep12.
- [ ] Admin for all; `manage.py check` 0; ruff clean; full pytest green. Commits English, no Co-Authored-By.

**Następna faza:** B4 — Membership (plany Klubu free/solo/klan, tiery Patroni, subskrypcje, Stripe test mode, pełny tier-gating premium zastępujący auth-only z B3).
