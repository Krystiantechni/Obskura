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
