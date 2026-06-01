from playback.models import Progress


def history(*, user):
    # Exclude soft-deleted episodes (CASCADE doesn't fire on soft-delete;
    # playback rows can point at hidden episodes). Filter is_deleted=False
    # so soft-deleted episodes don't surface in history.
    return Progress.objects.filter(user=user, episode__is_deleted=False).select_related(
        "episode", "episode__season", "episode__genre"
    )
