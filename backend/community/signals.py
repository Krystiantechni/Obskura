from django.core.cache import cache
from django.db.models import Count, Q
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from community.models import Category, Post, PostStatus, Reaction, Thread


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
    # .update() nie emituje post_save, więc cache kategorii (z threads_count) trzeba
    # zbić ręcznie — inaczej /community/categories serwuje nieaktualny licznik.
    try:
        cache.delete_pattern("community:*")
    except AttributeError:
        cache.delete_many(["community:categories"])


@receiver([post_save, post_delete], sender=Post)
def denorm_on_post_change(sender, instance, **kwargs):
    """Po każdej zmianie posta przelicz liczniki wątku i kategorii."""
    thread = Thread.all_objects.filter(pk=instance.thread_id).first()
    if thread is None:
        return
    _recompute_thread(thread)
    _recompute_category(thread.category)


@receiver([post_save, post_delete], sender=Reaction)
def recompute_post_reactions(sender, instance, **kwargs):
    """Denormalizacja reakcji na poście: reaction_count (total) + reactions_breakdown ({kind: n}).

    Liczone na Post.all_objects, by liczniki działały też dla soft-deleted postów.
    """
    rows = Reaction.objects.filter(post_id=instance.post_id).values("kind").annotate(n=Count("id"))
    breakdown = {row["kind"]: row["n"] for row in rows}
    total = sum(breakdown.values())
    Post.all_objects.filter(pk=instance.post_id).update(
        reaction_count=total, reactions_breakdown=breakdown
    )
