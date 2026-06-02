from core.pagination import DefaultCursorPagination


class NotificationCursorPagination(DefaultCursorPagination):
    ordering = ("-created_at", "-id")
