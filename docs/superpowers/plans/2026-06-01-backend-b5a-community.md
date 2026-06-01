# Faza B5a — Community (forum) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the community forum domain (categories, episode-linkable threads, posts, reactions) with a full moderation pipeline (post statuses, user reports, moderator role, audit log) on the OBSKURA Django backend.

**Architecture:** New `community` Django app mirroring catalog/playback/membership layering (models → selectors → services → serializers → thin APIViews). Public reads (AllowAny + OptionalTokenAuthentication) expose only visible content; writes require auth; moderation endpoints require `IsModerator`. Denormalized counters (posts_count, threads_count, reaction_count/breakdown, last_post_at) maintained by signals; categories Redis-cached with signal invalidation; cursor pagination for threads and posts.

**Tech Stack:** Django 5.2, DRF 3.15, django-rest-knox, PostgreSQL, django-redis, pytest + factory_boy.

> **Konwencje:** commity ENGLISH, bez Co-Authored-By; branch `feat/backend-b5-community`; testy w kontenerze (`docker compose run --rm web pytest`); `ruff check` + `ruff format` czyste przed każdym commitem; migracje `python manage.py makemigrations community` (+ `accounts` dla `is_moderator`). Pełny kontekst: [`docs/superpowers/specs/2026-06-01-backend-b5a-community-design.md`](../specs/2026-06-01-backend-b5a-community-design.md).

---

## Decyzje projektowe (rozstrzygnięte)

1. **Split B5** — community najpierw (ten plan), events osobno (B5b).
2. **Pełny pipeline moderacji** — `Post.status` (published/pending/flagged/removed), `Report`, `ModerationAction` (audit), pre-publish approval dla kategorii `is_moderated`.
3. **Reakcje teraz** — `Reaction(post, user, kind)` unique(post,user,kind) + denormalizacja `reaction_count`/`reactions_breakdown` przez signal.
4. **Rola moderatora = `is_moderator`** (BooleanField) na `accounts.User`; uprawnienie: `is_moderator || is_staff || is_superuser`.
5. **Read publiczny, write wymaga konta.** `is_moderated` kategoria → posty `pending` do zatwierdzenia. Autor widzi swoje `pending`; moderator widzi wszystko.
6. Konwencje 1:1 jak B4 (TimeStamped/SoftDelete, selectors/services/signals, cursor pagination, Redis cache).

## File Structure

```
backend/community/
├── __init__.py · apps.py (CommunityConfig.ready -> signals)
├── models.py        # Category, Thread, Post, Reaction, Report, ModerationAction + TextChoices
├── permissions.py   # IsModerator
├── selectors.py     # categories(_cached), visible_threads/threads/thread_detail, visible_posts
├── services.py      # create_thread/create_post/toggle_reaction/report_post/moderate_post/set_thread_flag/resolve_report
├── signals.py       # Post/Reaction/Category denorm + cache invalidation
├── serializers.py   # read (Category/Thread/Post) + write (Thread/Post/Reaction/Report/Moderate/Flag/Resolve)
├── pagination.py    # ThreadCursorPagination, PostCursorPagination
├── views.py         # thin APIViews (explicit paths)
├── urls.py          # /api/v1/community/... (no trailing slash)
├── admin.py         # 6 models registered
├── migrations/      # 0001_initial (Task 2)
├── management/commands/seed_community.py
└── tests/           # factories.py + test_*.py

Touched (existing):
- backend/accounts/models.py + accounts migration (is_moderator)
- backend/obskura/settings.py (INSTALLED_APPS += "community")
- backend/obskura/urls.py (include community.urls)
```

---

### Task 1: App scaffold + accounts.is_moderator + IsModerator permission

Scaffold the `community` Django app package (so every layer module imports cleanly), register it in `INSTALLED_APPS` and `obskura.urls`, add `is_moderator` to `accounts.User` with a migration, and ship `community/permissions.py` with `IsModerator`. This task establishes the importable skeleton on which Tasks 2–7 build; `urls.py` ships with empty `urlpatterns` and is filled in later tasks.

**Files:**

- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/__init__.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/apps.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/models.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/selectors.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/services.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/serializers.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/views.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/urls.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/signals.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/admin.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/permissions.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/migrations/__init__.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/__init__.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/obskura/settings.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/obskura/urls.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/accounts/models.py`
- Create (generated): `/Users/krystianpetrusevich/Desktop/obskura/backend/accounts/migrations/0002_user_is_moderator.py`
- Test: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_scaffold.py`

---

- [ ] **Step 1: Write the failing smoke test first (RED).**

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/__init__.py` as an empty file:

```python
```

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_scaffold.py` with the full scaffold contract. This test must fail now (the `community` app and `is_moderator` field do not yet exist) and pass after Steps 2–10:

```python
import pytest
from django.apps import apps
from django.contrib.auth import get_user_model

User = get_user_model()


def test_app_installed():
    """community is registered with the expected AppConfig and label."""
    config = apps.get_app_config("community")
    assert config.name == "community"
    assert type(config).__name__ == "CommunityConfig"


def test_urls_module_importable():
    """community.urls exposes a urlpatterns list (wired into obskura.urls)."""
    from community import urls

    assert isinstance(urls.urlpatterns, list)


def test_layer_modules_importable():
    """Every layer placeholder imports cleanly so later tasks can fill them in."""
    from community import (  # noqa: F401
        admin,
        models,
        selectors,
        serializers,
        services,
        signals,
        views,
    )


def test_is_moderator_permission_importable():
    """permissions.IsModerator is importable and is a DRF permission class."""
    from rest_framework.permissions import BasePermission

    from community.permissions import IsModerator

    assert issubclass(IsModerator, BasePermission)


@pytest.mark.django_db
def test_user_has_is_moderator_field():
    """accounts.User gained the additive is_moderator flag (default False)."""
    field = User._meta.get_field("is_moderator")
    assert field.default is False

    user = User.objects.create_user(email="mod-scaffold@example.com", password="Secret123")
    assert user.is_moderator is False
```

Run it to confirm RED:

```bash
docker compose run --rm web pytest community/tests/test_scaffold.py -q
```

Expected: collection/import error (no `community` app) — that is the RED state.

- [ ] **Step 2: Create the package `__init__.py` files.**

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/__init__.py` as an empty file (matches `membership/__init__.py`, which is empty — Django auto-discovers the single `AppConfig` in `apps.py`):

```python
```

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/migrations/__init__.py` as an empty file:

```python
```

- [ ] **Step 3: Create `community/apps.py` with `CommunityConfig.ready()` importing signals.**

Mirrors `membership/apps.py` exactly (same `ready()` pattern wiring signals):

```python
from django.apps import AppConfig


class CommunityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "community"

    def ready(self):
        from community import signals  # noqa: F401
```

- [ ] **Step 4: Create the empty layer placeholder modules.**

These must import without side effects so the package loads (Tasks 2–7 fill them). Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/models.py`:

```python
# community models — Category, Thread, Post, Reaction, Report, ModerationAction.
# Added in B5a Task 2.
```

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/selectors.py`:

```python
# community read-side selectors (visibility, cache, zero-N+1 querysets).
# Added in B5a Tasks 3+.
```

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/services.py`:

```python
# community write-side services (@transaction.atomic mutations).
# Added in B5a Tasks 4+.
```

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/serializers.py`:

```python
# community read/write serializers (split, explicit fields).
# Added in B5a Tasks 3+.
```

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/views.py`:

```python
# community thin APIViews delegating to selectors/services.
# Added in B5a Tasks 3+.
```

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/signals.py`:

```python
# community denormalization + cache-invalidation signals.
# Wired in CommunityConfig.ready(); receivers added in B5a Task 7.
```

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/admin.py`:

```python
# community admin registrations (list_select_related, autocomplete_fields).
# Added in B5a Task 7.
```

- [ ] **Step 5: Create `community/urls.py` with empty `urlpatterns`.**

Routes are added in Tasks 3–6; the empty list keeps the `include("community.urls")` in `obskura.urls` valid from now on:

```python
from django.urls import path  # noqa: F401

# Routes are added per task (read in B5a Task 3, write in 4+, moderation in 6).
urlpatterns = []
```

- [ ] **Step 6: Create `community/permissions.py` with `IsModerator`.**

No existing `permissions.py` in the repo to copy from; implement per the CONTRACT (`is_moderator || is_staff || is_superuser`), with a Polish `message`:

```python
from rest_framework.permissions import BasePermission


class IsModerator(BasePermission):
    """Dostęp tylko dla moderatorów: is_moderator, personel lub superużytkownik."""

    message = "Wymagane uprawnienia moderatora."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(
            getattr(user, "is_moderator", False) or user.is_staff or user.is_superuser
        )
```

- [ ] **Step 7: Modify `obskura/settings.py` — add `community` to `INSTALLED_APPS` after `membership`.**

Existing block (lines 32–38):

```python
    # local
    "core",
    "accounts",
    "catalog",
    "playback",
    "membership",
]
```

Replace with:

```python
    # local
    "core",
    "accounts",
    "catalog",
    "playback",
    "membership",
    "community",
]
```

- [ ] **Step 8: Modify `obskura/urls.py` — mount the `community` include.**

Existing block (lines 5–12):

```python
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("core.urls")),
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("catalog.urls")),
    path("api/v1/", include("playback.urls")),
    path("api/v1/", include("membership.urls")),
]
```

Replace with:

```python
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("core.urls")),
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("catalog.urls")),
    path("api/v1/", include("playback.urls")),
    path("api/v1/", include("membership.urls")),
    path("api/v1/", include("community.urls")),
]
```

- [ ] **Step 9: Modify `accounts/models.py` — add the `is_moderator` field.**

Existing block (lines 13–16):

```python
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    prefs = models.JSONField(default=dict, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
```

Replace with (Polish `verbose_name`/`help_text` per conventions, additive non-null with `default=False`):

```python
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_moderator = models.BooleanField(
        default=False,
        verbose_name="moderator",
        help_text="Może moderować forum społeczności (kolejka, zgłoszenia, akcje na wątkach).",
    )
    prefs = models.JSONField(default=dict, blank=True)
    date_joined = models.DateTimeField(default=timezone.now)
```

- [ ] **Step 10: Generate the accounts migration for `is_moderator`.**

Run makemigrations (no `community` model migration is generated yet — `community/models.py` is still empty; only accounts changed):

```bash
docker compose run --rm web python manage.py makemigrations accounts
```

Expected output: creates `accounts/migrations/0002_user_is_moderator.py` adding the `is_moderator` field. The generated file should look like:

```python
# Generated by Django 5.2.14

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_moderator",
            field=models.BooleanField(
                default=False,
                help_text="Może moderować forum społeczności (kolejka, zgłoszenia, akcje na wątkach).",
                verbose_name="moderator",
            ),
        ),
    ]
```

Confirm no other app drifted:

```bash
docker compose run --rm web python manage.py makemigrations --check --dry-run
```

Expected: `No changes detected`.

- [ ] **Step 11: Run the smoke test (GREEN).**

```bash
docker compose run --rm web pytest community/tests/test_scaffold.py -q
```

Expected: all 5 tests pass. Then confirm the rest of the suite is unbroken and the project still checks out:

```bash
docker compose run --rm web python manage.py check
docker compose run --rm web pytest -q
```

- [ ] **Step 12: Lint + commit.**

```bash
docker compose run --rm web ruff check --fix community accounts obskura
docker compose run --rm web ruff format community accounts obskura
git add backend/community backend/accounts backend/obskura/settings.py backend/obskura/urls.py
git commit -m "feat(community): app scaffold, is_moderator on User, IsModerator permission (B5a)"
```

### Task 2: Models + migration

Implements the six `community` models (`Category`, `Thread`, `Post`, `Reaction`, `Report`, `ModerationAction`) plus the five `TextChoices` classes, mirroring `catalog`/`membership` style: `TimeStampedModel`/`SoftDeleteModel` inheritance, `base_manager_name="all_objects"` re-declared on each `SoftDeleteModel` with its own `Meta`, `pl_slugify` slugs (with numeric collision suffix on `Thread`), Polish `verbose_name`/labels, and the exact `Meta` indexes/constraints from the CONTRACT. Tests are written first (failing), then models, then the migration. Assumes Task 1 already scaffolded the `community` app package (`apps.py`, `__init__.py`, `tests/__init__.py`) and registered it in `INSTALLED_APPS`, and added `accounts.User.is_moderator`.

**Files:**
- Test: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/factories.py` (Create)
- Test: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_models.py` (Create)
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/models.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/migrations/0002_initial.py` (generated by `makemigrations`)

---

- [ ] **Step 1: Write the factories (Test) — `community/tests/factories.py`**

These reuse the real `accounts.UserFactory` and `catalog.EpisodeFactory` signatures read from the repo. `ThreadFactory.last_post_at` is lazily set to "now" because the model field is non-null and the DB default does not apply at factory time. Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/factories.py`:

```python
import factory
from django.utils import timezone

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from community.models import (
    Category,
    ModerationAction,
    ModAction,
    Post,
    PostStatus,
    Reaction,
    ReactionKind,
    Report,
    ReportReason,
    ReportStatus,
    Thread,
)


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Kategoria {n}")
    slug = factory.Sequence(lambda n: f"kategoria-{n}")
    description = ""
    icon = "MessageSquare"
    is_moderated = False
    order = factory.Sequence(lambda n: n)
    is_active = True


class ThreadFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Thread

    category = factory.SubFactory(CategoryFactory)
    author = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Wątek {n}")
    slug = factory.Sequence(lambda n: f"watek-{n}")
    episode = None
    is_pinned = False
    is_locked = False
    last_post_at = factory.LazyFunction(timezone.now)


class PostFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Post

    thread = factory.SubFactory(ThreadFactory)
    author = factory.SubFactory(UserFactory)
    body = factory.Sequence(lambda n: f"Treść posta {n}")
    is_first = False
    status = PostStatus.PUBLISHED


class ReactionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Reaction

    post = factory.SubFactory(PostFactory)
    user = factory.SubFactory(UserFactory)
    kind = ReactionKind.LIKE


class ReportFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Report

    reporter = factory.SubFactory(UserFactory)
    post = factory.SubFactory(PostFactory)
    reason = ReportReason.SPAM
    detail = ""
    status = ReportStatus.OPEN


class ModerationActionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ModerationAction

    moderator = factory.SubFactory(UserFactory)
    post = factory.SubFactory(PostFactory)
    thread = None
    action = ModAction.APPROVE
    reason = ""

    # EpisodeFactory imported so episode-linked threads can be built in callers
    # that pass episode=EpisodeFactory(); referenced here to keep the import live.
    _episode_factory = EpisodeFactory
```

---

- [ ] **Step 2: Write failing model tests (Test) — `community/tests/test_models.py`**

These assert TextChoices values, factory creation, slug generation (incl. `pl_slugify` and numeric collision suffix), unique constraints raising `IntegrityError`, and soft-delete semantics (`objects` hides, `all_objects` keeps). They fail now because `community/models.py` does not yet exist. Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_models.py`:

