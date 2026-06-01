import factory
from django.utils import timezone

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
