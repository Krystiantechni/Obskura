from core.pagination import DefaultCursorPagination


class EpisodeCursorPagination(DefaultCursorPagination):
    # -id jako tiebreaker → deterministyczna kolejność nawet przy równych published_at.
    ordering = ("-published_at", "-id")