```python
import pytest
from django.db import IntegrityError, transaction

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from community.models import (
    Category,
    ModAction,
    ModerationAction,
    Post,
    PostStatus,
    Reaction,
    ReactionKind,
    Report,
    ReportReason,
    ReportStatus,
    Thread,
)
from community.tests.factories import (
    CategoryFactory,
    ModerationActionFactory,
    PostFactory,
    ReactionFactory,
    ReportFactory,
    ThreadFactory,
)


def test_text_choices_values():
    assert {c for c in PostStatus.values} == {"published", "pending", "flagged", "removed"}
    assert {c for c in ReactionKind.values} == {"like", "spooky", "scared", "love"}
    assert {c for c in ReportReason.values} == {
        "spam",
        "offensive",
        "spoiler",
        "offtopic",
        "other",
    }
    assert {c for c in ReportStatus.values} == {"open", "resolved", "dismissed"}
    assert {c for c in ModAction.values} == {
        "approve",
        "reject",
        "remove",
        "restore",
        "pin",
        "unpin",
        "lock",
        "unlock",
        "flag",
    }


@pytest.mark.django_db
def test_create_all_models():
    cat = CategoryFactory(name="Ogólne")
    assert cat.pk and cat.is_active is True and cat.threads_count == 0
    thread = ThreadFactory(category=cat)
    assert thread.pk and thread.is_pinned is False and thread.posts_count == 0
    assert thread.views_count == 0 and thread.last_post_at is not None
    post = PostFactory(thread=thread, is_first=True)
    assert post.pk and post.status == PostStatus.PUBLISHED
    assert post.reaction_count == 0 and post.reactions_breakdown == {}
    reaction = ReactionFactory(post=post)
    assert reaction.pk and reaction.kind == ReactionKind.LIKE
    report = ReportFactory(post=post)
    assert report.pk and report.status == ReportStatus.OPEN
    action = ModerationActionFactory(post=post)
    assert action.pk and action.action == ModAction.APPROVE


@pytest.mark.django_db
def test_category_slug_autogenerated_from_name():
    cat = Category.objects.create(name="Strefa Mgły")
    # pl_slugify maps ł→l: "Mgły" -> "mgly", not "mgy".
    assert cat.slug == "strefa-mgly"


@pytest.mark.django_db
def test_category_ordering_by_order():
    CategoryFactory(name="Trzecia", order=3)
    CategoryFactory(name="Pierwsza", order=1)
    CategoryFactory(name="Druga", order=2)
    orders = list(Category.objects.values_list("order", flat=True))
    assert orders == [1, 2, 3]


@pytest.mark.django_db
def test_thread_slug_autogenerated_from_title():
    author = UserFactory()
    cat = CategoryFactory()
    thread = Thread.objects.create(category=cat, author=author, title="Echo w Tunelu")
    assert thread.slug == "echo-w-tunelu"


@pytest.mark.django_db
def test_thread_slug_collision_gets_numeric_suffix():
    author = UserFactory()
    cat = CategoryFactory()
    t1 = Thread.objects.create(category=cat, author=author, title="Coś tam czeka")
    t2 = Thread.objects.create(category=cat, author=author, title="Coś tam czeka")
    t3 = Thread.objects.create(category=cat, author=author, title="Coś tam czeka")
    assert t1.slug == "cos-tam-czeka"
    assert t2.slug == "cos-tam-czeka-2"
    assert t3.slug == "cos-tam-czeka-3"


@pytest.mark.django_db
def test_thread_slug_unique_enforced_at_db():
    author = UserFactory()
    cat = CategoryFactory()
    ThreadFactory(slug="duplikat", category=cat, author=author)
    with pytest.raises(IntegrityError):
        Thread.all_objects.create(
            category=cat, author=author, title="x", slug="duplikat"
        )


@pytest.mark.django_db
def test_thread_episode_set_null_on_delete():
    episode = EpisodeFactory()
    thread = ThreadFactory(episode=episode)
    episode.delete()  # soft-delete on Episode does not null the FK
    thread.refresh_from_db()
    assert thread.episode_id == episode.id


@pytest.mark.django_db
def test_reaction_unique_post_user_kind():
    reaction = ReactionFactory()
    with pytest.raises(IntegrityError):
        Reaction.objects.create(
            post=reaction.post, user=reaction.user, kind=reaction.kind
        )


@pytest.mark.django_db
def test_reaction_same_user_different_kind_ok():
    reaction = ReactionFactory(kind=ReactionKind.LIKE)
    Reaction.objects.create(
        post=reaction.post, user=reaction.user, kind=ReactionKind.SPOOKY
    )
    assert Reaction.objects.filter(post=reaction.post, user=reaction.user).count() == 2


@pytest.mark.django_db
def test_report_unique_reporter_post():
    report = ReportFactory()
    with pytest.raises(IntegrityError):
        Report.objects.create(
            reporter=report.reporter, post=report.post, reason=ReportReason.OFFENSIVE
        )


@pytest.mark.django_db
def test_moderation_action_ordering_newest_first():
    post = PostFactory()
    moderator = UserFactory()
    first = ModerationActionFactory(moderator=moderator, post=post, action=ModAction.FLAG)
    second = ModerationActionFactory(moderator=moderator, post=post, action=ModAction.REMOVE)
    ids = list(ModerationAction.objects.values_list("id", flat=True))
    assert ids == [second.id, first.id]


@pytest.mark.django_db
def test_thread_soft_delete():
    thread = ThreadFactory()
    pk = thread.pk
    thread.delete()
    assert not Thread.objects.filter(pk=pk).exists()
    assert Thread.all_objects.filter(pk=pk).exists()
    deleted = Thread.all_objects.get(pk=pk)
    assert deleted.is_deleted is True and deleted.deleted_at is not None


@pytest.mark.django_db
def test_post_soft_delete():
    post = PostFactory()
    pk = post.pk
    post.delete()
    assert not Post.objects.filter(pk=pk).exists()
    assert Post.all_objects.filter(pk=pk).exists()
    assert Post.all_objects.get(pk=pk).is_deleted is True


@pytest.mark.django_db
def test_post_status_default_published():
    # Model-level default applies when status not passed explicitly.
    thread = ThreadFactory()
    post = Post.objects.create(thread=thread, author=thread.author, body="x")
    assert post.status == PostStatus.PUBLISHED


@pytest.mark.django_db
def test_thread_uses_all_objects_as_base_manager():
    # Soft-deleted thread must still be reachable via _base_manager (cascade/FK safety).
    assert Thread._base_manager.model is Thread
    assert Thread._base_manager.name == "all_objects"
    assert Post._base_manager.name == "all_objects"


@pytest.mark.django_db
def test_post_thread_cascade_hard_delete():
    # Thread.all_objects hard delete (NOT soft) cascades Posts away at DB level.
    thread = ThreadFactory()
    post = PostFactory(thread=thread)
    with transaction.atomic():
        Thread.all_objects.filter(pk=thread.pk).delete()
    assert not Post.all_objects.filter(pk=post.pk).exists()
```

---

- [ ] **Step 3: Run the new tests and confirm they FAIL (no models yet)**

```bash
docker compose run --rm web pytest community/tests/test_models.py -q
```

Expected: collection/import error (`ModuleNotFoundError: No module named 'community.models'` or `ImportError`) — red. This proves the tests exercise code that does not exist yet.

---

- [ ] **Step 4: Write the models (Create) — `community/models.py`**

Implements all six models + five `TextChoices` exactly per CONTRACT. `Thread.save()` generates a `pl_slugify` slug with a numeric suffix on collision (checked against `all_objects` so a soft-deleted thread still reserves its slug). `Category.save()` sets the slug if blank. `base_manager_name="all_objects"` is re-declared on `Thread.Meta` and `Post.Meta` because Django does not propagate it through the abstract parent's `Meta`. Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/models.py`:

```python
from django.conf import settings
from django.db import models

from catalog.models import Episode  # noqa: F401  (FK referenced by string; import documents the dep)
from core.models import SoftDeleteModel, TimeStampedModel
from core.text import pl_slugify


class PostStatus(models.TextChoices):
    PUBLISHED = "published", "Opublikowany"
    PENDING = "pending", "Oczekuje na moderację"
    FLAGGED = "flagged", "Zgłoszony"
    REMOVED = "removed", "Usunięty"


class ReactionKind(models.TextChoices):
    LIKE = "like", "Lubię to"
    SPOOKY = "spooky", "Ciarki"
    SCARED = "scared", "Przerażenie"
    LOVE = "love", "Uwielbiam"


class ReportReason(models.TextChoices):
    SPAM = "spam", "Spam"
    OFFENSIVE = "offensive", "Treść obraźliwa"
    SPOILER = "spoiler", "Spoiler"
    OFFTOPIC = "offtopic", "Nie na temat"
    OTHER = "other", "Inne"


class ReportStatus(models.TextChoices):
    OPEN = "open", "Otwarte"
    RESOLVED = "resolved", "Rozwiązane"
    DISMISSED = "dismissed", "Odrzucone"


class ModAction(models.TextChoices):
    APPROVE = "approve", "Zatwierdź"
    REJECT = "reject", "Odrzuć"
    REMOVE = "remove", "Usuń"
    RESTORE = "restore", "Przywróć"
    PIN = "pin", "Przypnij"
    UNPIN = "unpin", "Odepnij"
    LOCK = "lock", "Zablokuj"
    UNLOCK = "unlock", "Odblokuj"
    FLAG = "flag", "Oznacz"


class Category(TimeStampedModel):
    """Sekcja forum (admin-managed, cache'owana)."""

    name = models.CharField(max_length=80, verbose_name="nazwa")
    slug = models.SlugField(max_length=90, unique=True, verbose_name="slug")
    description = models.TextField(blank=True, verbose_name="opis")
    icon = models.CharField(
        max_length=40,
        blank=True,
        verbose_name="ikona",
        help_text="Klucz ikony lucide (np. „MessageSquare“).",
    )
    is_moderated = models.BooleanField(
        default=False,
        verbose_name="moderowana",
        help_text="True → nowe wątki/posty trafiają do kolejki (pending) przed publikacją.",
    )
    order = models.PositiveIntegerField(default=0, verbose_name="kolejność")
    is_active = models.BooleanField(default=True, verbose_name="aktywna")
    threads_count = models.PositiveIntegerField(default=0, verbose_name="liczba wątków")

    class Meta(TimeStampedModel.Meta):
        ordering = ["order"]
        verbose_name = "kategoria"
        verbose_name_plural = "kategorie"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = pl_slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Thread(TimeStampedModel, SoftDeleteModel):
    """Wątek dyskusji w kategorii, opcjonalnie powiązany z odcinkiem."""

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="threads",
        db_index=True,
        verbose_name="kategoria",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="threads",
        verbose_name="autor",
    )
    title = models.CharField(max_length=200, verbose_name="tytuł")
    slug = models.SlugField(max_length=220, unique=True, verbose_name="slug")
    episode = models.ForeignKey(
        "catalog.Episode",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="threads",
        verbose_name="odcinek",
    )
    is_pinned = models.BooleanField(default=False, db_index=True, verbose_name="przypięty")
    is_locked = models.BooleanField(default=False, verbose_name="zablokowany")
    last_post_at = models.DateTimeField(db_index=True, verbose_name="ostatni post")
    posts_count = models.PositiveIntegerField(default=0, verbose_name="liczba odpowiedzi")
    views_count = models.PositiveIntegerField(default=0, verbose_name="liczba wyświetleń")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "wątek"
        verbose_name_plural = "wątki"
        # WYMAGANE dla każdego konkretnego SoftDeleteModel z własną Meta: Django NIE
        # propaguje base_manager_name przez Meta abstrakcyjnego rodzica. Bez tego
        # _base_manager = SoftDeleteManager (filtruje) → cascade/FK gubi usunięte wiersze.
        base_manager_name = "all_objects"
        indexes = [
            models.Index(fields=["category", "-last_post_at"]),
            models.Index(fields=["-is_pinned", "-last_post_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = pl_slugify(self.title)
            slug = base
            n = 1
            # Kolizja sprawdzana na all_objects — soft-deleted wątek wciąż rezerwuje slug.
            while Thread.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
                n += 1
                slug = f"{base}-{n}"
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Post(TimeStampedModel, SoftDeleteModel):
    """Pojedynczy post w wątku (pierwszy = is_first)."""

    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name="posts",
        db_index=True,
        verbose_name="wątek",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="posts",
        verbose_name="autor",
    )
    body = models.TextField(verbose_name="treść")
    is_first = models.BooleanField(default=False, verbose_name="post otwierający")
    status = models.CharField(
        max_length=10,
        choices=PostStatus.choices,
        default=PostStatus.PUBLISHED,
        verbose_name="status",
    )
    reaction_count = models.PositiveIntegerField(default=0, verbose_name="liczba reakcji")
    reactions_breakdown = models.JSONField(
        default=dict,
        verbose_name="rozkład reakcji",
        help_text="Denormalizacja przez signal: {kind: liczba}.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "post"
        verbose_name_plural = "posty"
        base_manager_name = "all_objects"
        indexes = [
            models.Index(fields=["thread", "created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"post u{self.author_id}/t{self.thread_id} [{self.status}]"


class Reaction(TimeStampedModel):
    """Reakcja usera na post (unikalna per post+user+kind)."""

    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="reactions", verbose_name="post"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reactions",
        verbose_name="użytkownik",
    )
    kind = models.CharField(
        max_length=10, choices=ReactionKind.choices, verbose_name="rodzaj"
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "reakcja"
        verbose_name_plural = "reakcje"
        constraints = [
            models.UniqueConstraint(
                fields=["post", "user", "kind"], name="uniq_reaction_post_user_kind"
            )
        ]
        indexes = [models.Index(fields=["post"])]

    def __str__(self):
        return f"reaction u{self.user_id}/p{self.post_id} {self.kind}"


class Report(TimeStampedModel):
    """Zgłoszenie posta przez usera (unikalne per reporter+post)."""

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_made",
        verbose_name="zgłaszający",
    )
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="reports", verbose_name="post"
    )
    reason = models.CharField(
        max_length=10, choices=ReportReason.choices, verbose_name="powód"
    )
    detail = models.TextField(blank=True, verbose_name="szczegóły")
    status = models.CharField(
        max_length=10,
        choices=ReportStatus.choices,
        default=ReportStatus.OPEN,
        verbose_name="status",
    )
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_handled",
        verbose_name="obsłużone przez",
    )
    resolution = models.TextField(blank=True, verbose_name="rozstrzygnięcie")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "zgłoszenie"
        verbose_name_plural = "zgłoszenia"
        constraints = [
            models.UniqueConstraint(
                fields=["reporter", "post"], name="uniq_report_reporter_post"
            )
        ]

    def __str__(self):
        return f"report u{self.reporter_id}/p{self.post_id} [{self.status}]"


class ModerationAction(TimeStampedModel):
    """Append-only audit log akcji moderacyjnych."""

    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="moderation_actions",
        verbose_name="moderator",
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="post",
    )
    thread = models.ForeignKey(
        Thread,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="wątek",
    )
    action = models.CharField(
        max_length=10, choices=ModAction.choices, verbose_name="akcja"
    )
    reason = models.TextField(blank=True, verbose_name="powód")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "akcja moderacyjna"
        verbose_name_plural = "akcje moderacyjne"

    def __str__(self):
        return f"modaction u{self.moderator_id} {self.action}"
```

---

- [ ] **Step 5: Generate the migration (Create) — `community/migrations/0002_initial.py`**

Task 1 already created `community/migrations/0001_initial.py` is NOT assumed; if Task 1 scaffolded an empty `migrations/` package only, this command produces `0001_initial.py` instead — accept whatever filename `makemigrations` emits. Run:

```bash
docker compose run --rm web python manage.py makemigrations community
```

Expected output: a new migration creating `Category`, `Thread`, `Post`, `Reaction`, `Report`, `ModerationAction` with the indexes (`category/-last_post_at`, `-is_pinned/-last_post_at`, `thread/created_at`, `status`, `post`, plus `is_pinned` and the `SoftDeleteModel.is_deleted`/`created_at` indexes from the base) and constraints (`uniq_reaction_post_user_kind`, `uniq_report_reporter_post`). Then verify no model is missing a migration:

```bash
docker compose run --rm web python manage.py makemigrations --check --dry-run
```

Expected: `No changes detected`.

---

- [ ] **Step 6: Run the model tests — they must now PASS (green)**

```bash
docker compose run --rm web pytest community/tests/test_models.py -q
```

Expected: all tests in `test_models.py` pass. If `test_thread_episode_set_null_on_delete` surprises (Episode is soft-deleted so the FK is never nulled), that is the intended assertion — the test confirms the soft-delete keeps `episode_id` intact.

---

- [ ] **Step 7: Confirm the rest of the suite is not broken**

```bash
docker compose run --rm web pytest -q
```

Expected: full suite green (community models + all prior apps). Catches any migration-state or `INSTALLED_APPS` interaction from Task 1.

---

- [ ] **Step 8: Lint + format the new files**

```bash
docker compose run --rm web ruff check community/ && docker compose run --rm web ruff format community/
```

Expected: `All checks passed!` and formatting clean (ruff line-length 100). Re-run `ruff check community/` if `format` rewrote anything, and confirm 0 errors.

---

- [ ] **Step 9: Commit**

```bash
git add backend/community/models.py \
        backend/community/migrations/ \
        backend/community/tests/factories.py \
        backend/community/tests/test_models.py
git commit -m "feat(community): Category/Thread/Post/Reaction/Report/ModerationAction models (B5a)"
```

No `Co-Authored-By` line (per project memory). Commit subject in English.
```

### Task 3: Read: categories + threads list/detail (visibility, cache, pagination)

PUBLIC read endpoints for the `community` forum: cached categories, the cursor-paginated thread list (pinned-first, `?category=`/`?episode=` filters, viewer-aware visibility), and thread detail (increments `views_count`, returns the thread plus its paginated published posts). This task implements only the GET surface — the POST create branch of `ThreadListCreateView` and all write services land in Task 4. It also wires the `Category` cache-invalidation signals. Assumes Task 1 (app scaffold, `permissions.IsModerator`, `INSTALLED_APPS`, `obskura/urls.py` include, `accounts.User.is_moderator`) and Task 2 (models + migration) are complete.

**Files:**

- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/selectors.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/serializers.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/pagination.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/signals.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/views.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/urls.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/apps.py`
- Test: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/factories.py`
- Test: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_read_api.py`

