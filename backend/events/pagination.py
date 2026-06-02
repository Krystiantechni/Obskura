from core.pagination import DefaultCursorPagination


class EventCursorPagination(DefaultCursorPagination):
    ordering = ("starts_at", "id")  # upcoming: soonest first


class PastEventCursorPagination(DefaultCursorPagination):
    ordering = ("-starts_at", "-id")  # past: most recent first
