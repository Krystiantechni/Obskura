from core.pagination import DefaultCursorPagination


class ThreadCursorPagination(DefaultCursorPagination):
    # Pinned-first, then newest activity; -id tiebreaker → deterministyczny kursor.
    ordering = ("-is_pinned", "-last_post_at", "-id")


class PostCursorPagination(DefaultCursorPagination):
    # Posty rosnąco (chronologia wątku); id tiebreaker dla stabilności kursora.
    ordering = ("created_at", "id")