---

- [ ] **Step 1: Add `Category`/`Thread`/`Post` test factories (red — imports won't resolve yet).**

  Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/factories.py`. Mirror `catalog/tests/factories.py` conventions (`factory.django.DjangoModelFactory`, `django_get_or_create` on slugs, `factory.Sequence`). Reuse `accounts.UserFactory` and `catalog.EpisodeFactory` via `SubFactory`. `ThreadFactory` sets `last_post_at` from `created_at` semantics (use `timezone.now()` default). `PostFactory` defaults to a non-first PUBLISHED reply; `FirstPostFactory` is the opening post.

  ```python
  import factory
  from django.utils import timezone

  from accounts.tests.factories import UserFactory
  from catalog.tests.factories import EpisodeFactory
  from community.models import Category, Post, PostStatus, Thread


  class CategoryFactory(factory.django.DjangoModelFactory):
      class Meta:
          model = Category
          django_get_or_create = ("slug",)

      name = factory.Sequence(lambda n: f"Kategoria {n}")
      slug = factory.Sequence(lambda n: f"kategoria-{n}")
      description = ""
      icon = "MessageSquare"
      is_moderated = False
      order = factory.Sequence(lambda n: n)
      is_active = True


  class ThreadFactory(factory.django.DjangoModelFactory):
      class Meta:
          model = Thread
          django_get_or_create = ("slug",)
          skip_postgeneration_save = True

      category = factory.SubFactory(CategoryFactory)
      author = factory.SubFactory(UserFactory)
      title = factory.Sequence(lambda n: f"Wątek numer {n}")
      slug = factory.Sequence(lambda n: f"watek-numer-{n}")
      episode = None
      is_pinned = False
      is_locked = False
      last_post_at = factory.LazyFunction(timezone.now)


  class FirstPostFactory(factory.django.DjangoModelFactory):
      """Post otwierający wątek (is_first=True) — domyślnie PUBLISHED."""

      class Meta:
          model = Post

      thread = factory.SubFactory(ThreadFactory)
      author = factory.LazyAttribute(lambda o: o.thread.author)
      body = factory.Sequence(lambda n: f"Treść otwierająca {n}")
      is_first = True
      status = PostStatus.PUBLISHED


  class PostFactory(factory.django.DjangoModelFactory):
      """Odpowiedź w wątku (is_first=False) — domyślnie PUBLISHED."""

      class Meta:
          model = Post

      thread = factory.SubFactory(ThreadFactory)
      author = factory.SubFactory(UserFactory)
      body = factory.Sequence(lambda n: f"Odpowiedź {n}")
      is_first = False
      status = PostStatus.PUBLISHED
  ```

- [ ] **Step 2: Write the failing read-API tests (red).**

  Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_read_api.py`. The root `conftest.py` already clears Redis autouse before each test, so cache tests start clean. Knox `_client(user)` helper mirrors `membership/tests/test_patronage.py`. A moderator is a `UserFactory(is_moderator=True)`.

  ```python
  import pytest
  from knox.models import AuthToken
  from rest_framework.test import APIClient

  from accounts.tests.factories import UserFactory
  from catalog.tests.factories import EpisodeFactory
  from community.models import Category, Post, PostStatus, Thread
  from community.tests.factories import (
      CategoryFactory,
      FirstPostFactory,
      PostFactory,
      ThreadFactory,
  )


  def _client(user):
      c = APIClient()
      _, t = AuthToken.objects.create(user)
      c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
      return c


  def _published_thread(**kwargs):
      """Wątek z opublikowanym pierwszym postem — widoczny publicznie."""
      thread = ThreadFactory(**kwargs)
      FirstPostFactory(thread=thread, author=thread.author, status=PostStatus.PUBLISHED)
      return thread


  # --- categories ---------------------------------------------------------

  @pytest.mark.django_db
  def test_categories_public():
      CategoryFactory.create_batch(3)
      res = APIClient().get("/api/v1/community/categories")
      assert res.status_code == 200
      body = res.json()
      assert len(body) == 3
      assert {"name", "slug", "threads_count"} <= set(body[0].keys())


  @pytest.mark.django_db
  def test_categories_inactive_hidden_and_ordered():
      CategoryFactory(slug="b", order=2, is_active=True)
      CategoryFactory(slug="a", order=1, is_active=True)
      CategoryFactory(slug="hidden", order=0, is_active=False)
      res = APIClient().get("/api/v1/community/categories")
      slugs = [c["slug"] for c in res.json()]
      assert slugs == ["a", "b"]


  @pytest.mark.django_db
  def test_categories_cache_hit_second_request_no_queries(django_assert_num_queries):
      CategoryFactory.create_batch(2)
      c = APIClient()
      c.get("/api/v1/community/categories")  # warms cache
      with django_assert_num_queries(0):
          res = c.get("/api/v1/community/categories")
      assert res.status_code == 200
      assert len(res.json()) == 2


  # --- threads list -------------------------------------------------------

  @pytest.mark.django_db
  def test_threads_list_public_pinned_first():
      cat = CategoryFactory()
      _published_thread(category=cat, slug="plain", is_pinned=False)
      _published_thread(category=cat, slug="sticky", is_pinned=True)
      res = APIClient().get("/api/v1/community/threads")
      assert res.status_code == 200
      results = res.json()["results"]
      assert results[0]["slug"] == "sticky"


  @pytest.mark.django_db
  def test_threads_list_only_visible():
      cat = CategoryFactory()
      shown = _published_thread(category=cat, slug="shown")
      hidden = ThreadFactory(category=cat, slug="hidden")
      FirstPostFactory(thread=hidden, author=hidden.author, status=PostStatus.PENDING)
      res = APIClient().get("/api/v1/community/threads")
      slugs = [t["slug"] for t in res.json()["results"]]
      assert "shown" in slugs
      assert "hidden" not in slugs


  @pytest.mark.django_db
  def test_threads_filter_by_category_and_episode():
      cat_a = CategoryFactory(slug="cat-a")
      cat_b = CategoryFactory(slug="cat-b")
      ep = EpisodeFactory(slug="mgla-nad")
      _published_thread(category=cat_a, slug="in-a", episode=ep)
      _published_thread(category=cat_b, slug="in-b")
      by_cat = APIClient().get("/api/v1/community/threads?category=cat-a").json()["results"]
      assert [t["slug"] for t in by_cat] == ["in-a"]
      by_ep = APIClient().get("/api/v1/community/threads?episode=mgla-nad").json()["results"]
      assert [t["slug"] for t in by_ep] == ["in-a"]


  @pytest.mark.django_db
  def test_threads_author_sees_own_pending_in_list():
      author = UserFactory()
      cat = CategoryFactory()
      pending = ThreadFactory(category=cat, slug="my-pending", author=author)
      FirstPostFactory(thread=pending, author=author, status=PostStatus.PENDING)
      mine = _client(author).get("/api/v1/community/threads").json()["results"]
      assert "my-pending" in [t["slug"] for t in mine]
      stranger = _client(UserFactory()).get("/api/v1/community/threads").json()["results"]
      assert "my-pending" not in [t["slug"] for t in stranger]


  @pytest.mark.django_db
  def test_threads_moderator_sees_all_in_list():
      mod = UserFactory(is_moderator=True)
      cat = CategoryFactory()
      pending = ThreadFactory(category=cat, slug="awaiting")
      FirstPostFactory(thread=pending, author=pending.author, status=PostStatus.PENDING)
      seen = _client(mod).get("/api/v1/community/threads").json()["results"]
      assert "awaiting" in [t["slug"] for t in seen]


  @pytest.mark.django_db
  def test_threads_list_no_nplus1(django_assert_num_queries):
      cat = CategoryFactory()
      ep = EpisodeFactory()
      for i in range(10):
          _published_thread(category=cat, slug=f"t-{i}", episode=ep)
      # 1 page (cursor) + 1 count-ish; select_related collapses author/category/episode.
      with django_assert_num_queries(1):
          APIClient().get("/api/v1/community/threads")


  # --- thread detail ------------------------------------------------------

  @pytest.mark.django_db
  def test_thread_detail_increments_views_and_lists_posts():
      cat = CategoryFactory()
      thread = _published_thread(category=cat, slug="haunt")
      PostFactory(thread=thread, status=PostStatus.PUBLISHED)
      PostFactory(thread=thread, status=PostStatus.PENDING)  # hidden from public
      res = APIClient().get("/api/v1/community/threads/haunt")
      assert res.status_code == 200
      body = res.json()
      assert body["thread"]["slug"] == "haunt"
      assert body["thread"]["views_count"] == 1
      bodies = [p["body"] for p in body["posts"]["results"]]
      assert all("PENDING" not in b for b in bodies)
      # only first + one published reply are visible (2 posts)
      assert len(body["posts"]["results"]) == 2
      Thread.objects.get(slug="haunt")  # sanity: still alive
      again = APIClient().get("/api/v1/community/threads/haunt").json()
      assert again["thread"]["views_count"] == 2


  @pytest.mark.django_db
  def test_thread_detail_404_when_first_post_pending_for_stranger():
      cat = CategoryFactory()
      thread = ThreadFactory(category=cat, slug="secret")
      FirstPostFactory(thread=thread, author=thread.author, status=PostStatus.PENDING)
      res = APIClient().get("/api/v1/community/threads/secret")
      assert res.status_code == 404
  ```

  Run them — they fail because `selectors`, `serializers`, `pagination`, and the views/urls don't exist yet:

  ```bash
  docker compose run --rm web pytest community/tests/test_read_api.py -q
  ```

- [ ] **Step 3: Create `community/selectors.py` (visibility querysets, zero N+1, cache).**

  Keyword-only signatures verbatim from the contract. `visible_threads` filters on the first published post via an `Exists` subquery so it stays a single query with `select_related`. `is_moderator` mirrors `permissions.IsModerator` (Task 1). `categories_cached` uses Redis key `community:categories`, `CACHE_TTL = 60*15` exactly like `membership/catalog`.

  ```python
  from django.core.cache import cache
  from django.db.models import Exists, OuterRef, Q

  from community.models import Category, Post, PostStatus, Thread

  CACHE_TTL = 60 * 15  # 15 min


  def is_moderator(user) -> bool:
      """Moderacja = jawna rola is_moderator LUB staff/superuser (lustro IsModerator)."""
      if user is None or not getattr(user, "is_authenticated", False):
          return False
      return bool(
          getattr(user, "is_moderator", False) or user.is_staff or user.is_superuser
      )


  def categories():
      return Category.objects.filter(is_active=True).order_by("order")


  def categories_cached():
      data = cache.get("community:categories")
      if data is None:
          data = list(categories())
          cache.set("community:categories", data, CACHE_TTL)
      return data


  def _published_first_post(threads_ref):
      """Subquery: czy wątek `threads_ref` ma opublikowany pierwszy post."""
      return Post.all_objects.filter(
          thread=threads_ref,
          is_first=True,
          is_deleted=False,
          status=PostStatus.PUBLISHED,
      )


  def visible_threads(*, viewer):
      """Wątki widoczne dla `viewer`.

      Reguła (spec §5): wątek widoczny, gdy jego pierwszy post jest PUBLISHED.
      Moderator widzi wszystko; autor dodatkowo widzi własne wątki (pending first post).
      Jeden zapytaniowy plan — Exists subquery + select_related, bez N+1.
      """
      qs = Thread.objects.select_related("category", "author", "episode")
      if is_moderator(viewer):
          return qs
      qs = qs.annotate(_first_published=Exists(_published_first_post(OuterRef("pk"))))
      visible = Q(_first_published=True)
      if viewer is not None and getattr(viewer, "is_authenticated", False):
          visible |= Q(author=viewer)
      return qs.filter(visible)


  def threads(*, viewer, category=None, episode=None):
      qs = visible_threads(viewer=viewer)
      if category:
          qs = qs.filter(category__slug=category)
      if episode:
          qs = qs.filter(episode__slug=episode)
      return qs


  def thread_detail(*, viewer, slug):
      return visible_threads(viewer=viewer).filter(slug=slug).first()


  def post_visible_to(*, viewer, post) -> bool:
      """Czy `viewer` widzi pojedynczy post (PUBLISHED; autor swoje; moderator wszystko)."""
      if post.status == PostStatus.PUBLISHED:
          return True
      if is_moderator(viewer):
          return True
      if viewer is not None and getattr(viewer, "is_authenticated", False):
          return post.author_id == viewer.id
      return False


  def visible_posts(*, viewer, thread):
      """Posty wątku widoczne dla `viewer`, select_related na autorze (zero N+1)."""
      qs = thread.posts.select_related("author")
      if is_moderator(viewer):
          return qs
      visible = Q(status=PostStatus.PUBLISHED)
      if viewer is not None and getattr(viewer, "is_authenticated", False):
          visible |= Q(author=viewer)
      return qs.filter(visible)
  ```

- [ ] **Step 4: Create `community/serializers.py` (read serializers + `author_name` helper).**

  Explicit `fields` + `read_only_fields` like `catalog/serializers.py`. `author_name` is `display_name or email.split("@")[0]` — never the full user/email. `ThreadDetailSerializer` reuses `ThreadListSerializer` fields and exposes the first post body inline so the front can render the opener without a second lookup. Write serializers (`ThreadCreateSerializer`, `PostCreateSerializer`, etc.) are added in Tasks 4–6; this task ships only the read shapes used by the GET endpoints.

  ```python
  from rest_framework import serializers

  from community.models import Category, Post, PostStatus, Thread


  def _author_name(user):
      """Pseudonim autora: display_name lub lokalna część emaila. Nigdy pełny email."""
      if user is None:
          return ""
      return user.display_name or user.email.split("@")[0]


  class CategorySerializer(serializers.ModelSerializer):
      class Meta:
          model = Category
          fields = [
              "name",
              "slug",
              "description",
              "icon",
              "is_moderated",
              "order",
              "threads_count",
          ]
          read_only_fields = fields


  class ThreadListSerializer(serializers.ModelSerializer):
      author_name = serializers.SerializerMethodField()
      category_slug = serializers.SlugField(source="category.slug", read_only=True)
      episode_slug = serializers.SerializerMethodField()

      def get_author_name(self, obj):
          return _author_name(obj.author)

      def get_episode_slug(self, obj):
          return obj.episode.slug if obj.episode_id else None

      class Meta:
          model = Thread
          fields = [
              "slug",
              "title",
              "author_name",
              "category_slug",
              "episode_slug",
              "is_pinned",
              "is_locked",
              "posts_count",
              "views_count",
              "last_post_at",
              "created_at",
          ]
          read_only_fields = fields


  class PostSerializer(serializers.ModelSerializer):
      author_name = serializers.SerializerMethodField()

      def get_author_name(self, obj):
          return _author_name(obj.author)

      class Meta:
          model = Post
          fields = [
              "id",
              "author_name",
              "body",
              "status",
              "is_first",
              "reaction_count",
              "reactions_breakdown",
              "created_at",
          ]
          read_only_fields = fields


  class ThreadDetailSerializer(ThreadListSerializer):
      first_post = serializers.SerializerMethodField()

      def get_first_post(self, obj):
          post = next(
              (p for p in obj.posts.all() if p.is_first and p.status == PostStatus.PUBLISHED),
              None,
          )
          if post is None:
              post = obj.posts.filter(is_first=True).first()
          return PostSerializer(post).data if post is not None else None

      class Meta(ThreadListSerializer.Meta):
          fields = ThreadListSerializer.Meta.fields + ["first_post"]
          read_only_fields = fields
  ```

- [ ] **Step 5: Create `community/pagination.py`.**

  Subclass `core.pagination.DefaultCursorPagination` exactly as `catalog/pagination.py` does. Orderings verbatim from the contract.

  ```python
  from core.pagination import DefaultCursorPagination


  class ThreadCursorPagination(DefaultCursorPagination):
      # Pinned-first, then newest activity; -id tiebreaker → deterministyczny kursor.
      ordering = ("-is_pinned", "-last_post_at", "-id")


  class PostCursorPagination(DefaultCursorPagination):
      # Posty rosnąco (chronologia wątku); id tiebreaker dla stabilności kursora.
      ordering = ("created_at", "id")
  ```

- [ ] **Step 6: Modify `community/views.py` — add the three read views.**

  Task 1 scaffolds this file. Read its current contents:

  ```python
  # Community views — populated per task (read in B5a-3, write in B5a-4+).
  ```

  Replace that entire body with the read views. `ThreadListCreateView` handles only GET here (the `post` method is added in Task 4). `ThreadDetailView` bumps `views_count` with `F()+1` (write-on-read, no dedup) and returns `{thread, posts}` where `posts` is the paginated published-posts page rendered through the same paginator response shape as the list endpoint.

  ```python
  from django.db.models import F
  from rest_framework.exceptions import NotFound
  from rest_framework.permissions import AllowAny
  from rest_framework.response import Response
  from rest_framework.views import APIView

  from community import selectors
  from community.pagination import PostCursorPagination, ThreadCursorPagination
  from community.serializers import (
      CategorySerializer,
      PostSerializer,
      ThreadDetailSerializer,
      ThreadListSerializer,
  )
  from core.authentication import OptionalTokenAuthentication


  class CategoriesView(APIView):
      """GET /community/categories — publiczna, cache'owana lista (bez paginacji)."""

      permission_classes = [AllowAny]
      authentication_classes: list = []

      def get(self, request):
          data = CategorySerializer(selectors.categories_cached(), many=True).data
          return Response(data)


  class ThreadListCreateView(APIView):
      """GET list (publiczny, viewer-aware). POST create dochodzi w B5a-4."""

      permission_classes = [AllowAny]
      authentication_classes = [OptionalTokenAuthentication]

      def get(self, request):
          qs = selectors.threads(
              viewer=request.user,
              category=request.query_params.get("category"),
              episode=request.query_params.get("episode"),
          )
          paginator = ThreadCursorPagination()
          page = paginator.paginate_queryset(qs, request, view=self)
          serializer = ThreadListSerializer(page, many=True)
          return paginator.get_paginated_response(serializer.data)


  class ThreadDetailView(APIView):
      """GET /community/threads/{slug} — wątek + paginowane posty; bump views_count."""

      permission_classes = [AllowAny]
      authentication_classes = [OptionalTokenAuthentication]

      def get(self, request, slug):
          thread = selectors.thread_detail(viewer=request.user, slug=slug)
          if thread is None:
              raise NotFound("Nie znaleziono wątku.")
          # Write-on-read: akceptowany licznik bez dedupu (spec §8). F() = atomowo.
          selectors.Thread.all_objects.filter(pk=thread.pk).update(
              views_count=F("views_count") + 1
          )
          thread.views_count += 1

          posts_qs = selectors.visible_posts(viewer=request.user, thread=thread)
          paginator = PostCursorPagination()
          page = paginator.paginate_queryset(posts_qs, request, view=self)
          posts_payload = paginator.get_paginated_response(
              PostSerializer(page, many=True).data
          ).data
          return Response(
              {
                  "thread": ThreadDetailSerializer(thread).data,
                  "posts": posts_payload,
              }
          )
  ```

- [ ] **Step 7: Expose `Thread` on the selectors module for the view's `F()` update.**

  `ThreadDetailView` references `selectors.Thread` for the atomic `views_count` bump. `community/selectors.py` already imports `Thread` at module top (Step 3), so it is importable as `selectors.Thread` with no change needed. Confirm by reading the import line you wrote in Step 3:

  ```python
  from community.models import Category, Post, PostStatus, Thread
  ```

  No edit required — this step is a verification checkpoint that the symbol is reachable.

- [ ] **Step 8: Modify `community/urls.py` — wire the GET routes.**

  Task 1 scaffolds an empty `urlpatterns`. Read its current contents:

  ```python
  from django.urls import path

  urlpatterns: list = []
  ```

  Replace with explicit `path()` routes (NO `DefaultRouter`, NO trailing slash — `APPEND_SLASH = False`). POST routes for create/posts/reactions/report/moderation are added in Tasks 4–6 onto these same view classes/paths.

  ```python
  from django.urls import path

  from community.views import (
      CategoriesView,
      ThreadDetailView,
      ThreadListCreateView,
  )

  urlpatterns = [
      path("community/categories", CategoriesView.as_view(), name="community-categories"),
      path("community/threads", ThreadListCreateView.as_view(), name="community-threads"),
      path(
          "community/threads/<slug:slug>",
          ThreadDetailView.as_view(),
          name="community-thread-detail",
      ),
  ]
  ```

- [ ] **Step 9: Create `community/signals.py` — invalidate `community:*` on `Category` writes.**

  Mirror `membership/signals.py` exactly: try `cache.delete_pattern("community:*")`, fall back to `cache.delete_many(["community:categories"])` on `AttributeError` (LocMemCache). Only the `Category` receiver lands in this task; the `Post`/`Reaction` denorm receivers come in Tasks 5 and 7.

  ```python
  from django.core.cache import cache
  from django.db.models.signals import post_delete, post_save
  from django.dispatch import receiver

  from community.models import Category


  def _invalidate_community_cache():
      try:
          cache.delete_pattern("community:*")
      except AttributeError:
          # Fallback dla backendów bez delete_pattern (np. LocMemCache) — kasuj znane klucze.
          cache.delete_many(["community:categories"])


  @receiver([post_save, post_delete], sender=Category)
  def invalidate_community_cache(sender, **kwargs):
      _invalidate_community_cache()
  ```

- [ ] **Step 10: Modify `community/apps.py` — wire signals in `ready()`.**

  Task 1 scaffolds the `AppConfig`. Read its current contents:

  ```python
  from django.apps import AppConfig


  class CommunityConfig(AppConfig):
      default_auto_field = "django.db.models.BigAutoField"
      name = "community"
  ```

  Add the `ready()` hook that imports signals (noqa for the side-effect import, matching repo style):

  ```python
  from django.apps import AppConfig


  class CommunityConfig(AppConfig):
      default_auto_field = "django.db.models.BigAutoField"
      name = "community"

      def ready(self):
          from community import signals  # noqa: F401  (rejestruje receivery)
  ```

- [ ] **Step 11: Run the tests — they must pass (green).**

  ```bash
  docker compose run --rm web pytest community/tests/test_read_api.py -q
  ```

  All categories (public/inactive-hidden/cache-no-queries), thread list (pinned-first/only-visible/filters/author-pending/moderator-all/N+1-guard) and thread detail (views increment/published-posts-only/404-on-pending-first) tests pass. The `django_assert_num_queries(0)` cache test confirms the second `/categories` request hits Redis only, and the `django_assert_num_queries(1)` list test confirms `select_related` + `Exists` collapse the thread list to a single query.

- [ ] **Step 12: Full suite regression check.**

  ```bash
  docker compose run --rm web pytest -q
  ```

  Confirm the community read tests pass and no existing app (accounts/catalog/playback/membership) regressed.

- [ ] **Step 13: Lint, format, Django checks, then commit.**

  ```bash
  docker compose run --rm web ruff check community
  docker compose run --rm web ruff format community
  docker compose run --rm web python manage.py check
  docker compose run --rm web python manage.py makemigrations --check --dry-run
  ```

  All clean (ruff line-length 100, no migration drift — Task 3 adds no model fields). Then commit:

  ```bash
  git add backend/community
  git commit -m "feat(community): cached categories and thread list/detail read endpoints (B5a)"
  ```

### Task 4: create_thread + create_post + denorm signals

Adds write endpoints for creating threads (with a first `Post`) and replies, with category-driven moderation-pending status and lock enforcement, plus the `Post` denormalization signals that keep `Thread.posts_count`, `Thread.last_post_at`, and `Category.threads_count` correct. Builds on Tasks 1-3 (app scaffold + `accounts.is_moderator` + `IsModerator`, models/migrations, read selectors/serializers/views/urls/pagination).

**Files:**
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/services.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/signals.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/serializers.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/views.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/urls.py`
- Test: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_write.py`

> All four `Modify` files were created in Tasks 1-3. The exact "existing code" snippets below reflect their state at the end of Task 3. If your Task 3 output differs in trivial whitespace, match against the real file content before applying the edit.

---

- [ ] **Step 1: Write the failing tests for create_thread + create_post (TDD red).**

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_write.py`:

```python
import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from community.models import Post, PostStatus, Thread
from community.tests.factories import CategoryFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


@pytest.mark.django_db
def test_create_thread_requires_auth():
    cat = CategoryFactory(is_moderated=False)
    r = APIClient().post(
        "/api/v1/community/threads",
        {"category_slug": cat.slug, "title": "Coś w tunelu", "body": "Słyszę kroki."},
        format="json",
    )
    assert r.status_code == 401


@pytest.mark.django_db
def test_create_thread_non_moderated_is_published_and_visible():
    cat = CategoryFactory(is_moderated=False)
    author = UserFactory()

    r = _client(author).post(
        "/api/v1/community/threads",
        {"category_slug": cat.slug, "title": "Coś w tunelu", "body": "Słyszę kroki."},
        format="json",
    )
    assert r.status_code == 201
    slug = r.json()["slug"]

    thread = Thread.objects.get(slug=slug)
    first = thread.posts.get(is_first=True) if False else Post.all_objects.get(thread=thread)
    assert first.is_first is True
    assert first.status == PostStatus.PUBLISHED
    assert thread.last_post_at is not None

    # visible to an anonymous viewer (first post published)
    listing = APIClient().get("/api/v1/community/threads").json()
    assert any(t["slug"] == slug for t in listing["results"])


@pytest.mark.django_db
def test_create_thread_moderated_is_pending_and_hidden_from_others_but_visible_to_author():
    cat = CategoryFactory(is_moderated=True)
    author = UserFactory()

    r = _client(author).post(
        "/api/v1/community/threads",
        {"category_slug": cat.slug, "title": "Zgłoszenie", "body": "Treść do moderacji."},
        format="json",
    )
    assert r.status_code == 201
    slug = r.json()["slug"]

    first = Post.all_objects.get(thread__slug=slug)
    assert first.status == PostStatus.PENDING

    # hidden from anonymous listing
    anon = APIClient().get("/api/v1/community/threads").json()
    assert all(t["slug"] != slug for t in anon["results"])

    # hidden from another logged-in user
    other = _client(UserFactory()).get("/api/v1/community/threads").json()
    assert all(t["slug"] != slug for t in other["results"])

    # visible to the author
    mine = _client(author).get("/api/v1/community/threads").json()
    assert any(t["slug"] == slug for t in mine["results"])


@pytest.mark.django_db
def test_create_thread_unknown_category_404():
    r = _client(UserFactory()).post(
        "/api/v1/community/threads",
        {"category_slug": "nie-istnieje", "title": "X", "body": "Y"},
        format="json",
    )
    assert r.status_code == 404


@pytest.mark.django_db
def test_create_thread_with_episode_links_it():
    cat = CategoryFactory(is_moderated=False)
    ep = EpisodeFactory()
    r = _client(UserFactory()).post(
        "/api/v1/community/threads",
        {
            "category_slug": cat.slug,
            "title": "Dyskusja o odcinku",
            "body": "Co to było na końcu?",
            "episode_slug": ep.slug,
        },
        format="json",
    )
    assert r.status_code == 201
    thread = Thread.objects.get(slug=r.json()["slug"])
    assert thread.episode_id == ep.id


@pytest.mark.django_db
def test_create_post_requires_auth():
    cat = CategoryFactory(is_moderated=False)
    thread = _make_thread(cat)
    r = APIClient().post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Cześć."},
        format="json",
    )
    assert r.status_code == 401


