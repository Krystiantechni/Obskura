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
