from rest_framework.pagination import CursorPagination, PageNumberPagination

from core.pagination import DefaultCursorPagination, DefaultPageNumberPagination


def test_cursor_pagination_defaults():
    p = DefaultCursorPagination()
    assert issubclass(DefaultCursorPagination, CursorPagination)
    assert p.page_size == 20
    assert p.ordering == "-created_at"
    assert p.max_page_size == 100


def test_pagenumber_pagination_defaults():
    p = DefaultPageNumberPagination()
    assert issubclass(DefaultPageNumberPagination, PageNumberPagination)
    assert p.page_size == 20
    assert p.page_size_query_param == "page_size"
    assert p.max_page_size == 100