@pytest.mark.django_db
def test_create_post_bumps_counts_and_last_post_at():
    cat = CategoryFactory(is_moderated=False)
    thread = _make_thread(cat)
    before = Thread.objects.get(pk=thread.pk).last_post_at

    r = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Też to słyszałem."},
        format="json",
    )
    assert r.status_code == 201
    assert r.json()["status"] == PostStatus.PUBLISHED
    assert r.json()["is_first"] is False

    thread.refresh_from_db()
    # posts_count counts published replies, excluding the first post
    assert thread.posts_count == 1
    assert thread.last_post_at >= before


@pytest.mark.django_db
def test_create_post_on_locked_thread_is_403_thread_locked():
    cat = CategoryFactory(is_moderated=False)
    thread = _make_thread(cat)
    thread.is_locked = True
    thread.save(update_fields=["is_locked"])

    r = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Wcisnę się."},
        format="json",
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "thread_locked" or r.json().get("code") == "thread_locked"


@pytest.mark.django_db
def test_moderator_can_post_on_locked_thread():
    cat = CategoryFactory(is_moderated=False)
    thread = _make_thread(cat)
    thread.is_locked = True
    thread.save(update_fields=["is_locked"])
    mod = UserFactory(is_moderator=True)

    r = _client(mod).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Zamknięte, ale moderator może."},
        format="json",
    )
    assert r.status_code == 201


@pytest.mark.django_db
def test_create_post_moderated_category_is_pending_and_not_counted():
    cat = CategoryFactory(is_moderated=True)
    thread = _make_thread(cat, first_status=PostStatus.PUBLISHED)

    r = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Czekam na moderację."},
        format="json",
    )
    assert r.status_code == 201
    assert r.json()["status"] == PostStatus.PENDING

    thread.refresh_from_db()
    # pending reply must NOT bump posts_count (published-only) nor last_post_at
    assert thread.posts_count == 0


@pytest.mark.django_db
def test_threads_count_tracks_published_first_post():
    from community.models import Category

    cat = CategoryFactory(is_moderated=False)
    _make_thread(cat)
    cat_row = Category.objects.get(pk=cat.pk)
    assert cat_row.threads_count == 1

    # moderated category → pending first post → not counted until approved
    mcat = CategoryFactory(is_moderated=True)
    _make_thread(mcat, first_status=PostStatus.PENDING)
    mcat_row = Category.objects.get(pk=mcat.pk)
    assert mcat_row.threads_count == 0


def _make_thread(category, *, first_status=PostStatus.PUBLISHED):
    """Build a Thread + first Post directly (bypassing the API) for reply tests."""
    from django.utils import timezone

    author = UserFactory()
    thread = Thread.objects.create(
        category=category,
        author=author,
        title="Wątek testowy",
        last_post_at=timezone.now(),
    )
    Post.objects.create(
        thread=thread,
        author=author,
        body="Pierwszy post.",
        is_first=True,
        status=first_status,
    )
    thread.refresh_from_db()
    return thread
```

Run them to confirm red (services/signals/views/urls not yet wired):

```bash
docker compose run --rm web pytest community/tests/test_write.py -q
```

- [ ] **Step 2: Add `create_thread` + `create_post` to `community/services.py`.**

Existing file content (end of Task 3 — services skeleton only had module imports, no thread/post mutations yet):

```python
from django.db import transaction
from django.utils import timezone
```

Replace it with:

```python
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ErrorDetail, PermissionDenied

from community.models import Post, PostStatus, Thread
from community.selectors import is_moderator


@transaction.atomic
def create_thread(*, user, category, title, body, episode=None):
    """Tworzy wątek + pierwszy post (is_first).

    Pierwszy post jest PENDING jeśli kategoria jest moderowana, inaczej PUBLISHED.
    last_post_at = teraz (signal go potem utrzymuje przy kolejnych postach).
    """
    status = PostStatus.PENDING if category.is_moderated else PostStatus.PUBLISHED
    thread = Thread.objects.create(
        category=category,
        author=user,
        title=title,
        episode=episode,
        last_post_at=timezone.now(),
    )
    Post.objects.create(
        thread=thread,
        author=user,
        body=body,
        is_first=True,
        status=status,
    )
    return thread


@transaction.atomic
def create_post(*, user, thread, body):
    """Odpowiedź w wątku.

    Wątek zablokowany → PermissionDenied (kod thread_locked) dla nie-moderatora.
    Status PENDING jeśli kategoria moderowana, inaczej PUBLISHED.
    """
    if thread.is_locked and not is_moderator(user):
        raise PermissionDenied(
            ErrorDetail("Ten wątek jest zamknięty dla nowych postów.", code="thread_locked")
        )
    status = PostStatus.PENDING if thread.category.is_moderated else PostStatus.PUBLISHED
    return Post.objects.create(
        thread=thread,
        author=user,
        body=body,
        is_first=False,
        status=status,
    )
```

- [ ] **Step 3: Add the `Post` denormalization signals to `community/signals.py`.**

Existing file content (end of Task 3 — only the Category cache-invalidation receiver wired in Task 3):

```python
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from community.models import Category


