from rest_framework.pagination import CursorPagination, PageNumberPagination


class DefaultCursorPagination(CursorPagination):
    """Dla rosnących list (odcinki, posty, historia) — stabilna przy dopisywaniu."""

    page_size = 20
    max_page_size = 100
    page_size_query_param = "page_size"
    ordering = "-created_at"


class DefaultPageNumberPagination(PageNumberPagination):
    """Dla list skończonych (gatunki, plany, kategorie)."""

    page_size = 20
    max_page_size = 100
    page_size_query_param = "page_size"