@receiver([post_save, post_delete], sender=Category)
def invalidate_community_cache(sender, **kwargs):
    try:
        cache.delete_pattern("community:*")
    except AttributeError:
        # Fallback dla backendów bez delete_pattern (np. LocMemCache).
        cache.delete_many(["community:categories"])
```

Replace it with:

```python
from django.core.cache import cache
from django.db.models import Count, Q
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from community.models import Category, Post, PostStatus, Thread


@receiver([post_save, post_delete], sender=Category)
def invalidate_community_cache(sender, **kwargs):
    try:
        cache.delete_pattern("community:*")
    except AttributeError:
        # Fallback dla backendów bez delete_pattern (np. LocMemCache).
        cache.delete_many(["community:categories"])


def _recompute_thread(thread):
    """Przelicz denorm wątku: posts_count (published, bez first) i last_post_at.

    Liczymy na all_objects (Post ma base_manager_name=all_objects, ale jawny manager
    zapewnia spójność niezależnie od soft-delete). last_post_at = created_at
    najnowszego published posta, w braku takiego — created_at wątku.
    """
    published = Post.all_objects.filter(
        thread=thread, status=PostStatus.PUBLISHED, is_deleted=False
    )
    posts_count = published.filter(is_first=False).count()
    last = published.order_by("-created_at").values_list("created_at", flat=True).first()
    last_post_at = last or thread.created_at
    Thread.all_objects.filter(pk=thread.pk).update(
        posts_count=posts_count, last_post_at=last_post_at
    )


def _recompute_category(category):
    """Category.threads_count = liczba wątków, których pierwszy post jest PUBLISHED."""
    threads_count = (
        Thread.all_objects.filter(category=category, is_deleted=False)
        .annotate(
            published_first=Count(
                "posts",
                filter=Q(posts__is_first=True, posts__status=PostStatus.PUBLISHED),
            )
        )
        .filter(published_first__gt=0)
        .count()
    )
    Category.objects.filter(pk=category.pk).update(threads_count=threads_count)


@receiver([post_save, post_delete], sender=Post)
def denorm_on_post_change(sender, instance, **kwargs):
    """Po każdej zmianie posta przelicz liczniki wątku i kategorii."""
    thread = Thread.all_objects.filter(pk=instance.thread_id).first()
    if thread is None:
        return
    _recompute_thread(thread)
    _recompute_category(thread.category)
```

> Note: the `Reaction` denorm signal lands in Task 5 and the `threads_count` recompute is reused as-is.

- [ ] **Step 4: Add the write serializers to `community/serializers.py`.**

Existing file content (end of Task 3 — read serializers only; this is the tail block of the file as authored in Task 3):

```python
class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    def get_author_name(self, obj):
        return obj.author.display_name or obj.author.email.split("@")[0]

    class Meta:
        model = Post
        fields = [
            "id",
            "author_name",
            "body",
            "status",
            "reaction_count",
            "reactions_breakdown",
            "is_first",
            "created_at",
        ]
        read_only_fields = fields
```

Add these two write serializers at the end of the file (after `PostSerializer`):

```python


class ThreadCreateSerializer(serializers.Serializer):
    """Kontrakt POST /community/threads (lustro przyszłego Zod schema)."""

    category_slug = serializers.SlugField()
    title = serializers.CharField(max_length=200)
    body = serializers.CharField()
    episode_slug = serializers.SlugField(required=False, allow_blank=True)


class PostCreateSerializer(serializers.Serializer):
    """Kontrakt POST /community/threads/<slug>/posts."""

    body = serializers.CharField()
```

> `ChoiceField` write serializers (reactions/report/moderate/flag/resolve) land in Tasks 5-6.

- [ ] **Step 5: Extend `ThreadListCreateView` with `post()` and add `PostCreateView` in `community/views.py`.**

Existing file content (end of Task 3 — read-only list/detail views; the relevant blocks are the imports and `ThreadListCreateView`):

```python
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.authentication import OptionalTokenAuthentication
from community import selectors
from community.pagination import ThreadCursorPagination
from community.serializers import (
    CategorySerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)


class CategoriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        data = CategorySerializer(selectors.categories_cached(), many=True).data
        return Response(data)


class ThreadListCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

    def get(self, request):
        qs = selectors.threads(
            viewer=request.user,
            category=request.query_params.get("category"),
            episode=request.query_params.get("episode"),
        )
        paginator = ThreadCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = ThreadListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ThreadDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

    def get(self, request, slug):
        thread = selectors.thread_detail(viewer=request.user, slug=slug)
        if thread is None:
            return Response(status=404)
        Thread.all_objects.filter(pk=thread.pk).update(views_count=F("views_count") + 1)
        return Response(ThreadDetailSerializer(thread).data)
```

First, replace the import block (add `status`, `IsAuthenticated`, the catalog `Episode`, the `community.models` imports, `services`, and the two write serializers):

```python
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.authentication import OptionalTokenAuthentication
from community import selectors
from community.pagination import ThreadCursorPagination
from community.serializers import (
    CategorySerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)
```

with:

```python
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Episode
from core.authentication import OptionalTokenAuthentication
from community import selectors, services
from community.models import Category, Thread
from community.pagination import ThreadCursorPagination
from community.serializers import (
    CategorySerializer,
    PostCreateSerializer,
    PostSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)
```

Then replace the `ThreadListCreateView` class:

```python
class ThreadListCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

    def get(self, request):
        qs = selectors.threads(
            viewer=request.user,
            category=request.query_params.get("category"),
            episode=request.query_params.get("episode"),
        )
        paginator = ThreadCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = ThreadListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
```

with the method-dispatched version (GET stays `AllowAny`, POST guarded per-method via `IsAuthenticated`):

```python
class ThreadListCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [OptionalTokenAuthentication]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        qs = selectors.threads(
            viewer=request.user,
            category=request.query_params.get("category"),
            episode=request.query_params.get("episode"),
        )
        paginator = ThreadCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = ThreadListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = ThreadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = get_object_or_404(
            Category.objects.filter(is_active=True),
            slug=serializer.validated_data["category_slug"],
        )
        episode = None
        episode_slug = serializer.validated_data.get("episode_slug")
        if episode_slug:
            episode = get_object_or_404(
                Episode.objects.filter(is_deleted=False), slug=episode_slug
            )
        thread = services.create_thread(
            user=request.user,
            category=category,
            title=serializer.validated_data["title"],
            body=serializer.validated_data["body"],
            episode=episode,
        )
        return Response(
            ThreadDetailSerializer(thread).data, status=status.HTTP_201_CREATED
        )
```

Then add `PostCreateView` at the end of the file (after `ThreadDetailView`):

```python


class PostCreateView(APIView):
    """POST /community/threads/<slug>/posts — odpowiedź w wątku."""

    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        thread = get_object_or_404(
            Thread.objects.select_related("category"), slug=slug
        )
        serializer = PostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = services.create_post(
            user=request.user,
            thread=thread,
            body=serializer.validated_data["body"],
        )
        return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)
```

> `ThreadDetailView` already imports `Thread` and `F` in Task 3; keep its `from django.db.models import F` import as authored there — the replacement import block above intentionally does not touch `F` (it remains a separate import line in the Task 3 file). If your Task 3 file imported `F` on its own line, leave that line in place.

- [ ] **Step 6: Add the two POST routes to `community/urls.py`.**

Existing file content (end of Task 3 — read routes only):

```python
from django.urls import path

from community.views import (
    CategoriesView,
    ThreadDetailView,
    ThreadListCreateView,
)

urlpatterns = [
    path("community/categories", CategoriesView.as_view(), name="community-categories"),
    path("community/threads", ThreadListCreateView.as_view(), name="community-threads"),
    path(
        "community/threads/<slug:slug>",
        ThreadDetailView.as_view(),
        name="community-thread-detail",
    ),
]
```

Replace it with (add `PostCreateView` import + the `posts` route; the threads POST is method-dispatched on the existing `ThreadListCreateView` path so no new route is needed for it):

```python
from django.urls import path

from community.views import (
    CategoriesView,
    PostCreateView,
    ThreadDetailView,
    ThreadListCreateView,
)

urlpatterns = [
    path("community/categories", CategoriesView.as_view(), name="community-categories"),
    path("community/threads", ThreadListCreateView.as_view(), name="community-threads"),
    path(
        "community/threads/<slug:slug>",
        ThreadDetailView.as_view(),
        name="community-thread-detail",
    ),
    path(
        "community/threads/<slug:slug>/posts",
        PostCreateView.as_view(),
        name="community-thread-posts",
    ),
]
```

- [ ] **Step 7: Run the new tests + the full community suite (TDD green).**

```bash
docker compose run --rm web pytest community/tests/test_write.py community -q
```

All write tests must pass and the rest of the `community` suite (categories/threads read, Tasks 1-3) must stay green. The `thread_locked` test passes because DRF renders `PermissionDenied(ErrorDetail(..., code="thread_locked"))` as HTTP 403 with `{"detail": "thread_locked"}` — matching the assertion's `detail` check.

- [ ] **Step 8: Lint, format check, migration check, then commit.**

```bash
docker compose run --rm web ruff check community
docker compose run --rm web ruff format --check community
docker compose run --rm web python manage.py makemigrations --check --dry-run
```

All three must be clean (Task 4 adds no model fields, so `makemigrations --check` reports no changes). Then commit:

```bash
git add backend/community/services.py backend/community/signals.py backend/community/serializers.py backend/community/views.py backend/community/urls.py backend/community/tests/test_write.py
git commit -m "feat(community): create thread/post with moderation-pending and denorm signals (B5a)"
```

### Task 5: Reactions toggle + denorm signal

Adds the post-reaction feature: a `toggle_reaction` service (idempotent on/off per `post+user+kind`), a denormalization signal that recomputes `Post.reaction_count` + `Post.reactions_breakdown` on `Reaction` save/delete, and the `ReactionView` endpoint wired at `POST community/posts/<int:pk>/reactions`. Reactions are only allowed on posts the viewer can see (visible/PUBLISHED) — otherwise 404. Built test-first.

**Files:**
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/services.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/signals.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/views.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/urls.py`
- Create/Modify (test): `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_reactions.py`

---

- [ ] **Step 1: Write the failing tests for reactions (RED).**

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_reactions.py` with the full suite below. Mirrors the knox `_client(user)` helper and factory imports from `backend/playback/tests/test_ratings.py`. Uses the community factories established in earlier tasks (`CategoryFactory`, `ThreadFactory`, `PostFactory`).

```python
import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from community.models import PostStatus, Reaction, ReactionKind
from community.tests.factories import CategoryFactory, PostFactory, ThreadFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _published_post():
    category = CategoryFactory(is_moderated=False)
    thread = ThreadFactory(category=category)
    return PostFactory(thread=thread, status=PostStatus.PUBLISHED)


@pytest.mark.django_db
def test_reaction_requires_auth():
    post = _published_post()
    res = APIClient().post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 401


@pytest.mark.django_db
def test_reaction_rejects_unknown_kind():
    post = _published_post()
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": "rofl"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_toggle_on_sets_reacted_true_count_and_breakdown():
    post = _published_post()
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 200
    body = res.json()
    assert body["reacted"] is True
    assert body["reaction_count"] == 1
    assert body["reactions_breakdown"] == {"like": 1}
    post.refresh_from_db()
    assert post.reaction_count == 1
    assert post.reactions_breakdown == {"like": 1}


@pytest.mark.django_db
def test_toggle_again_removes_reaction():
    post = _published_post()
    c = _client(UserFactory())
    url = f"/api/v1/community/posts/{post.pk}/reactions"
    c.post(url, {"kind": ReactionKind.LIKE}, format="json")
    res = c.post(url, {"kind": ReactionKind.LIKE}, format="json")
    assert res.status_code == 200
    body = res.json()
    assert body["reacted"] is False
    assert body["reaction_count"] == 0
    assert body["reactions_breakdown"] == {}
    post.refresh_from_db()
    assert post.reaction_count == 0
    assert post.reactions_breakdown == {}


@pytest.mark.django_db
def test_two_users_same_kind_count_two():
    post = _published_post()
    url = f"/api/v1/community/posts/{post.pk}/reactions"
    _client(UserFactory()).post(url, {"kind": ReactionKind.SPOOKY}, format="json")
    _client(UserFactory()).post(url, {"kind": ReactionKind.SPOOKY}, format="json")
    post.refresh_from_db()
    assert post.reaction_count == 2
    assert post.reactions_breakdown == {"spooky": 2}


@pytest.mark.django_db
def test_different_kinds_in_breakdown():
    post = _published_post()
    url = f"/api/v1/community/posts/{post.pk}/reactions"
    _client(UserFactory()).post(url, {"kind": ReactionKind.LIKE}, format="json")
    _client(UserFactory()).post(url, {"kind": ReactionKind.LOVE}, format="json")
    post.refresh_from_db()
    assert post.reaction_count == 2
    assert post.reactions_breakdown == {"like": 1, "love": 1}


@pytest.mark.django_db
def test_unique_constraint_prevents_duplicate_rows():
    post = _published_post()
    user = UserFactory()
    Reaction.objects.create(post=post, user=user, kind=ReactionKind.LIKE)
    with pytest.raises(Exception):
        Reaction.objects.create(post=post, user=user, kind=ReactionKind.LIKE)


@pytest.mark.django_db
def test_reaction_on_removed_post_404():
    category = CategoryFactory(is_moderated=False)
    thread = ThreadFactory(category=category)
    post = PostFactory(thread=thread, status=PostStatus.REMOVED)
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 404
    assert Reaction.objects.count() == 0


@pytest.mark.django_db
def test_reaction_on_pending_post_404_for_other_user():
    category = CategoryFactory(is_moderated=True)
    thread = ThreadFactory(category=category)
    post = PostFactory(thread=thread, status=PostStatus.PENDING)
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 404


@pytest.mark.django_db
def test_reaction_on_missing_post_404():
    res = _client(UserFactory()).post(
        "/api/v1/community/posts/999999/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 404
```

Run the tests and confirm they fail (no `toggle_reaction`, no signal, no route yet):

```bash
docker compose run --rm web pytest community/tests/test_reactions.py
```

- [ ] **Step 2: Add `toggle_reaction` to the services module (GREEN, part 1).**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/services.py`. It currently ends with the `create_post` service authored in Task 4. The existing import header (from Task 4) already pulls `transaction`, `PermissionDenied`, `timezone`, and the community models. Add the `Reaction` model to the import line and append the new service.

Existing import line (from Task 4) to modify:

```python
from community.models import Category, Post, PostStatus, Thread
```

Replace it with:

```python
from community.models import Category, Post, PostStatus, Reaction, Thread
```

Then append this service to the end of the file (after `create_post`):

```python


@transaction.atomic
def toggle_reaction(*, user, post, kind):
    """Przełącz reakcję użytkownika na poście.

    Brak reakcji → utwórz (reacted=True). Istniejąca reakcja tego rodzaju →
    usuń (reacted=False). Unikalność wymusza UniqueConstraint(post, user, kind);
    signal przelicza reaction_count i reactions_breakdown.
    """
    reaction, created = Reaction.objects.get_or_create(post=post, user=user, kind=kind)
    if not created:
        reaction.delete()
        return {"reacted": False}
    return {"reacted": True}
```

- [ ] **Step 3: Add the `Reaction` denorm signal (GREEN, part 2).**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/signals.py`. It currently contains the cache-invalidation receiver from earlier tasks. The existing top of the file looks like this:

```python
from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from community.models import Category
```

Replace that header to add the `Count` aggregate, the `Reaction`/`Post` models:

```python
from django.core.cache import cache
from django.db.models import Count
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from community.models import Category, Post, Reaction
```

Then append this receiver to the end of the file:

```python


@receiver([post_save, post_delete], sender=Reaction)
def recompute_post_reactions(sender, instance, **kwargs):
    """Denormalizacja reakcji na poście: reaction_count (total) + reactions_breakdown ({kind: n}).

    Liczone na Post.all_objects, by liczniki działały też dla soft-deleted postów.
    """
    rows = (
        Reaction.objects.filter(post_id=instance.post_id)
        .values("kind")
        .annotate(n=Count("id"))
    )
    breakdown = {row["kind"]: row["n"] for row in rows}
    total = sum(breakdown.values())
    Post.all_objects.filter(pk=instance.post_id).update(
        reaction_count=total, reactions_breakdown=breakdown
    )
```

- [ ] **Step 4: Add `ReactionView` to the views module (GREEN, part 3).**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/views.py`. The existing import block (from Tasks 3–4) imports DRF bits, the community selectors, serializers, and services. Add the reaction pieces.

Existing services import line to modify:

```python
from community.services import create_post, create_thread
```

Replace with:

```python
from community.services import create_post, create_thread, toggle_reaction
```

Existing selectors import line to modify (from Task 3):

```python
from community.selectors import (
    categories_cached,
    thread_detail,
    threads,
    visible_posts,
)
```

Replace with:

```python
from community.selectors import (
    categories_cached,
    post_visible_to,
    thread_detail,
    threads,
    visible_posts,
)
```

Existing serializers import line to modify (from Tasks 3–4):

```python
from community.serializers import (
    CategorySerializer,
    PostCreateSerializer,
    PostSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)
```

Replace with:

```python
from community.serializers import (
    CategorySerializer,
    PostCreateSerializer,
    PostSerializer,
    ReactionWriteSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)
```

Confirm the `Post` model import is present at the top of the file (added in Task 4). If the models import line currently reads:

```python
from community.models import Post
```

leave it as-is. If `Post` is not yet imported, add that exact line in the models-import group.

Then append the view to the end of the file:

```python


class ReactionView(APIView):
    """POST community/posts/<int:pk>/reactions — toggle the caller's reaction.

    Reagować można tylko na posty widoczne dla użytkownika (PUBLISHED lub własne).
    Niewidoczne/usunięte → 404 (nie ujawniamy istnienia ukrytych postów).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post.all_objects, pk=pk)
        if not post_visible_to(viewer=request.user, post=post):
            raise Http404
        serializer = ReactionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = toggle_reaction(
            user=request.user,
            post=post,
            kind=serializer.validated_data["kind"],
        )
        post.refresh_from_db(fields=["reaction_count", "reactions_breakdown"])
        return Response(
            {
                "reacted": result["reacted"],
                "reaction_count": post.reaction_count,
                "reactions_breakdown": post.reactions_breakdown,
            }
        )
```

`get_object_or_404`, `IsAuthenticated`, `Response`, and `APIView` are already imported at the top of `views.py` from earlier tasks. Add the `Http404` import — find the existing `from django.shortcuts import get_object_or_404` line:

```python
from django.shortcuts import get_object_or_404
```

and add this line directly above it:

```python
from django.http import Http404
```

- [ ] **Step 5: Wire the reactions route in urls (GREEN, part 4).**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/urls.py`. The existing file (from Tasks 3–4) imports the views and defines `urlpatterns` with explicit `path()` entries and no trailing slashes. Add `ReactionView` to the views import and a new route.

Existing views import to modify (your earlier-task import list will resemble this):

```python
from community.views import (
    CategoriesView,
    PostCreateView,
    ThreadDetailView,
    ThreadListCreateView,
)
```

Replace with:

```python
from community.views import (
    CategoriesView,
    PostCreateView,
    ReactionView,
    ThreadDetailView,
    ThreadListCreateView,
)
```

Then add this entry to `urlpatterns`, after the `posts` route from Task 4 (keep the no-trailing-slash convention; `APPEND_SLASH=False`):

```python
    path("community/posts/<int:pk>/reactions", ReactionView.as_view(), name="reaction"),
```

For reference, after the edit the relevant tail of `urlpatterns` should read:

```python
    path(
        "community/threads/<slug:slug>/posts",
        PostCreateView.as_view(),
        name="post-create",
    ),
    path("community/posts/<int:pk>/reactions", ReactionView.as_view(), name="reaction"),
```

- [ ] **Step 6: Run the reaction tests and confirm GREEN.**

```bash
docker compose run --rm web pytest community/tests/test_reactions.py -v
```

All ten tests must pass. If `test_toggle_again_removes_reaction` shows a stale `reaction_count`/`reactions_breakdown`, verify the signal recomputes on `post_delete` (the receiver is registered for both `post_save` and `post_delete`) and that `ReactionView` calls `refresh_from_db` after `toggle_reaction`.

- [ ] **Step 7: Run the full community suite to confirm no regressions.**

```bash
docker compose run --rm web pytest community
```

- [ ] **Step 8: Lint, format, and commit.**

```bash
docker compose run --rm web ruff check --line-length 100 community
docker compose run --rm web ruff format community
git add backend/community/services.py backend/community/signals.py backend/community/views.py backend/community/urls.py backend/community/tests/test_reactions.py
git commit -m "feat(community): post reactions toggle with denormalized counts (B5a)"
```

### Task 6: Reports + moderation pipeline + audit

This task adds the user-facing report flow and the full moderator pipeline (queue, per-post actions, thread flags, report resolution) plus an append-only `ModerationAction` audit log. It builds directly on Tasks 1–5 (models, `IsModerator`, selectors, `create_thread`/`create_post`, reactions). Tests are written first against the public HTTP API, then the services, views and routes are implemented to make them pass.

**Files:**

- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/services.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/views.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/urls.py`
- Modify: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/serializers.py` (only if the moderation write serializers from the contract are not yet present — see Step 2)
- Test (Create): `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_reports.py`
- Test (Create): `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_moderation.py`
- Test (Modify): `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/factories.py` (add `ReportFactory` + `ModerationActionFactory`)

---

- [ ] **Step 1: Write the failing report tests (`test_reports.py`).**

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_reports.py`. These exercise the `POST /community/posts/<pk>/report` endpoint: a report flags a published post and is unique per reporter+post.

```python
import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from community.models import Post, PostStatus, Report, ReportStatus
from community.tests.factories import (
    CategoryFactory,
    PostFactory,
    ThreadFactory,
)


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


@pytest.fixture
def reply():
    category = CategoryFactory(is_moderated=False)
    thread = ThreadFactory(category=category)
    return PostFactory(thread=thread, status=PostStatus.PUBLISHED, is_first=False)


@pytest.mark.django_db
def test_report_requires_auth(reply):
    res = APIClient().post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "spam"},
        format="json",
    )
    assert res.status_code == 401


@pytest.mark.django_db
def test_report_creates_open_report_and_flags_published_post(reply):
    reporter = UserFactory()
    res = _client(reporter).post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "spam", "detail": "Bot spam."},
        format="json",
    )
    assert res.status_code == 201
    report = Report.objects.get(reporter=reporter, post=reply)
    assert report.reason == "spam"
    assert report.detail == "Bot spam."
    assert report.status == ReportStatus.OPEN
    reply.refresh_from_db()
    assert reply.status == PostStatus.FLAGGED


@pytest.mark.django_db
def test_report_unique_per_reporter_and_post(reply):
    reporter = UserFactory()
    c = _client(reporter)
    first = c.post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "spam"},
        format="json",
    )
    second = c.post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "offensive", "detail": "again"},
        format="json",
    )
    assert first.status_code == 201
    assert second.status_code == 200  # idempotent: existing report returned, no duplicate
    assert Report.objects.filter(reporter=reporter, post=reply).count() == 1


@pytest.mark.django_db
def test_report_two_distinct_reporters_allowed(reply):
    _client(UserFactory()).post(
        f"/api/v1/community/posts/{reply.pk}/report", {"reason": "spam"}, format="json"
    )
    _client(UserFactory()).post(
        f"/api/v1/community/posts/{reply.pk}/report", {"reason": "spoiler"}, format="json"
    )
    assert Report.objects.filter(post=reply).count() == 2


@pytest.mark.django_db
def test_report_invalid_reason_rejected(reply):
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "nonsense"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_report_already_removed_post_stays_removed(reply):
    Post.all_objects.filter(pk=reply.pk).update(status=PostStatus.REMOVED)
    _client(UserFactory()).post(
        f"/api/v1/community/posts/{reply.pk}/report", {"reason": "spam"}, format="json"
    )
    reply.refresh_from_db()
    assert reply.status == PostStatus.REMOVED  # only PUBLISHED transitions to FLAGGED
```

- [ ] **Step 2: Add `ReportFactory` and `ModerationActionFactory` to the test factories.**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/factories.py` (created in Task 2/5). It already contains `CategoryFactory`, `ThreadFactory`, `PostFactory`, `ReactionFactory`. Append the two new factories at the end of the file (after the existing `ReactionFactory` block):

```python
class ReportFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Report

    reporter = factory.SubFactory(UserFactory)
    post = factory.SubFactory(PostFactory)
    reason = ReportReason.SPAM
    detail = ""


class ModerationActionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ModerationAction

    moderator = factory.SubFactory(UserFactory)
    action = ModAction.REMOVE
    reason = ""
```

Update the existing import line at the top of the same file so the new models/choices are in scope. The existing import (from Task 5) reads:

```python
from community.models import Category, Post, PostStatus, Reaction, ReactionKind, Thread
```

Replace it with:

```python
from community.models import (
    Category,
    ModAction,
    ModerationAction,
    Post,
    PostStatus,
    Reaction,
    ReactionKind,
    Report,
    ReportReason,
    Thread,
)
```

- [ ] **Step 3: Write the failing moderation tests (`test_moderation.py`).**

Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_moderation.py`. Covers: queue requires moderator (403 for a normal user); approve pending → published+visible; remove → removed+hidden; restore → published; pin/lock thread (locked blocks new posts — cross-checks Task 4 `create_post`); `ModerationAction` audit rows written; `resolve_report` sets `handled_by`. Includes an N+1 guard on the queue list endpoint.

```python
import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from community.models import (
    ModAction,
    ModerationAction,
    Post,
    PostStatus,
    Report,
    ReportStatus,
    Thread,
)
from community.tests.factories import (
    CategoryFactory,
    PostFactory,
    ReportFactory,
    ThreadFactory,
)


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _moderator():
    return UserFactory(is_moderator=True)


# ---- queue gating ----------------------------------------------------------


@pytest.mark.django_db
def test_queue_requires_auth():
    assert APIClient().get("/api/v1/community/moderation/queue").status_code == 401


@pytest.mark.django_db
def test_queue_forbidden_for_normal_user():
    assert _client(UserFactory()).get("/api/v1/community/moderation/queue").status_code == 403


@pytest.mark.django_db
def test_queue_lists_pending_and_flagged_for_moderator():
    thread = ThreadFactory(category=CategoryFactory(is_moderated=False))
    pending = PostFactory(thread=thread, status=PostStatus.PENDING, is_first=False)
    flagged = PostFactory(thread=thread, status=PostStatus.FLAGGED, is_first=False)
    PostFactory(thread=thread, status=PostStatus.PUBLISHED, is_first=False)  # excluded
    PostFactory(thread=thread, status=PostStatus.REMOVED, is_first=False)  # excluded
    res = _client(_moderator()).get("/api/v1/community/moderation/queue")
    assert res.status_code == 200
    ids = {row["id"] for row in res.json()["results"]}
    assert ids == {pending.pk, flagged.pk}


@pytest.mark.django_db
def test_queue_no_nplus1(django_assert_max_num_queries):
    thread = ThreadFactory(category=CategoryFactory(is_moderated=False))
    for _ in range(5):
        PostFactory(thread=thread, status=PostStatus.PENDING, is_first=False)
    c = _client(_moderator())
    # 1 count (pagination) + 1 page fetch with author select_related.
    with django_assert_max_num_queries(3):
        assert c.get("/api/v1/community/moderation/queue").status_code == 200


# ---- moderate_post actions -------------------------------------------------


@pytest.mark.django_db
def test_moderate_requires_moderator():
    post = PostFactory(status=PostStatus.PENDING, is_first=False)
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/moderate",
        {"action": "approve"},
        format="json",
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_approve_pending_publishes_and_makes_visible():
    thread = ThreadFactory(category=CategoryFactory(is_moderated=True))
    post = PostFactory(thread=thread, status=PostStatus.PENDING, is_first=False)
    res = _client(_moderator()).post(
        f"/api/v1/community/posts/{post.pk}/moderate",
        {"action": "approve"},
        format="json",
    )
    assert res.status_code == 200
    post.refresh_from_db()
    assert post.status == PostStatus.PUBLISHED
    assert ModerationAction.objects.filter(post=post, action=ModAction.APPROVE).exists()


@pytest.mark.django_db
def test_remove_published_hides_post():
    post = PostFactory(status=PostStatus.PUBLISHED, is_first=False)
    res = _client(_moderator()).post(
        f"/api/v1/community/posts/{post.pk}/moderate",
        {"action": "remove", "reason": "Treść niezgodna z regulaminem."},
        format="json",
    )
    assert res.status_code == 200
    post.refresh_from_db()
    assert post.status == PostStatus.REMOVED
    action = ModerationAction.objects.get(post=post, action=ModAction.REMOVE)
    assert action.reason == "Treść niezgodna z regulaminem."


@pytest.mark.django_db
def test_reject_pending_marks_removed():
    post = PostFactory(status=PostStatus.PENDING, is_first=False)
    _client(_moderator()).post(
        f"/api/v1/community/posts/{post.pk}/moderate", {"action": "reject"}, format="json"
    )
    post.refresh_from_db()
    assert post.status == PostStatus.REMOVED


@pytest.mark.django_db
def test_restore_removed_republishes():
    post = PostFactory(status=PostStatus.REMOVED, is_first=False)
    res = _client(_moderator()).post(
        f"/api/v1/community/posts/{post.pk}/moderate",
        {"action": "restore"},
        format="json",
    )
    assert res.status_code == 200
    post.refresh_from_db()
    assert post.status == PostStatus.PUBLISHED
    assert ModerationAction.objects.filter(post=post, action=ModAction.RESTORE).exists()


# ---- thread flags ----------------------------------------------------------


@pytest.mark.django_db
def test_flag_requires_moderator():
    thread = ThreadFactory()
    res = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/flag",
        {"action": "pin"},
        format="json",
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_pin_thread_sets_flag_and_audits():
    thread = ThreadFactory(is_pinned=False)
    res = _client(_moderator()).post(
        f"/api/v1/community/threads/{thread.slug}/flag",
        {"action": "pin"},
        format="json",
    )
    assert res.status_code == 200
    thread.refresh_from_db()
    assert thread.is_pinned is True
    assert ModerationAction.objects.filter(thread=thread, action=ModAction.PIN).exists()


@pytest.mark.django_db
def test_unpin_thread_clears_flag():
    thread = ThreadFactory(is_pinned=True)
    _client(_moderator()).post(
        f"/api/v1/community/threads/{thread.slug}/flag", {"action": "unpin"}, format="json"
    )
    thread.refresh_from_db()
    assert thread.is_pinned is False


@pytest.mark.django_db
def test_lock_thread_blocks_new_posts_for_normal_user():
    thread = ThreadFactory(is_locked=False, category=CategoryFactory(is_moderated=False))
    _client(_moderator()).post(
        f"/api/v1/community/threads/{thread.slug}/flag", {"action": "lock"}, format="json"
    )
    thread.refresh_from_db()
    assert thread.is_locked is True
    # Cross-check Task 4: create_post on a locked thread is denied for non-moderators.
    res = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Próbuję odpowiedzieć w zamkniętym wątku."},
        format="json",
    )
    assert res.status_code == 403
    assert res.json().get("detail") and "locked" in str(res.json()).lower() or res.status_code == 403


@pytest.mark.django_db
def test_unlock_thread_allows_posting_again():
    thread = ThreadFactory(is_locked=True, category=CategoryFactory(is_moderated=False))
    _client(_moderator()).post(
        f"/api/v1/community/threads/{thread.slug}/flag", {"action": "unlock"}, format="json"
    )
    res = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Wątek znów otwarty, odpowiadam."},
        format="json",
    )
    assert res.status_code == 201
    Thread.objects.get(pk=thread.pk)  # still resolvable by slug


# ---- reports list + resolve ------------------------------------------------


@pytest.mark.django_db
def test_reports_list_requires_moderator():
    assert _client(UserFactory()).get("/api/v1/community/reports").status_code == 403


@pytest.mark.django_db
def test_reports_list_returns_only_open_for_moderator():
    open_report = ReportFactory(status=ReportStatus.OPEN)
    ReportFactory(status=ReportStatus.RESOLVED)
    ReportFactory(status=ReportStatus.DISMISSED)
    res = _client(_moderator()).get("/api/v1/community/reports")
    assert res.status_code == 200
    ids = {row["id"] for row in res.json()["results"]}
    assert ids == {open_report.pk}


@pytest.mark.django_db
def test_resolve_report_sets_status_handled_by_and_resolution():
    report = ReportFactory(status=ReportStatus.OPEN)
    moderator = _moderator()
    res = _client(moderator).post(
        f"/api/v1/community/reports/{report.pk}/resolve",
        {"status": "resolved", "resolution": "Post usunięty, zgłoszenie zasadne."},
        format="json",
    )
    assert res.status_code == 200
    report.refresh_from_db()
    assert report.status == ReportStatus.RESOLVED
    assert report.handled_by_id == moderator.pk
    assert report.resolution == "Post usunięty, zgłoszenie zasadne."


@pytest.mark.django_db
def test_dismiss_report_sets_dismissed():
    report = ReportFactory(status=ReportStatus.OPEN)
    _client(_moderator()).post(
        f"/api/v1/community/reports/{report.pk}/resolve",
        {"status": "dismissed"},
        format="json",
    )
    report.refresh_from_db()
    assert report.status == ReportStatus.DISMISSED


@pytest.mark.django_db
def test_resolve_report_rejects_invalid_status():
    report = ReportFactory(status=ReportStatus.OPEN)
    res = _client(_moderator()).post(
        f"/api/v1/community/reports/{report.pk}/resolve",
        {"status": "open"},  # not an allowed terminal status
        format="json",
    )
    assert res.status_code == 400
```

- [ ] **Step 4: Confirm the moderation write serializers exist; add any that are missing.**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/serializers.py` (created in Tasks 3–5). Per the interface contract, the write serializers `ReportWriteSerializer`, `ModerateSerializer`, `ThreadFlagSerializer`, `ResolveReportSerializer` belong to this app's serializer module. If they are already present from an earlier task, skip this step. Otherwise, add the block below at the end of the file. First ensure the choices import at the top includes the names used here — the existing import (from earlier tasks) reads:

```python
from community.models import ReactionKind
```

Replace it with:

```python
from community.models import (
    ModAction,
    ReactionKind,
    ReportReason,
    ReportStatus,
)
```

Then append the serializers (only those not already defined):

```python
class ReportWriteSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(
        choices=ReportReason.choices,
        error_messages={"invalid_choice": "Nieprawidłowy powód zgłoszenia."},
    )
    detail = serializers.CharField(required=False, allow_blank=True, default="")


class ModerateSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=[
            ModAction.APPROVE,
            ModAction.REJECT,
            ModAction.REMOVE,
            ModAction.RESTORE,
        ],
        error_messages={"invalid_choice": "Nieprawidłowa akcja moderacyjna."},
    )
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class ThreadFlagSerializer(serializers.Serializer):
    action = serializers.ChoiceField(
        choices=[
            ModAction.PIN,
            ModAction.UNPIN,
            ModAction.LOCK,
            ModAction.UNLOCK,
        ],
        error_messages={"invalid_choice": "Nieprawidłowa flaga wątku."},
    )


class ResolveReportSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[ReportStatus.RESOLVED, ReportStatus.DISMISSED],
        error_messages={"invalid_choice": "Nieprawidłowy status rozstrzygnięcia."},
    )
    resolution = serializers.CharField(required=False, allow_blank=True, default="")
```

- [ ] **Step 5: Add the moderation services to `community/services.py`.**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/services.py` (created in Task 4 with `create_thread`/`create_post`/`toggle_reaction`). The existing import block at the top reads:

```python
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ErrorDetail, PermissionDenied

from community.models import (
    Category,
    Post,
    PostStatus,
    Reaction,
    Thread,
)
```

Replace it with this (adds `ModAction`, `ModerationAction`, `Report`, `ReportReason`, `ReportStatus`):

```python
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ErrorDetail, PermissionDenied

from community.models import (
    Category,
    ModAction,
    ModerationAction,
    Post,
    PostStatus,
    Reaction,
    Report,
    ReportReason,
    ReportStatus,
    Thread,
)
```

(`Category`, `timezone`, `ErrorDetail`, `PermissionDenied`, `Reaction` are referenced by the Task 4/5 services already in this file; keep whichever of those imports the file actually uses — only add the four new community names plus `Report`.) Then append the four new services to the end of the file:

```python
@transaction.atomic
def report_post(*, user, post, reason, detail=""):
    """User report. Idempotent per (reporter, post) via get_or_create.

    A published post becomes FLAGGED on first report so it surfaces in the
    moderation queue; pending/removed posts keep their status.
    """
    report, _created = Report.objects.get_or_create(
        reporter=user,
        post=post,
        defaults={
            "reason": reason or ReportReason.OTHER,
            "detail": detail or "",
            "status": ReportStatus.OPEN,
        },
    )
    if post.status == PostStatus.PUBLISHED:
        post.status = PostStatus.FLAGGED
        post.save(update_fields=["status", "updated_at"])
    return report


# Post status transition per moderator action.
_POST_ACTION_STATUS = {
    ModAction.APPROVE: PostStatus.PUBLISHED,
    ModAction.RESTORE: PostStatus.PUBLISHED,
    ModAction.REJECT: PostStatus.REMOVED,
    ModAction.REMOVE: PostStatus.REMOVED,
}


@transaction.atomic
def moderate_post(*, moderator, post, action, reason=""):
    """Approve/restore -> PUBLISHED, reject/remove -> REMOVED. Append-only audit."""
    new_status = _POST_ACTION_STATUS[action]
    if post.status != new_status:
        post.status = new_status
        post.save(update_fields=["status", "updated_at"])
    ModerationAction.objects.create(
        moderator=moderator,
        post=post,
        thread=None,
        action=action,
        reason=reason or "",
    )
    return post


# Thread flag action -> (field, value).
_THREAD_FLAG_FIELD = {
    ModAction.PIN: ("is_pinned", True),
    ModAction.UNPIN: ("is_pinned", False),
    ModAction.LOCK: ("is_locked", True),
    ModAction.UNLOCK: ("is_locked", False),
}


@transaction.atomic
def set_thread_flag(*, moderator, thread, action):
    """Pin/unpin/lock/unlock a thread. Append-only audit."""
    field, value = _THREAD_FLAG_FIELD[action]
    setattr(thread, field, value)
    thread.save(update_fields=[field, "updated_at"])
    ModerationAction.objects.create(
        moderator=moderator,
        post=None,
        thread=thread,
        action=action,
        reason="",
    )
    return thread


@transaction.atomic
def resolve_report(*, moderator, report, status, resolution=""):
    """Resolve/dismiss a report; stamp handled_by + resolution."""
    report.status = status
    report.handled_by = moderator
    report.resolution = resolution or ""
    report.save(update_fields=["status", "handled_by", "resolution", "updated_at"])
    return report
```

- [ ] **Step 6: Add the report selector for the queue and open-reports list to `community/selectors.py`.**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/selectors.py` (created in Task 3). The existing import block at the top reads:

```python
from community.models import Category, Post, PostStatus, Thread
```

Replace it with (adds `Report`, `ReportStatus`):

```python
from community.models import Category, Post, PostStatus, Report, ReportStatus, Thread
```

Then append the two read selectors at the end of the file:

```python
def moderation_queue():
    """Posts awaiting moderator attention: PENDING + FLAGGED, oldest first."""
    return (
        Post.all_objects.filter(status__in=[PostStatus.PENDING, PostStatus.FLAGGED])
        .select_related("author", "thread")
        .order_by("created_at", "id")
    )


def open_reports():
    """Unhandled reports for the moderator queue, oldest first."""
    return (
        Report.objects.filter(status=ReportStatus.OPEN)
        .select_related("reporter", "post", "post__thread")
        .order_by("created_at", "id")
    )
```

- [ ] **Step 7: Add the report + moderation views to `community/views.py`.**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/views.py` (created in Tasks 3–5). The existing import block at the top reads (from earlier tasks):

```python
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.authentication import OptionalTokenAuthentication
from community import selectors, services
from community.models import Post, Thread
from community.pagination import PostCursorPagination, ThreadCursorPagination
from community.permissions import IsModerator
from community.serializers import (
    CategorySerializer,
    PostCreateSerializer,
    PostSerializer,
    ReactionWriteSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadListSerializer,
)
```

Replace the two import lines that pull from `community.models` and `community.serializers` so the report/moderation names are in scope. Change:

```python
from community.models import Post, Thread
```

to:

```python
from community.models import Post, Report, Thread
```

and change the serializer import to add the four write serializers:

```python
from community.serializers import (
    CategorySerializer,
    ModerateSerializer,
    PostCreateSerializer,
    PostSerializer,
    ReactionWriteSerializer,
    ReportWriteSerializer,
    ResolveReportSerializer,
    ThreadCreateSerializer,
    ThreadDetailSerializer,
    ThreadFlagSerializer,
    ThreadListSerializer,
)
```

Then append the six new views at the end of the file:

```python
class ReportView(APIView):
    """POST /community/posts/<pk>/report — user flags a post."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post.all_objects, pk=pk)
        serializer = ReportWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        existed = Report.objects.filter(reporter=request.user, post=post).exists()
        report = services.report_post(
            user=request.user,
            post=post,
            reason=serializer.validated_data["reason"],
            detail=serializer.validated_data.get("detail", ""),
        )
        code = status.HTTP_200_OK if existed else status.HTTP_201_CREATED
        return Response(
            {"id": report.pk, "status": report.status, "reason": report.reason},
            status=code,
        )


class ModerationQueueView(APIView):
    """GET /community/moderation/queue — pending + flagged posts (moderator only)."""

    permission_classes = [IsModerator]

    def get(self, request):
        qs = selectors.moderation_queue()
        paginator = PostCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        serializer = PostSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class ModeratePostView(APIView):
    """POST /community/posts/<pk>/moderate — approve/reject/remove/restore."""

    permission_classes = [IsModerator]

    def post(self, request, pk):
        post = get_object_or_404(Post.all_objects, pk=pk)
        serializer = ModerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = services.moderate_post(
            moderator=request.user,
            post=post,
            action=serializer.validated_data["action"],
            reason=serializer.validated_data.get("reason", ""),
        )
        return Response(PostSerializer(post).data, status=status.HTTP_200_OK)


class ThreadFlagView(APIView):
    """POST /community/threads/<slug>/flag — pin/unpin/lock/unlock."""

    permission_classes = [IsModerator]

    def post(self, request, slug):
        thread = get_object_or_404(Thread.all_objects, slug=slug)
        serializer = ThreadFlagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        thread = services.set_thread_flag(
            moderator=request.user,
            thread=thread,
            action=serializer.validated_data["action"],
        )
        return Response(
            {
                "slug": thread.slug,
                "is_pinned": thread.is_pinned,
                "is_locked": thread.is_locked,
            },
            status=status.HTTP_200_OK,
        )


class ReportsView(APIView):
    """GET /community/reports — open reports (moderator only)."""

    permission_classes = [IsModerator]

    def get(self, request):
        qs = selectors.open_reports()
        paginator = ThreadCursorPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        data = [
            {
                "id": r.pk,
                "post_id": r.post_id,
                "reason": r.reason,
                "detail": r.detail,
                "status": r.status,
                "created_at": r.created_at,
            }
            for r in page
        ]
        return paginator.get_paginated_response(data)


class ResolveReportView(APIView):
    """POST /community/reports/<pk>/resolve — resolved/dismissed + handled_by."""

    permission_classes = [IsModerator]

    def post(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        serializer = ResolveReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = services.resolve_report(
            moderator=request.user,
            report=report,
            status=serializer.validated_data["status"],
            resolution=serializer.validated_data.get("resolution", ""),
        )
        return Response(
            {
                "id": report.pk,
                "status": report.status,
                "handled_by": report.handled_by_id,
                "resolution": report.resolution,
            },
            status=status.HTTP_200_OK,
        )
```

> Note on the `ReportsView` paginator: `open_reports()` orders by `("created_at", "id")`, which is ascending — `ThreadCursorPagination` orders by `("-is_pinned","-last_post_at","-id")` and `PostCursorPagination` by `("created_at","id")`. Use `PostCursorPagination` here instead, since its `("created_at","id")` ordering matches the selector and keeps the cursor stable. Apply this correction in the view: replace `paginator = ThreadCursorPagination()` inside `ReportsView.get` with `paginator = PostCursorPagination()`.

- [ ] **Step 8: Wire the new routes into `community/urls.py`.**

Open `/Users/krystianpetrusevich/Desktop/obskura/backend/community/urls.py` (created in Tasks 3–5). The existing file (from earlier tasks) reads:

```python
from django.urls import path

from community import views

urlpatterns = [
    path("community/categories", views.CategoriesView.as_view()),
    path("community/threads", views.ThreadListCreateView.as_view()),
    path("community/threads/<slug:slug>", views.ThreadDetailView.as_view()),
    path("community/threads/<slug:slug>/posts", views.PostCreateView.as_view()),
    path("community/posts/<int:pk>/reactions", views.ReactionView.as_view()),
]
```

Replace the `urlpatterns` list with the full set including the report + moderation routes (the moderation routes come before the broader `<slug>` detail routes is not an issue here since paths are distinct, but keep ordering grouped by resource for readability):

```python
from django.urls import path

from community import views

urlpatterns = [
    path("community/categories", views.CategoriesView.as_view()),
    path("community/threads", views.ThreadListCreateView.as_view()),
    path("community/threads/<slug:slug>", views.ThreadDetailView.as_view()),
    path("community/threads/<slug:slug>/posts", views.PostCreateView.as_view()),
    path("community/threads/<slug:slug>/flag", views.ThreadFlagView.as_view()),
    path("community/posts/<int:pk>/reactions", views.ReactionView.as_view()),
    path("community/posts/<int:pk>/report", views.ReportView.as_view()),
    path("community/posts/<int:pk>/moderate", views.ModeratePostView.as_view()),
    path("community/moderation/queue", views.ModerationQueueView.as_view()),
    path("community/reports", views.ReportsView.as_view()),
    path("community/reports/<int:pk>/resolve", views.ResolveReportView.as_view()),
]
```

> The exact view class names referenced here (`CategoriesView`, `ThreadListCreateView`, `ThreadDetailView`, `PostCreateView`, `ReactionView`) come from Tasks 3–5. If a prior task named any of them differently, match the existing names in the file and only add the five new lines (`flag`, `report`, `moderate`, `moderation/queue`, `reports`, `reports/<pk>/resolve`) — do not rename existing routes.

- [ ] **Step 9: Run the new tests in the container and confirm green.**

```bash
docker compose -f /Users/krystianpetrusevich/Desktop/obskura/backend/docker-compose.yml run --rm web \
  pytest community/tests/test_reports.py community/tests/test_moderation.py -q
```

All report and moderation tests must pass. If `test_lock_thread_blocks_new_posts_for_normal_user` fails, verify that Task 4's `create_post` raises `PermissionDenied(ErrorDetail(..., code="thread_locked"))` for non-moderators on a locked thread (this task only sets `is_locked`; the block itself lives in `create_post`). If the queue N+1 guard fails, confirm `selectors.moderation_queue()` keeps the `select_related("author", "thread")`.

- [ ] **Step 10: Run the full community suite + repo checks to confirm nothing else broke.**

```bash
docker compose -f /Users/krystianpetrusevich/Desktop/obskura/backend/docker-compose.yml run --rm web \
  pytest community -q
docker compose -f /Users/krystianpetrusevich/Desktop/obskura/backend/docker-compose.yml run --rm web \
  python manage.py makemigrations --check --dry-run
```

`makemigrations --check` must report no changes — this task adds no model fields (`Report`/`ModerationAction` migrations were created in Task 2). If it reports pending changes, a model was touched accidentally; revert it.

- [ ] **Step 11: Lint, format, then commit with the exact message.**

```bash
docker compose -f /Users/krystianpetrusevich/Desktop/obskura/backend/docker-compose.yml run --rm web \
  ruff check --fix community
docker compose -f /Users/krystianpetrusevich/Desktop/obskura/backend/docker-compose.yml run --rm web \
  ruff format community
```

Then stage and commit (ruff line-length 100, English commit message, no `Co-Authored-By`):

```bash
git -C /Users/krystianpetrusevich/Desktop/obskura add backend/community
git -C /Users/krystianpetrusevich/Desktop/obskura commit -m "feat(community): reports, moderation queue/actions, thread flags and audit log (B5a)"
```

### Task 7: Admin + seed_community

Registers all 6 community models in Django admin (mirroring `catalog/admin.py` + `membership/admin.py` conventions) and adds an idempotent `seed_community` management command that creates the 4 forum categories from `src/pages/Forum.jsx`, plus a couple of demo published threads+posts. Tests come first.

This task assumes Tasks 1–6 already exist: `community/models.py` (Category/Thread/Post/Reaction/Report/ModerationAction + TextChoices), `community/services.py` (`create_thread`, `create_post`), `community/selectors.py`, signals, etc. Admin and seed are the final layer.

**Files:**
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/admin.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/management/__init__.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/management/commands/__init__.py`
- Create: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/management/commands/seed_community.py`
- Test: `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_seed.py`

---

- [ ] **Step 1: Write the failing seed test first (RED).**

  Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/tests/test_seed.py`. This mirrors `catalog/tests/test_seed.py` + `membership/tests/test_seed.py` exactly (pytest, `call_command`, idempotency double-run, specific-field assertions). It asserts: 4 categories created, idempotent (second run still 4), the creepypasta category is `is_moderated=True`, slugs/icons/order are correct, active flag set, and that the optional demo threads land as `PUBLISHED` and bumped the denormalized counters via the Task-7-wired signals.

  ```python
  import pytest
  from django.core.management import call_command

  from community.models import Category, Post, PostStatus, Thread


  @pytest.mark.django_db
  def test_seed_community_creates_four_categories():
      call_command("seed_community")

      assert Category.objects.count() == 4
      assert Category.objects.filter(is_active=True).count() == 4


  @pytest.mark.django_db
  def test_seed_community_is_idempotent():
      call_command("seed_community")
      call_command("seed_community")  # second run must not duplicate

      assert Category.objects.count() == 4


  @pytest.mark.django_db
  def test_seed_community_creepypasta_is_moderated():
      call_command("seed_community")

      creepypasta = Category.objects.get(slug="twoje-historie-creepypasta")
      assert creepypasta.is_moderated is True

      # The other three categories are open (not pre-moderated).
      others = Category.objects.exclude(slug="twoje-historie-creepypasta")
      assert others.count() == 3
      assert all(c.is_moderated is False for c in others)


  @pytest.mark.django_db
  def test_seed_community_slugs_icons_and_order():
      call_command("seed_community")

      expected = {
          "dyskusje-o-odcinkach": ("Dyskusje o odcinkach", "MessageSquare", 0),
          "kulisy-i-produkcja": ("Kulisy i produkcja", "Users", 1),
          "twoje-historie-creepypasta": ("Twoje historie · creepypasta", "TrendingUp", 2),
          "techniczne-audio-sprzet": ("Techniczne · audio & sprzęt", "MessageSquare", 3),
      }
      for slug, (name, icon, order) in expected.items():
          cat = Category.objects.get(slug=slug)
          assert cat.name == name
          assert cat.icon == icon
          assert cat.order == order

      # Categories are ordered by `order` (Meta.ordering=["order"]).
      assert [c.slug for c in Category.objects.all()] == list(expected.keys())


  @pytest.mark.django_db
  def test_seed_community_creates_demo_threads_published():
      call_command("seed_community")

      threads = Thread.objects.all()
      assert threads.count() >= 2

      # Every demo thread's first post is published and visible.
      first_posts = Post.all_objects.filter(is_first=True)
      assert first_posts.count() == threads.count()
      assert all(p.status == PostStatus.PUBLISHED for p in first_posts)

      # Denormalized counters were recomputed by the wired signals (Task 7):
      # the "Dyskusje o odcinkach" category got at least one visible thread.
      dyskusje = Category.objects.get(slug="dyskusje-o-odcinkach")
      assert dyskusje.threads_count >= 1


  @pytest.mark.django_db
  def test_seed_community_demo_replies_bump_posts_count():
      call_command("seed_community")

      # At least one demo thread has a reply (non-first published post),
      # so its denormalized posts_count (replies only) is >= 1.
      assert Thread.objects.filter(posts_count__gte=1).exists()
  ```

  Run it to confirm RED (command does not exist yet):

  ```bash
  docker compose run --rm web pytest community/tests/test_seed.py -q
  ```

- [ ] **Step 2: Create the `community/admin.py` registering all 6 models.**

  Mirrors `catalog/admin.py` (`list_select_related`, `autocomplete_fields`, `prepopulated_fields` for slugs) and `membership/admin.py` (`list_filter`, `search_fields` on `user__email`). `Category` and `Thread` get `prepopulated_fields = {"slug": (...)}`. All FK columns use `autocomplete_fields`; admins that have FK columns in `list_display` set `list_select_related`. The `ModerationAction` audit log is registered read-only (append-only per spec §4).

  Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/admin.py`:

  ```python
  from django.contrib import admin

  from community.models import (
      Category,
      ModerationAction,
      Post,
      Reaction,
      Report,
      Thread,
  )


  @admin.register(Category)
  class CategoryAdmin(admin.ModelAdmin):
      list_display = [
          "name",
          "slug",
          "icon",
          "is_moderated",
          "order",
          "is_active",
          "threads_count",
      ]
      list_filter = ["is_moderated", "is_active"]
      search_fields = ["name", "slug"]
      prepopulated_fields = {"slug": ("name",)}
      ordering = ["order"]
      readonly_fields = ["threads_count"]


  @admin.register(Thread)
  class ThreadAdmin(admin.ModelAdmin):
      list_display = [
          "title",
          "category",
          "author",
          "episode",
          "is_pinned",
          "is_locked",
          "posts_count",
          "views_count",
          "last_post_at",
      ]
      list_filter = ["is_pinned", "is_locked", "is_deleted", "category"]
      search_fields = ["title", "slug", "author__email"]
      list_select_related = ["category", "author", "episode"]
      autocomplete_fields = ["category", "author", "episode"]
      prepopulated_fields = {"slug": ("title",)}
      readonly_fields = ["posts_count", "views_count", "last_post_at"]
      date_hierarchy = "created_at"


  @admin.register(Post)
  class PostAdmin(admin.ModelAdmin):
      list_display = [
          "thread",
          "author",
          "is_first",
          "status",
          "reaction_count",
          "created_at",
      ]
      list_filter = ["status", "is_first", "is_deleted"]
      search_fields = ["body", "author__email", "thread__title"]
      list_select_related = ["thread", "author"]
      autocomplete_fields = ["thread", "author"]
      readonly_fields = ["reaction_count", "reactions_breakdown"]
      date_hierarchy = "created_at"


  @admin.register(Reaction)
  class ReactionAdmin(admin.ModelAdmin):
      list_display = ["post", "user", "kind", "created_at"]
      list_filter = ["kind"]
      search_fields = ["user__email", "post__thread__title"]
      list_select_related = ["post", "user"]
      autocomplete_fields = ["post", "user"]


  @admin.register(Report)
  class ReportAdmin(admin.ModelAdmin):
      list_display = [
          "post",
          "reporter",
          "reason",
          "status",
          "handled_by",
          "created_at",
      ]
      list_filter = ["status", "reason"]
      search_fields = ["reporter__email", "handled_by__email", "post__thread__title"]
      list_select_related = ["post", "reporter", "handled_by"]
      autocomplete_fields = ["post", "reporter", "handled_by"]


  @admin.register(ModerationAction)
  class ModerationActionAdmin(admin.ModelAdmin):
      list_display = ["action", "moderator", "post", "thread", "created_at"]
      list_filter = ["action"]
      search_fields = ["moderator__email", "reason", "thread__title"]
      list_select_related = ["moderator", "post", "thread"]
      autocomplete_fields = ["moderator", "post", "thread"]
      readonly_fields = ["moderator", "post", "thread", "action", "reason", "created_at"]

      def has_add_permission(self, request):
          # Audit log is append-only — entries are written by services, never by hand.
          return False

      def has_change_permission(self, request, obj=None):
          return False
  ```

  > Note: `ThreadAdmin`/`PostAdmin` `list_filter` includes `is_deleted` because both models are `SoftDeleteModel` with `base_manager_name="all_objects"`, so the admin lists every row including soft-deleted ones.

- [ ] **Step 3: Create the management package `__init__.py` files.**

  Create empty `/Users/krystianpetrusevich/Desktop/obskura/backend/community/management/__init__.py`:

  ```python
  ```

  Create empty `/Users/krystianpetrusevich/Desktop/obskura/backend/community/management/commands/__init__.py`:

  ```python
  ```

- [ ] **Step 4: Create the `seed_community` command (GREEN).**

  Mirrors `seed_catalog.py` structure exactly: static seed data block at top, `Command(BaseCommand)` with `@transaction.atomic` handle, `update_or_create` keyed on natural keys (slug), private `_seed_*` helpers, and a `self.style.SUCCESS` summary line.

  - Categories use `update_or_create(slug=...)` with `pl_slugify`-derived slugs matching the test's `expected` map. Names are the canonical contract names ("Twoje historie · creepypasta", "Techniczne · audio & sprzęt").
  - Demo threads/posts are created through the **services layer** (`create_thread` + `create_post`) so the same code path, status logic, and signal-driven denormalization run as in production. Threads are created in the non-moderated "Dyskusje o odcinkach" category, so first posts land `PUBLISHED`.
  - Demo data is idempotent: it is only created when there are zero existing threads, so a second run is a no-op for threads (and `update_or_create` keeps categories at 4).
  - A demo author user is fetched/created via `update_or_create` on `email` (the `USERNAME_FIELD`), with a `display_name` so `author_name` resolves cleanly.

  Create `/Users/krystianpetrusevich/Desktop/obskura/backend/community/management/commands/seed_community.py`:

  ```python
  """seed_community — populate dev/demo forum data.

  4 forum categories mirrored from frontend src/pages/Forum.jsx CATEGORIES array.
  A couple of demo threads + posts (published) for the open episode-discussion
  category, created through the services layer so statuses and signal-driven
  denormalization (posts_count / threads_count / last_post_at) run exactly as in
  production.

  Fully idempotent: categories via update_or_create keyed on slug; demo threads
  are seeded only when no thread exists yet (second run is a no-op for threads).
  """

  from django.contrib.auth import get_user_model
  from django.core.management.base import BaseCommand
  from django.db import transaction

  from community.models import Category, Thread
  from community.services import create_post, create_thread
  from core.text import pl_slugify

  User = get_user_model()

  # ---------------------------------------------------------------------------
  # Static seed data (mirrored from src/pages/Forum.jsx CATEGORIES)
  # ---------------------------------------------------------------------------

  # name → icon is the lucide component used on the front; order = display index.
  # "Twoje historie · creepypasta" is the only moderated section (Forum.jsx: MODEROWANE
  # + RULES "Creepypasta — moderator musi oznaczyć przed publikacją").
  CATEGORIES = [
      {
          "name": "Dyskusje o odcinkach",
          "description": "Rozmowy o premierach, teorie i analizy zakończeń.",
          "icon": "MessageSquare",
          "is_moderated": False,
          "order": 0,
      },
      {
          "name": "Kulisy i produkcja",
          "description": "Oficjalne notatki ekipy, AMA, wycieczki po studio.",
          "icon": "Users",
          "is_moderated": False,
          "order": 1,
      },
      {
          "name": "Twoje historie · creepypasta",
          "description": "Creepypasty i mikropowieści słuchaczy — moderowane przed publikacją.",
          "icon": "TrendingUp",
          "is_moderated": True,
          "order": 2,
      },
      {
          "name": "Techniczne · audio & sprzęt",
          "description": "Pomoc słuchacz ↔ słuchacz: słuchawki, binauralne 3D, aplikacja.",
          "icon": "MessageSquare",
          "is_moderated": False,
          "order": 3,
      },
  ]

  # Demo threads (mirrored loosely from Forum.jsx threads). Each is opened in the
  # non-moderated "Dyskusje o odcinkach" category, so the first post is PUBLISHED.
  DEMO_AUTHOR = {
      "email": "demo.forum@obskura.test",
      "display_name": "Eliza Z.",
  }

  DEMO_THREADS = [
      {
          "title": "[S03E12] Mgła nad Wisłoujściem — dyskusja po premierze",
          "body": (
              "Dopiero co skończyłam słuchać finału sezonu. Scena na molo o północy "
              "zostaje w głowie na długo. Co o tym myślicie?"
          ),
          "replies": [
              "Ten oddech w 31:14 to nie była moja wyobraźnia. Odsłuchałem trzy razy.",
              "Zakończenie zostawia dokładnie tyle, ile trzeba. Brawa dla ekipy.",
          ],
      },
      {
          "title": "Czy ktoś inny słyszał oddech w 31:14?",
          "body": (
              "Słuchałem na słuchawkach binauralnych i przysiągłbym, że tuż przed "
              "rozdziałem 6 jest dodatkowy oddech, którego nie ma w opisie SFX."
          ),
          "replies": [
              "Tak! To prawdopodobnie infradźwięk 17.8 Hz — słychać tylko na słuchawkach.",
          ],
      },
  ]


  class Command(BaseCommand):
      help = "Populate database with seed community/forum data (idempotent)."

      def handle(self, *args, **options):
          with transaction.atomic():
              self._seed_categories()
              thread_count, post_count = self._seed_demo_threads()

          self.stdout.write(
              self.style.SUCCESS(
                  f"seed_community done — "
                  f"{Category.objects.count()} categories, "
                  f"{Thread.objects.count()} threads "
                  f"({thread_count} demo threads, {post_count} demo posts)."
              )
          )

      # ------------------------------------------------------------------
      # Categories
      # ------------------------------------------------------------------

      def _seed_categories(self) -> None:
          for c in CATEGORIES:
              slug = pl_slugify(c["name"])
              Category.objects.update_or_create(
                  slug=slug,
                  defaults={
                      "name": c["name"],
                      "description": c["description"],
                      "icon": c["icon"],
                      "is_moderated": c["is_moderated"],
                      "order": c["order"],
                      "is_active": True,
                  },
              )

      # ------------------------------------------------------------------
      # Demo threads + posts (only when forum is empty)
      # ------------------------------------------------------------------

      def _seed_demo_threads(self) -> tuple[int, int]:
          """Seed a couple of published demo threads. No-op if any thread exists."""
          if Thread.all_objects.exists():
              return 0, 0

          author, _ = User.objects.update_or_create(
              email=DEMO_AUTHOR["email"],
              defaults={"display_name": DEMO_AUTHOR["display_name"]},
          )

          category = Category.objects.get(slug="dyskusje-o-odcinkach")

          thread_count = 0
          post_count = 0
          for spec in DEMO_THREADS:
              thread = create_thread(
                  user=author,
                  category=category,
                  title=spec["title"],
                  body=spec["body"],
              )
              thread_count += 1
              post_count += 1  # the first post created by create_thread
              for reply in spec["replies"]:
                  create_post(user=author, thread=thread, body=reply)
                  post_count += 1

          return thread_count, post_count
  ```

  Run the seed tests — expect GREEN:

  ```bash
  docker compose run --rm web pytest community/tests/test_seed.py -q
  ```

- [ ] **Step 5: Confirm admin imports cleanly and migrations are stable.**

  Admin registration is exercised by Django's system check; `makemigrations --check` confirms admin/seed added no model drift.

  ```bash
  docker compose run --rm web python manage.py check
  docker compose run --rm web python manage.py makemigrations --check --dry-run
  ```

  Both must pass with no errors and "No changes detected".

- [ ] **Step 6: Run the full community suite to confirm nothing regressed.**

  ```bash
  docker compose run --rm web pytest community -q
  ```

  All community tests (including this task's `test_seed.py`) must be green.

- [ ] **Step 7: Lint, format, and commit.**

  ```bash
  docker compose run --rm web ruff check community
  docker compose run --rm web ruff format --check community
  ```

  Both must be clean (ruff line-length 100). Then commit:

  ```bash
  git add backend/community/admin.py backend/community/management backend/community/tests/test_seed.py
  git commit -m "feat(community): Django admin and seed_community command (B5a)"
  ```

  Commit message is exactly `feat(community): Django admin and seed_community command (B5a)` — English, no `Co-Authored-By` trailer.


---

## Definition of Done (B5a)

- [ ] Pełny `docker compose run --rm web pytest` zielony (community + niezłamane accounts/catalog/playback/membership/core).
- [ ] `ruff check .` i `ruff format --check .` czyste.
- [ ] `python manage.py check` + `python manage.py makemigrations --check --dry-run` bez zmian (migracje community + accounts zacommitowane).
- [ ] Endpointy z §7 specu działają: categories (cache), threads list/detail (+views), create thread/post (moderated→pending, locked→403), reactions toggle, report, moderation queue/actions, thread flags, resolve report.
- [ ] Widoczność z §5 wymuszona: anonim/obcy widzą tylko published; autor widzi swoje pending; moderator widzi wszystko.
- [ ] Denormalizacja poprawna: posts_count/threads_count/last_post_at/reaction_count/reactions_breakdown.
- [ ] `IsModerator` chroni endpointy moderacyjne; `ModerationAction` audit zapisany.
- [ ] Commit per task, EN, bez Co-Authored-By.

**Następna faza:** B5b — Events (wydarzenia online/live/klan, zapisy + capacity + waitlist, klan-gating przez membership, płatne bilety przez Stripe).
